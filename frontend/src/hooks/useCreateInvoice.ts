import { useState } from "react";
import { useWallet } from "./useWallet";
import { writeContract, waitForTransactionReceipt, switchChain } from "wagmi/actions";
import { wagmiConfig } from "./WalletProvider";
import {
    generateSalt,
    generateClaimSecret,
    computeClaimHash,
    parseAmount,
    CONTRACT_ADDRESS,
    BlindPayABI,
} from "../utils/evm-utils";
import { encryptAmount, encryptAddress, FheRelayerError } from "../utils/fhe";
import { InvoiceData } from "../types/invoice";

export type InvoiceType = "standard" | "multipay" | "donation";

export const useCreateInvoice = () => {
    const { address: publicKey, isConnected, isWrongChain } = useWallet();

    const [amount, setAmount] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [memo, setMemo] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [invoiceType, setInvoiceType] = useState<InvoiceType>("standard");
    const [tokenType, setTokenType] = useState<number>(0);

    const handleCreate = async () => {
        if (!publicKey || !isConnected) {
            setStatus("Please connect your wallet first.");
            return;
        }
        if (isWrongChain) {
            try {
                setStatus("Switching to Sepolia...");
                await switchChain(wagmiConfig, { chainId: 11155111 });
            } catch {
                setStatus("Please switch to Sepolia network in your wallet.");
                return;
            }
        }

        if (invoiceType !== "donation" && (!amount || amount <= 0)) {
            setStatus("Please enter a valid amount.");
            return;
        }

        setLoading(true);
        setStatus("Creating invoice...");

        try {
            const merchant = publicKey;
            const salt = generateSalt();
            const claimSecret = generateClaimSecret();
            const isDonation = invoiceType === "donation";
            const amountRaw = isDonation ? 0n : parseAmount(Number(amount));

            // Compute claim hash for commitment scheme
            const claimHash = computeClaimHash(
                merchant as `0x${string}`,
                salt,
                claimSecret
            );

            // Determine invoice type number
            let invoiceTypeNum = 0;
            if (invoiceType === "multipay") invoiceTypeNum = 1;
            if (invoiceType === "donation") invoiceTypeNum = 2;

            // Encrypt amount for FHE
            setStatus("Encrypting amount...");
            const { handle: encAmountHandle, inputProof: amountProof } = await encryptAmount(
                CONTRACT_ADDRESS,
                merchant,
                amountRaw
            );

            // Encrypt merchant address for FHE
            setStatus("Encrypting merchant address...");
            const { handle: encMerchantHandle, inputProof: merchantProof } = await encryptAddress(
                CONTRACT_ADDRESS,
                merchant,
                merchant
            );

            // Submit to blockchain
            setStatus("Submitting to blockchain...");
            const txHash = await writeContract(wagmiConfig, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: BlindPayABI,
                functionName: "createInvoice",
                args: [
                    encAmountHandle,
                    amountProof,
                    encMerchantHandle,
                    merchantProof,
                    salt,
                    claimHash,
                    invoiceTypeNum,
                    tokenType,
                ],
                account: publicKey as `0x${string}`,
                chainId: 11155111,
            });

            setStatus("Waiting for confirmation...");
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            // Save to backend DB for indexing
            setStatus("Saving invoice...");
            try {
                const { createInvoice } = await import("../services/api");
                await createInvoice({
                    invoice_hash: salt, // Use salt as the primary identifier now
                    merchant_address: merchant,
                    status: "PENDING",
                    salt: salt,
                    invoice_type: invoiceTypeNum,
                    token_type: tokenType,
                    invoice_transaction_id: txHash,
                });
            } catch (dbErr) {
                console.warn("Failed to save invoice to DB:", dbErr);
            }

            // Build payment link (merchant address still needed for claim verification offline)
            const params = new URLSearchParams({
                merchant,
                amount: amount?.toString() || "0",
                salt,
            });
            if (memo) params.append("memo", memo);
            if (invoiceType === "multipay") params.append("type", "multipay");
            if (invoiceType === "donation") params.append("type", "donation");
            if (tokenType === 1) params.append("token", "usdc");

            const link = `${window.location.origin}/pay?${params.toString()}`;

            setInvoiceData({
                merchant,
                amount: Number(amount),
                salt,
                claimSecret,
                link,
            });
            setStatus("Invoice created successfully!");
        } catch (error: any) {
            console.error(error);
            if (error instanceof FheRelayerError) {
                setStatus("FHE encryption service is temporarily unavailable. Zama's testnet relayer may be down — please try again in a few minutes.");
            } else {
                setStatus(`Error: ${error.shortMessage || error.message || "Failed to create invoice"}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const resetInvoice = () => {
        setInvoiceData(null);
        setAmount("");
        setMemo("");
        setStatus("");
        setInvoiceType("standard");
        setTokenType(0);
    };

    return {
        amount,
        setAmount,
        memo,
        setMemo,
        status,
        loading,
        invoiceData,
        handleCreate,
        resetInvoice,
        publicKey: publicKey || null,
        invoiceType,
        setInvoiceType,
        tokenType,
        setTokenType,
    };
};
