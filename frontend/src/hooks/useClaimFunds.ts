import { useState } from "react";
import { useWallet } from "./useWallet";
import { writeContract, waitForTransactionReceipt, switchChain } from "wagmi/actions";
import { wagmiConfig } from "./WalletProvider";
import { CONTRACT_ADDRESS, BlindPayABI } from "../utils/evm-utils";

export const useClaimFunds = () => {
    const { address: publicKey, isConnected, isWrongChain } = useWallet();

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const claimFunds = async (salt: string, claimSecret: string) => {
        if (!publicKey || !isConnected) {
            setError("Please connect your wallet first.");
            return;
        }

        if (isWrongChain) {
            try {
                setStatus("Switching to Sepolia...");
                await switchChain(wagmiConfig, { chainId: 11155111 });
            } catch {
                setError("Please switch to Sepolia network in your wallet.");
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);
            setStatus("Claiming funds...");

            const txHash = await writeContract(wagmiConfig, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: BlindPayABI,
                functionName: "claimFunds",
                args: [salt as `0x${string}`, claimSecret as `0x${string}`],
                account: publicKey as `0x${string}`,
                chainId: 11155111,
            });

            setStatus("Waiting for confirmation...");
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            setTxId(txHash);
            setStatus("Funds claimed successfully!");
        } catch (e: any) {
            console.error(e);
            setError(e.shortMessage || e.message || "Claim failed");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setLoading(false);
        setStatus("");
        setTxId(null);
        setError(null);
    };

    return {
        claimFunds,
        loading,
        status,
        txId,
        error,
        reset,
    };
};
