import { keccak256, encodePacked, toHex, parseUnits, formatUnits } from "viem";
import BlindPayABI from "../abi/BlindPay.json";
import MockUSDCABI from "../abi/MockUSDC.json";

export { BlindPayABI, MockUSDCABI };

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "0x0000000000000000000000000000000000000000";

// All amounts use 6-decimal format (matches USDC native decimals)
// For ETH: 1 ETH = 1_000_000 in 6-decimal format
// Contract converts 6-dec to 18-dec wei internally (amount * 1e12)
export const TOKEN_DECIMALS = 6;
export const DISPLAY_DECIMALS = 6;

/**
 * Generate a random salt as bytes32
 */
export const generateSalt = (): `0x${string}` => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return toHex(randomBytes) as `0x${string}`;
};

/**
 * Compute invoice hash: keccak256(abi.encodePacked(merchant, amount, salt))
 * Amount is in 6-decimal format as uint256
 * This mirrors the on-chain commitment hash computation
 */
export const computeInvoiceHash = (
    merchant: `0x${string}`,
    amount: bigint,
    salt: `0x${string}`
): `0x${string}` => {
    return keccak256(
        encodePacked(
            ["address", "uint256", "bytes32"],
            [merchant, amount, salt]
        )
    );
};

/**
 * Parse human-readable amount to 6-decimal on-chain units
 * "100" → 100_000_000n (100 USDC)
 * "0.5" → 500_000n (0.5 ETH in 6-decimal)
 */
export const parseAmount = (amount: string | number): bigint => {
    return parseUnits(amount.toString(), TOKEN_DECIMALS);
};

/**
 * Format 6-decimal on-chain units to human-readable
 */
export const formatAmount = (amount: bigint): string => {
    return formatUnits(amount, TOKEN_DECIMALS);
};

/**
 * Shorten an address for display: 0x1234...abcd
 */
export const shortenAddress = (address: string, chars = 4): string => {
    if (!address) return "";
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Get block explorer URL for a transaction
 */
export const getExplorerTxUrl = (txHash: string): string => {
    const baseUrl = import.meta.env.VITE_EXPLORER_URL || "https://sepolia.etherscan.io";
    return `${baseUrl}/tx/${txHash}`;
};

/**
 * Get block explorer URL for an address
 */
export const getExplorerAddressUrl = (address: string): string => {
    const baseUrl = import.meta.env.VITE_EXPLORER_URL || "https://sepolia.etherscan.io";
    return `${baseUrl}/address/${address}`;
};

// ---- Types matching the on-chain contract ----

export interface InvoiceRecord {
    invoiceHash: `0x${string}`;
    merchant: `0x${string}`;
    amount: bigint;
    tokenType: number; // 0 = native (ETH), 1 = ERC-20 (USDC)
    invoiceType: number; // 0 = standard, 1 = multipay, 2 = donation
    salt: `0x${string}`;
    memo: string;
    status: number; // 0 = pending, 1 = settled
}

export interface PayerReceipt {
    receiptHash: `0x${string}`;
    invoiceHash: `0x${string}`;
    payer: `0x${string}`;
    merchant: `0x${string}`;
    amount: bigint;
    tokenType: number;
    timestamp: number;
}

export interface MerchantReceipt {
    receiptHash: `0x${string}`;
    invoiceHash: `0x${string}`;
    merchant: `0x${string}`;
    amount: bigint;
    tokenType: number;
}
