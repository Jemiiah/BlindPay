import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";
import { toHex } from "viem";

let instance: FhevmInstance | null = null;
let initPromise: Promise<FhevmInstance> | null = null;

/**
 * Get or create the singleton FHE instance.
 * Uses a promise guard to prevent concurrent initialization from StrictMode.
 */
export const getFheInstance = async (): Promise<FhevmInstance> => {
    if (instance) return instance;
    if (initPromise) return initPromise;
    initPromise = (async () => {
        await initSDK();
        instance = await createInstance({
            ...SepoliaConfig,
            network: import.meta.env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
        });
        return instance;
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
    const fhe = await getFheInstance();
    const input = fhe.createEncryptedInput(contractAddress, signerAddress);
    input.addAddress(addressToEncrypt);

    const encrypted = await input.encrypt();

    return {
        handle: ensureHex(encrypted.handles[0]),
        inputProof: ensureHex(encrypted.inputProof),
    };
};
