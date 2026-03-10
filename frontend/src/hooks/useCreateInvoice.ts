import { useState } from "react";
import { useWallet } from "./useWallet";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { wagmiConfig } from "./WalletProvider";
import {
    generateSalt,
    computeInvoiceHash,
    parseAmount,
    CONTRACT_ADDRESS,
    BlindPayABI,
} from "../utils/evm-utils";
import { encryptAmount } from "../utils/fhe";
import { InvoiceData } from "../types/invoice";

export type InvoiceType = "standard" | "multipay" | "donation";

export const useCreateInvoice = () => {
    const { address: publicKey, isConnected } = useWallet();

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

        if (invoiceType !== "donation" && (!amount || amount <= 0)) {
            setStatus("Please enter a valid amount.");
            return;
        }

        setLoading(true);
        setStatus("Creating invoice...");

        try {
            const merchant = publicKey;
            const salt = generateSalt();
            const isDonation = invoiceType === "donation";
            const amountRaw = isDonation ? 0n : parseAmount(Number(amount));

            // Compute commitment hash (mirrors on-chain keccak256)
            const commitHash = computeInvoiceHash(
                merchant as `0x${string}`,
                amountRaw,
                salt
            );

            // Determine invoice type number
            let invoiceTypeNum = 0;
            if (invoiceType === "multipay") invoiceTypeNum = 1;
            if (invoiceType === "donation") invoiceTypeNum = 2;

            // Encrypt amount for FHE (calldata will contain ciphertext, not plaintext)
            setStatus("Encrypting amount...");
            const { handle: encHandle, inputProof } = await encryptAmount(
                CONTRACT_ADDRESS,
                merchant,
                amountRaw
            );

            // Submit to blockchain
            setStatus("Submitting to blockchain...");
            const txHash = await writeContract(wagmiConfig, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: BlindPayABI,
                functionName: "createInvoice",
                args: [encHandle, inputProof, salt, commitHash, invoiceTypeNum, tokenType],
            });

            setStatus("Waiting for confirmation...");
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            // Save to backend DB for indexing
            setStatus("Saving invoice...");
            try {
                const { createInvoice } = await import("../services/api");
                await createInvoice({
                    invoice_hash: commitHash,
                    merchant_address: merchant,
                    status: "PENDING",
                    salt: salt,
                    invoice_type: invoiceTypeNum,
                    token_type: tokenType,
                    invoice_transaction_id: txHash,
                });
            } catch (dbErr) {
                console.error("Failed to save invoice to DB:", dbErr);
            }

            // Build payment link
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
                hash: commitHash,
                link,
            });
            setStatus("Invoice created successfully!");
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message || "Failed to create invoice"}`);
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
