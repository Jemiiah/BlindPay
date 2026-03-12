// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, externalEuint64, euint64, externalEaddress, eaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BlindPay V2 - Fully Confidential Invoice Payments using Zama FHE
/// @notice All sensitive data (amounts, merchant, payer, status) is FHE-encrypted.
///         Funds are held in the contract and claimed by merchants via a commitment scheme.
contract BlindPay is ZamaEthereumConfig, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint8 public constant TOKEN_ETH = 0;
    uint8 public constant TOKEN_USDC = 1;

    uint8 public constant TYPE_STANDARD = 0;
    uint8 public constant TYPE_MULTIPAY = 1;
    uint8 public constant TYPE_DONATION = 2;

    // --- Structs ---
    struct Invoice {
        eaddress encMerchant;   // encrypted merchant address
        euint64  encAmount;     // encrypted amount (6-decimal format)
        eaddress encPayer;      // encrypted payer (set on payment)
        ebool    isPaid;        // encrypted status
        uint8    tokenType;     // 0=ETH, 1=USDC (plaintext, needed for control flow)
        uint8    invoiceType;   // 0=standard, 1=multipay, 2=donation (plaintext)
        uint256  paymentCount;  // counter (plaintext, used as status proxy)
    }

    // --- State ---
    IERC20 public usdcToken;
    mapping(bytes32 => Invoice) private invoices;          // salt => Invoice
    mapping(bytes32 => bytes32) private claimHashes;       // salt => keccak256(merchant, salt, claimSecret)
    mapping(bytes32 => uint256) private heldAmounts;       // salt => funds held in contract (wei for ETH, 6-dec for USDC)
    mapping(bytes32 => bool) public receiptExists;         // receiptHash => bool
    mapping(address => uint256) public invoiceCount;       // per-merchant count

    // --- Events (privacy-preserving: no addresses, no amounts) ---
    event InvoiceCreated(bytes32 indexed salt);
    event PaymentMade(bytes32 indexed salt, bytes32 receiptHash);
    event FundsClaimed(bytes32 indexed salt);

    // --- Constructor ---
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
    }

    // =========================================================================
    //                           INVOICE CREATION
    // =========================================================================

    /// @notice Create a new invoice with FHE-encrypted amount and merchant address
    /// @param encAmount         Encrypted amount (externalEuint64)
    /// @param inputProofAmount  ZKPoK proof for the encrypted amount
    /// @param encMerchantExt    Encrypted merchant address (externalEaddress)
    /// @param inputProofMerchant ZKPoK proof for the encrypted merchant
    /// @param salt              Unique bytes32 identifier for this invoice
    /// @param claimHash         keccak256(abi.encodePacked(merchant, salt, claimSecret))
    /// @param invoiceType       0=standard, 1=multipay, 2=donation
    /// @param tokenType         0=ETH, 1=USDC
    function createInvoice(
        externalEuint64 encAmount,
        bytes calldata inputProofAmount,
        externalEaddress encMerchantExt,
        bytes calldata inputProofMerchant,
        bytes32 salt,
        bytes32 claimHash,
        uint8 invoiceType,
        uint8 tokenType
    ) external {
        require(invoices[salt].paymentCount == 0 && !FHE.isInitialized(invoices[salt].encAmount), "Salt already used");
        require(tokenType <= TOKEN_USDC, "Invalid token type");
        require(invoiceType <= TYPE_DONATION, "Invalid invoice type");

        // Convert encrypted inputs
        euint64 amount = FHE.fromExternal(encAmount, inputProofAmount);
        eaddress merchant = FHE.fromExternal(encMerchantExt, inputProofMerchant);

        // Set ACL: contract can operate, creator can decrypt
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);
        FHE.allowThis(merchant);
        FHE.allow(merchant, msg.sender);

        // Initialize encrypted fields
        ebool paid = FHE.asEbool(false);
        FHE.allowThis(paid);
        FHE.allow(paid, msg.sender);

        eaddress zeroPayer = FHE.asEaddress(address(0));
        FHE.allowThis(zeroPayer);

        invoices[salt] = Invoice({
            encMerchant: merchant,
            encAmount: amount,
            encPayer: zeroPayer,
            isPaid: paid,
            tokenType: tokenType,
            invoiceType: invoiceType,
            paymentCount: 0
        });

        claimHashes[salt] = claimHash;
        invoiceCount[msg.sender]++;

        emit InvoiceCreated(salt);
    }

    // =========================================================================
    //                              PAYMENT
    // =========================================================================

    /// @notice Pay an existing invoice. Funds are held in the contract until merchant claims.
    /// @param salt         The invoice identifier
    /// @param encPayAmount Encrypted payment amount (externalEuint64)
    /// @param inputProof   ZKPoK proof for the encrypted payment amount
    /// @param usdcAmount   Plaintext USDC amount for transferFrom (ignored for ETH).
    ///                     Acceptable because USDC Transfer events already leak amounts.
    function payInvoice(
        bytes32 salt,
        externalEuint64 encPayAmount,
        bytes calldata inputProof,
        uint256 usdcAmount
    ) external payable nonReentrant {
        Invoice storage inv = invoices[salt];
        require(FHE.isInitialized(inv.encAmount), "Invoice not found");
        require(
            inv.invoiceType == TYPE_MULTIPAY || inv.paymentCount == 0,
            "Invoice already paid"
        );

        // Convert encrypted payment amount
        euint64 payAmount = FHE.fromExternal(encPayAmount, inputProof);
        FHE.allowThis(payAmount);

        // --- EFFECTS ---
        inv.paymentCount++;

        if (inv.invoiceType != TYPE_MULTIPAY) {
            ebool paid = FHE.asEbool(true);
            FHE.allowThis(paid);
            inv.isPaid = paid;
        }

        // Store encrypted payer
        eaddress encPayer = FHE.asEaddress(msg.sender);
        FHE.allowThis(encPayer);
        inv.encPayer = encPayer;

        // Generate receipt hash (salt + timestamp + paymentCount — no addresses)
        bytes32 receiptHash = keccak256(
            abi.encodePacked(salt, block.timestamp, inv.paymentCount)
        );
        receiptExists[receiptHash] = true;

        // --- INTERACTIONS ---
        if (inv.tokenType == TOKEN_ETH) {
            require(msg.value > 0, "Must send ETH");
            heldAmounts[salt] += msg.value;
        } else {
            require(msg.value == 0, "Do not send ETH for USDC payment");
            require(usdcAmount > 0, "USDC amount must be > 0");
            usdcToken.safeTransferFrom(msg.sender, address(this), usdcAmount);
            heldAmounts[salt] += usdcAmount;
        }

        emit PaymentMade(salt, receiptHash);
    }

    // =========================================================================
    //                           FUND CLAIMING
    // =========================================================================

    /// @notice Merchant claims held funds using the commitment scheme
    /// @param salt        The invoice identifier
    /// @param claimSecret The secret used when creating the invoice
    function claimFunds(bytes32 salt, bytes32 claimSecret) external nonReentrant {
        require(
            keccak256(abi.encodePacked(msg.sender, salt, claimSecret)) == claimHashes[salt],
            "Invalid claim"
        );

        Invoice storage inv = invoices[salt];
        require(inv.paymentCount > 0, "No payments to claim");

        uint256 amount = heldAmounts[salt];
        require(amount > 0, "No funds to claim");

        // Zero out before transfer
        heldAmounts[salt] = 0;

        if (inv.tokenType == TOKEN_ETH) {
            (bool sent, ) = payable(msg.sender).call{value: amount}("");
            require(sent, "ETH transfer failed");
        } else {
            usdcToken.safeTransfer(msg.sender, amount);
        }

        emit FundsClaimed(salt);
    }

    // =========================================================================
    //                           VIEW FUNCTIONS
    // =========================================================================

    /// @notice Get non-sensitive invoice metadata
    function getInvoice(bytes32 salt)
        external
        view
        returns (
            uint8 tokenType,
            uint8 invoiceType,
            uint256 paymentCount,
            bool hasBeenCreated
        )
    {
        Invoice storage inv = invoices[salt];
        bool created = FHE.isInitialized(inv.encAmount);
        return (
            inv.tokenType,
            inv.invoiceType,
            inv.paymentCount,
            created
        );
    }

    /// @notice Check if a receipt hash exists on-chain
    function verifyReceipt(bytes32 receiptHash) external view returns (bool) {
        return receiptExists[receiptHash];
    }

    // =========================================================================
    //                              ADMIN
    // =========================================================================

    /// @notice Update the USDC token address
    function updateUsdcToken(address _newUsdc) external onlyOwner {
        require(_newUsdc != address(0), "Invalid address");
        usdcToken = IERC20(_newUsdc);
    }

    /// @notice Accept ETH deposits
    receive() external payable {}
}
