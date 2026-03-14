import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { toHex } from "viem";

let instance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

const isRelayerError = (err: unknown): boolean => {
    const msg = err instanceof Error ? err.message : String(err);
    return (
        msg.includes("Bad JSON") ||
        msg.includes("ERR_CONNECTION") ||
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("relayer")
    );
};

export class FheRelayerError extends Error {
    constructor(cause?: unknown) {
        super(
            "FHE encryption service is temporarily unavailable. Zama's testnet relayer may be down — please try again in a few minutes."
        );
        this.name = "FheRelayerError";
        this.cause = cause;
    }
}

/**
 * Get or create the singleton FHE instance.
 * Uses a promise guard to prevent concurrent initialization from StrictMode.
 * Retries up to 3 times on network failures (WASM is ~4.7MB and can fail on slow connections).
 */
export const getFheInstance = async (): Promise<FhevmInstance> => {
    if (instance) return instance;
    if (initPromise) return initPromise;
    initPromise = (async () => {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await initSDK();
                instance = await createInstance({
                    ...SepoliaConfig,
                    network: import.meta.env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
                });
                return instance;
            } catch (err) {
                instance = null;
                const isNetworkErr =
                    err instanceof Error &&
                    (err.message.includes("NetworkError") ||
                        err.message.includes("network") ||
                        err.message.includes("aborted") ||
                        err.message.includes("ERR_NETWORK"));
                if (isNetworkErr && attempt < maxRetries) {
                    await new Promise((r) => setTimeout(r, 1000 * attempt));
                    continue;
                }
                initPromise = null;
                if (isRelayerError(err)) throw new FheRelayerError(err);
                throw err;
            }
        }
        // Should not reach here, but satisfy TS
        initPromise = null;
        throw new Error("FHE initialization failed after retries");
    })();
    return initPromise;
};

export const resetFheInstance = () => {
    instance = null;
    initPromise = null;
};

/**
 * Convert unknown bytes to a 0x-prefixed hex string for viem.
 */
const ensureHex = (v: unknown): `0x${string}` => {
    if (v instanceof Uint8Array) return toHex(v);
    if (typeof v === "string" && v.startsWith("0x")) return v as `0x${string}`;
    if (typeof v === "string") return `0x${v}` as `0x${string}`;
    throw new Error(`Cannot convert to hex: ${typeof v}`);
};

/**
 * Encrypt a uint64 amount for sending to the BlindPay contract.
 * Returns { handle, inputProof } as hex strings ready for viem writeContract.
 */
export const encryptAmount = async (
    contractAddress: string,
    signerAddress: string,
    amount: number | bigint
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> => {
    try {
        const fhe = await getFheInstance();
        const input = fhe.createEncryptedInput(contractAddress, signerAddress);

        const bigAmount = typeof amount === 'bigint' ? amount : BigInt(amount);
        if (bigAmount > BigInt("18446744073709551615")) {
            throw new Error('Amount exceeds uint64 range for FHE encryption');
        }
        input.add64(bigAmount);

        const encrypted = await input.encrypt();

        return {
            handle: ensureHex(encrypted.handles[0]),
            inputProof: ensureHex(encrypted.inputProof),
        };
    } catch (err) {
        if (err instanceof FheRelayerError) throw err;
        if (isRelayerError(err)) throw new FheRelayerError(err);
        throw err;
    }
};

/**
 * Encrypt an address for sending to the BlindPay contract (eaddress).
 * Returns { handle, inputProof } as hex strings ready for viem writeContract.
 */
export const encryptAddress = async (
    contractAddress: string,
    signerAddress: string,
    addressToEncrypt: string
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> => {
    try {
        const fhe = await getFheInstance();
        const input = fhe.createEncryptedInput(contractAddress, signerAddress);
        input.addAddress(addressToEncrypt);

        const encrypted = await input.encrypt();

        return {
            handle: ensureHex(encrypted.handles[0]),
            inputProof: ensureHex(encrypted.inputProof),
        };
    } catch (err) {
        if (err instanceof FheRelayerError) throw err;
        if (isRelayerError(err)) throw new FheRelayerError(err);
        throw err;
    }
};
