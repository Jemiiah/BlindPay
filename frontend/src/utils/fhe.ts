import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/web";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/web";

let instance: FhevmInstance | null = null;

/**
 * Get or create the singleton FHE instance.
 * Uses Zama's Sepolia config by default.
 */
export const getFheInstance = async (): Promise<FhevmInstance> => {
    if (instance) return instance;
    instance = await createInstance(SepoliaConfig);
    return instance;
};

/**
 * Encrypt a uint64 amount for sending to the BlindPay contract.
 * Returns { handle, inputProof } ready for contract call parameters.
 *
 * @param contractAddress - The BlindPay contract address
 * @param signerAddress   - The wallet address of the signer
 * @param amount          - The amount to encrypt (6-decimal format integer)
 */
export const encryptAmount = async (
    contractAddress: string,
    signerAddress: string,
    amount: number | bigint
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> => {
    const fhe = await getFheInstance();
    const input = fhe.createEncryptedInput(contractAddress, signerAddress);
    // Ensure amount stays within safe integer range for add64
    const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
    if (numAmount > Number.MAX_SAFE_INTEGER) {
        throw new Error('Amount exceeds safe integer range for FHE encryption');
    }
    input.add64(numAmount);
    const encrypted = await input.encrypt();
    return {
        handle: encrypted.handles[0] as `0x${string}`,
        inputProof: encrypted.inputProof as `0x${string}`,
    };
};
