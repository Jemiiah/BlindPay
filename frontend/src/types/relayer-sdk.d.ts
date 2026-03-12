declare module "@zama-fhe/relayer-sdk/web" {
    export interface FhevmInstance {
        createEncryptedInput(
            contractAddress: string,
            signerAddress: string
        ): {
            add64(value: number | bigint): any;
            addBool(value: boolean): any;
            add8(value: number): any;
            addAddress(value: string): any;
            encrypt(): Promise<{
                handles: string[];
                inputProof: string;
            }>;
        };
        publicDecrypt(
            handles: string[]
        ): Promise<{
            clearValues: Record<string, bigint | boolean | string>;
            abiEncodedClearValues: string;
            decryptionProof: string;
        }>;
    }

    export interface FhevmConfig {
        aclContractAddress: string;
        kmsContractAddress: string;
        inputVerifierContractAddress: string;
        verifyingContractAddressDecryption: string;
        verifyingContractAddressInputVerification: string;
        chainId: number;
        gatewayChainId: number;
        network: string;
        relayerUrl: string;
    }

    export const SepoliaConfig: FhevmConfig;

    export function createInstance(config: FhevmConfig): Promise<FhevmInstance>;

    export function initSDK(): Promise<void>;
}
