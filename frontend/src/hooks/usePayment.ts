import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "./useWallet";
import {
    readContract,
    writeContract,
    waitForTransactionReceipt,
    switchChain,
} from "wagmi/actions";
import { wagmiConfig } from "./WalletProvider";
import {
    generateSalt,
    parseAmount,
    CONTRACT_ADDRESS,
    USDC_ADDRESS,
    BlindPayABI,
    MockUSDCABI,
} from "../utils/evm-utils";
import { encryptAmount, FheRelayerError } from "../utils/fhe";

export type PaymentStep =
    | "CONNECT"
    | "VERIFY"
    | "PAY"
    | "SUCCESS"
    | "ALREADY_PAID";

export const usePayment = () => {
    const [searchParams] = useSearchParams();
    const { address: publicKey, isConnected, isWrongChain, switchToSepolia } = useWallet();

    const [invoice, setInvoice] = useState<{
        merchant: string;
        amount: number;
        salt: string;
        memo: string;
        tokenType: number;
        invoiceType: number;
    } | null>(null);

    const [donationAmount, setDonationAmount] = useState<string>("");
    const [status, setStatus] = useState<string>("Initializing...");
    const [step, setStep] = useState<PaymentStep>("CONNECT");
    const [loading, setLoading] = useState(false);
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentSecret] = useState<string>(generateSalt());
    const [receiptHash] = useState<string | null>(null);
    const [receiptSearchFailed] = useState(false);

    // Parse and verify invoice on mount (only when searchParams change)
    useEffect(() => {
        const init = async () => {
            const merchant = searchParams.get("merchant");
            const amount = searchParams.get("amount");
            const salt = searchParams.get("salt");
            const memo = searchParams.get("memo") || "";
            const tokenParam = searchParams.get("token");
            const tokenType = tokenParam === "usdc" ? 1 : 0;
            const typeParam = searchParams.get("type");
            const initialType =
                typeParam === "donation" ? 2 : typeParam === "multipay" ? 1 : 0;

            if (!merchant || !salt) {
                setError("Invalid Invoice Link: Missing parameters");
                return;
            }
            if (!amount && initialType !== 2) {
                setError("Invalid Invoice Link: Missing amount");
                return;
            }

            setError(null);

            try {
                setLoading(true);
                setStatus("Verifying invoice...");

                // V2: getInvoice returns [tokenType, invoiceType, paymentCount, hasBeenCreated]
                try {
                    const onChainInvoice = (await readContract(wagmiConfig, {
                        address: CONTRACT_ADDRESS as `0x${string}`,
                        abi: BlindPayABI,
                        functionName: "getInvoice",
                        args: [salt as `0x${string}`],
                    })) as [number, number, bigint, boolean];

                    const onChainPaymentCount = Number(onChainInvoice[2]);
                    const hasBeenCreated = onChainInvoice[3];

                    if (hasBeenCreated) {
                        // For standard invoices (not multipay), check if already paid
                        const onChainInvoiceType = onChainInvoice[1];
                        if (onChainInvoiceType !== 1 && onChainPaymentCount > 0) {
                            setInvoice({
                                merchant,
                                amount: Number(amount) || 0,
                                salt,
                                memo,
                                tokenType,
                                invoiceType: initialType,
                            });
                            setStep("ALREADY_PAID");
                            setLoading(false);
                            return;
                        }
                    }
                } catch {
                    // Contract not deployed or not reachable — fall through to DB
                }

                // Fallback: check DB
                let dbInvoice = null;
                try {
                    const { fetchInvoiceByHash } = await import(
                        "../services/api"
                    );
                    dbInvoice = await fetchInvoiceByHash(salt);
                } catch {
                    // Not in DB either — that's fine for new invoices
                }

                if (dbInvoice && dbInvoice.status === "SETTLED") {
                    if (dbInvoice.payment_tx_id) {
                        setTxId(dbInvoice.payment_tx_id);
                    }
                    setInvoice({
                        merchant,
                        amount: Number(amount) || 0,
                        salt,
                        memo,
                        tokenType,
                        invoiceType: initialType,
                    });
                    setStep("ALREADY_PAID");
                    setLoading(false);
                    return;
                }

                setInvoice({
                    merchant,
                    amount: Number(amount) || 0,
                    salt,
                    memo,
                    tokenType,
                    invoiceType: initialType,
                });

                setStatus("");
            } catch (err) {
                console.error(err);
                setError("Failed to verify invoice.");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [searchParams]);

    // Advance step when wallet connects
    useEffect(() => {
        if (isConnected && step === "CONNECT") {
            setStep("PAY");
        }
    }, [isConnected, step]);

    const payInvoice = async () => {
        if (!invoice || !publicKey) return;

        if (isWrongChain) {
            try {
                setStatus("Switching to Sepolia...");
                await switchChain(wagmiConfig, { chainId: 11155111 });
                // Give mobile wallets time to settle after chain switch
                await new Promise((r) => setTimeout(r, 1000));
            } catch {
                setError("Please switch to Sepolia network in your wallet.");
                return;
            }
        }

        try {
            setLoading(true);
            setError(null);

            // Determine payment amount (6-decimal)
            const payAmount =
                invoice.invoiceType === 2
                    ? parseAmount(donationAmount || "0")
                    : parseAmount(invoice.amount);

            // For USDC: approve contract to spend tokens first
            if (invoice.tokenType === 1) {
                setStatus("Approving USDC spend...");
                const approveHash = await writeContract(wagmiConfig, {
                    address: USDC_ADDRESS as `0x${string}`,
                    abi: MockUSDCABI,
                    functionName: "approve",
                    args: [CONTRACT_ADDRESS as `0x${string}`, payAmount],
                    account: publicKey as `0x${string}`,
                    chainId: 11155111,
                });
                await waitForTransactionReceipt(wagmiConfig, {
                    hash: approveHash,
                });
            }

            // Encrypt the payment amount with FHE
            setStatus("Encrypting payment amount...");
            const { handle: encPayHandle, inputProof } = await encryptAmount(
                CONTRACT_ADDRESS,
                publicKey,
                payAmount
            );

            setStatus("Submitting payment...");

            // For ETH: convert 6-decimal to 18-decimal wei
            const ethValue =
                invoice.tokenType === 0 ? payAmount * 1_000_000_000_000n : 0n;

            // USDC: pass plaintext amount for transferFrom (visible in ERC20 event anyway)
            const usdcAmount = invoice.tokenType === 1 ? payAmount : 0n;

            const txHash = await writeContract(wagmiConfig, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: BlindPayABI,
                functionName: "payInvoice",
                args: [
                    invoice.salt as `0x${string}`,
                    encPayHandle,
                    inputProof,
                    usdcAmount,
                ],
                value: ethValue,
                account: publicKey as `0x${string}`,
                chainId: 11155111,
            });

            setStatus("Waiting for confirmation...");
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            setTxId(txHash);

            // Update backend DB
            try {
                const { updateInvoiceStatus } = await import(
                    "../services/api"
                );
                await updateInvoiceStatus(invoice.salt, {
                    status: "SETTLED",
                    payment_tx_ids: [txHash],
                });
            } catch (dbErr) {
                console.warn("DB update failed:", dbErr);
            }

            setStep("SUCCESS");
            setStatus("");
        } catch (e: any) {
            console.error(e);
            if (e instanceof FheRelayerError) {
                setError("FHE encryption service is temporarily unavailable. Zama's testnet relayer may be down — please try again in a few minutes.");
            } else {
                setError(e.shortMessage || e.message || "Payment failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!isConnected) return;
        setStep("PAY");
    };

    return {
        step,
        status,
        loading,
        error,
        invoice,
        txId,
        conversionTxId: null as string | null,
        publicKey: publicKey || null,
        payInvoice,
        handleConnect,
        programId: CONTRACT_ADDRESS,
        paymentSecret,
        receiptHash,
        receiptSearchFailed,
        donationAmount,
        setDonationAmount,
        isWrongChain,
        switchToSepolia,
    };
};
