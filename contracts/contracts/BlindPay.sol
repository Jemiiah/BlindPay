// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BlindPay - Confidential invoice payments using Zama FHE
/// @notice Invoice amounts are stored as FHE-encrypted euint64 on-chain.
///         Merchant running totals are encrypted. Only authorized parties can decrypt.
contract BlindPay is ZamaEthereumConfig, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint8 public constant TOKEN_ETH = 0;
    uint8 public constant TOKEN_USDC = 1;

    uint8 public constant TYPE_STANDARD = 0;
    uint8 public constant TYPE_MULTIPAY = 1;
    uint8 public constant TYPE_DONATION = 2;

    uint8 public constant STATUS_PENDING = 0;
    uint8 public constant STATUS_SETTLED = 1;

    // --- Structs ---
    struct Invoice {
        address merchant;
        euint64 encAmount; // FHE-encrypted amount (6-decimal format)
        bytes32 commitHash; // keccak256(abi.encodePacked(merchant, amount, salt))
        uint8 tokenType;
        uint8 invoiceType;
        uint8 status;
        uint256 paymentCount;
    }

    // --- State ---
    IERC20 public usdcToken;
    mapping(bytes32 => Invoice) private invoices; // salt => Invoice
    mapping(bytes32 => bool) public receiptExists; // receiptHash => bool
    mapping(address => euint64) private merchantTotals; // encrypted running totals
    mapping(address => uint256) public invoiceCount; // per-merchant count

    // --- Events ---
    event InvoiceCreated(
        bytes32 indexed salt,
        address indexed merchant,
        bytes32 commitHash,
        uint8 tokenType,
        uint8 invoiceType
    );

    event PaymentMade(
        bytes32 indexed salt,
        address indexed payer,
        bytes32 receiptHash,
        uint8 tokenType
    );

    event PaymentReceived(
        bytes32 indexed salt,
        address indexed merchant,
        bytes32 receiptHash,
        uint8 tokenType
    );

    // --- Constructor ---
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
    }

    // =========================================================================
    //                           INVOICE CREATION
    // =========================================================================

    /// @notice Create a new invoice with an FHE-encrypted amount
    /// @param encAmount  Encrypted amount (externalEuint64 from client-side FHE encryption)
    /// @param inputProof ZKPoK proof for the encrypted input
    /// @param salt       Unique bytes32 identifier for this invoice
    /// @param commitHash keccak256(abi.encodePacked(merchant, amount, salt)) computed client-side
    /// @param invoiceType 0=standard, 1=multipay, 2=donation
    /// @param tokenType   0=ETH, 1=USDC
    function createInvoice(
        externalEuint64 encAmount,
        bytes calldata inputProof,
        bytes32 salt,
        bytes32 commitHash,
        uint8 invoiceType,
        uint8 tokenType
    ) external {
        require(invoices[salt].merchant == address(0), "Salt already used");
        require(tokenType <= TOKEN_USDC, "Invalid token type");
        require(invoiceType <= TYPE_DONATION, "Invalid invoice type");

        // Validate and convert encrypted input
        euint64 amount = FHE.fromExternal(encAmount, inputProof);

        // Set ACL: contract can operate on this value, merchant can decrypt it
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);

        invoices[salt] = Invoice({
            merchant: msg.sender,
            encAmount: amount,
            commitHash: commitHash,
            tokenType: tokenType,
            invoiceType: invoiceType,
            status: STATUS_PENDING,
            paymentCount: 0
        });

        invoiceCount[msg.sender]++;

        emit InvoiceCreated(salt, msg.sender, commitHash, tokenType, invoiceType);
    }

    // =========================================================================
    //                              PAYMENT
    // =========================================================================

    /// @notice Pay an existing invoice
    /// @param salt   The invoice identifier
    /// @param amount The payment amount in 6-decimal format (must match commitHash for standard invoices)
    /// @dev For ETH payments: send msg.value = amount * 1e12 (converting 6-dec to 18-dec wei)
    ///      For USDC payments: approve this contract first, then call with msg.value = 0
    function payInvoice(
        bytes32 salt,
        uint256 amount
    ) external payable nonReentrant {
        Invoice storage inv = invoices[salt];
        require(inv.merchant != address(0), "Invoice not found");
        require(
            inv.invoiceType == TYPE_MULTIPAY || inv.status == STATUS_PENDING,
            "Invoice already settled"
        );

        // --- CHECKS ---
        if (inv.invoiceType == TYPE_STANDARD) {
            // Verify the payer's amount matches the invoice commitment
            bytes32 expectedHash = keccak256(
                abi.encodePacked(inv.merchant, amount, salt)
            );
            require(expectedHash == inv.commitHash, "Amount mismatch");
        } else {
            // Donation and multipay accept any amount > 0
            require(amount > 0, "Amount must be > 0");
        }

        // --- EFFECTS (before external calls) ---
        inv.paymentCount++;
        if (inv.invoiceType != TYPE_MULTIPAY) {
            inv.status = STATUS_SETTLED;
        }

        // Generate unique receipt hash
        bytes32 receiptHash = keccak256(
            abi.encodePacked(msg.sender, salt, block.timestamp, inv.paymentCount)
        );
        receiptExists[receiptHash] = true;

        // Encrypt payment amount and update merchant running total
        euint64 encPayment = FHE.asEuint64(uint64(amount));
        FHE.allowThis(encPayment);

        if (FHE.isInitialized(merchantTotals[inv.merchant])) {
            merchantTotals[inv.merchant] = FHE.add(
                merchantTotals[inv.merchant],
                encPayment
            );
        } else {
            merchantTotals[inv.merchant] = encPayment;
        }
        FHE.allowThis(merchantTotals[inv.merchant]);
        FHE.allow(merchantTotals[inv.merchant], inv.merchant);

        // --- INTERACTIONS (external calls last) ---
        if (inv.tokenType == TOKEN_ETH) {
            // Convert 6-decimal amount to 18-decimal wei
            uint256 expectedWei = amount * 1e12;
            require(msg.value >= expectedWei, "Insufficient ETH");

            (bool sent, ) = payable(inv.merchant).call{value: expectedWei}("");
            require(sent, "ETH transfer failed");

            // Refund excess ETH
            if (msg.value > expectedWei) {
                (bool refunded, ) = payable(msg.sender).call{
                    value: msg.value - expectedWei
                }("");
                require(refunded, "ETH refund failed");
            }
        } else {
            require(msg.value == 0, "Do not send ETH for token payment");
            usdcToken.safeTransferFrom(msg.sender, inv.merchant, amount);
        }

        emit PaymentMade(salt, msg.sender, receiptHash, inv.tokenType);
        emit PaymentReceived(salt, inv.merchant, receiptHash, inv.tokenType);
    }

    // =========================================================================
    //                           VIEW FUNCTIONS
    // =========================================================================

    /// @notice Get invoice metadata (encrypted amount NOT returned)
    function getInvoice(bytes32 salt)
        external
        view
        returns (
            address merchant,
            uint8 tokenType,
            uint8 invoiceType,
            uint8 status,
            uint256 paymentCount,
            bytes32 commitHash
        )
    {
        Invoice storage inv = invoices[salt];
        return (
            inv.merchant,
            inv.tokenType,
            inv.invoiceType,
            inv.status,
            inv.paymentCount,
            inv.commitHash
        );
    }

    /// @notice Check if a receipt hash exists on-chain
    function verifyReceipt(bytes32 receiptHash) external view returns (bool) {
        return receiptExists[receiptHash];
    }

    // =========================================================================
    //                              ADMIN
    // =========================================================================

    /// @notice Update the USDC token address (for migration without redeployment)
    function updateUsdcToken(address _newUsdc) external onlyOwner {
        require(_newUsdc != address(0), "Invalid address");
        usdcToken = IERC20(_newUsdc);
    }
}
