import { useState } from 'react';
import { motion } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { usePayment, PaymentStep } from '../../hooks/usePayment';
import { useWallet } from '../../hooks/useWallet';
import { ConnectButton } from '../../components/ui/ConnectButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Shimmer } from '../../components/ui/Shimmer';
import { Input } from '../../components/ui/Input';
import { getExplorerTxUrl } from '../../utils/evm-utils';

const PaymentPage = () => {
    const {
        step,
        status,
        loading,
        error,
        invoice,
        txId,
        handleConnect,
        payInvoice,
        paymentSecret,
        receiptHash,
        donationAmount,
        setDonationAmount,
        isWrongChain,
        switchToSepolia
    } = usePayment();

    const [copiedHash, setCopiedHash] = useState(false);
    const { isConnected } = useWallet();
    const isProcess = loading;

    const handlePay = async () => {
        await payInvoice();
    };

    const steps: { key: PaymentStep; label: string }[] = [
        { key: 'CONNECT', label: '1. Connect' },
        { key: 'VERIFY', label: '2. Verify' },
        { key: 'PAY', label: '3. Pay' },
    ];

    const isMultiPay = invoice?.invoiceType === 1;
    const currencyLabel = invoice?.tokenType === 1 ? 'USDC' : 'ETH';

    return (
        <motion.div
            className="page-container flex flex-col items-center justify-center min-h-[85vh]"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg"
            >
                {/* STATUS HEADER */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter text-white">
                        {step === 'SUCCESS' ? 'Blind Payment' : step === 'ALREADY_PAID' ? 'Blind Invoice' : 'Make'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">{step === 'SUCCESS' ? 'Successful' : step === 'ALREADY_PAID' ? 'Paid' : 'Blind Payment'}</span>
                    </h1>

                    {invoice && !error && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 bg-neon-primary/10 px-4 py-2 rounded-full border border-neon-primary/20 shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                        >
                            <svg className="w-5 h-5 text-neon-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-bold text-neon-primary tracking-wide uppercase">
                                Verified On-Chain
                            </span>
                        </motion.div>
                    )}
                </div>

                <GlassCard variant="heavy" className="p-8 relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="flex justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -z-0" />
                        {steps.map((s, index) => {
                            let isActive = s.key === step ||
                                ((step === 'SUCCESS' || step === 'ALREADY_PAID') && s.key === 'PAY') ||
                                (steps.findIndex(x => x.key === step) > index);

                            return (
                                <div key={s.key} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive
                                        ? 'bg-neon-primary border-neon-primary text-black shadow-[0_0_10px_rgba(0,243,255,0.5)]'
                                        : 'bg-black border-gray-700 text-gray-500'
                                        }`}>
                                        {isActive ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="text-xs font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold tracking-wider uppercase transition-colors ${isActive ? 'text-neon-primary' : 'text-gray-600'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* INVOICE DETAILS */}
                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 mb-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Merchant</span>
                            {loading && !invoice ? (
                                <Shimmer className="h-6 w-32 bg-white/5 rounded" />
                            ) : (
                                <span className="font-mono text-white text-sm bg-white/5 px-2 py-1 rounded">
                                    {invoice?.merchant ? `${invoice.merchant.slice(0, 10)}...${invoice.merchant.slice(-5)}` : 'Unknown'}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Amount</span>
                            {loading && !invoice ? (
                                <Shimmer className="h-8 w-24 bg-white/5 rounded" />
                            ) : (
                                invoice?.amount === 0 ? (
                                    <div className="w-1/2">
                                        <Input
                                            label=""
                                            type="number"
                                            placeholder="Enter donation"
                                            value={donationAmount}
                                            onChange={(e) => setDonationAmount(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <span className="text-2xl font-bold text-white tracking-tight">{invoice?.amount || '0'} <span className="text-sm text-gray-500 font-normal">{currencyLabel}</span></span>
                                )
                            )}
                        </div>
                        {invoice?.memo && (
                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Memo</span>
                                <span className="text-gray-300">{invoice?.memo || '-'}</span>
                            </div>
                        )}

                        {/* MULTI PAY EXTRA INPUTS */}
                        {isMultiPay && step !== 'SUCCESS' && step !== 'CONNECT' && step !== 'ALREADY_PAID' && (
                            <div className="pt-4 border-t border-white/5 space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-neon-primary uppercase tracking-widest block mb-1">Your Payment Secret</span>
                                    <div className="bg-neon-primary/10 border border-neon-primary/20 p-2 rounded-lg break-all font-mono text-xs text-neon-primary relative hover:bg-neon-primary/20 transition-colors cursor-copy" onClick={() => paymentSecret && navigator.clipboard.writeText(paymentSecret)}>
                                        {paymentSecret || 'Generating...'}
                                        <div className="absolute top-1 right-2 text-[10px] opacity-70">COPY</div>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Save this secret! You'll need it to prove payment to the merchant.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTION AREA */}
                    <div className="space-y-4">
                        {error && (
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-center">
                                <p className="text-white text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {status && !error && step !== 'ALREADY_PAID' && step !== 'SUCCESS' && (
                            <div className="text-center p-3 bg-neon-primary/10 rounded-xl border border-neon-primary/20">
                                <p className="text-neon-primary text-sm font-mono animate-pulse">{status}</p>
                            </div>
                        )}

                        {(step === 'SUCCESS' || step === 'ALREADY_PAID') ? (
                            <div className="text-center space-y-4">
                                <p className="text-gray-400">
                                    {step === 'ALREADY_PAID'
                                        ? 'This invoice has already been settled on-chain.'
                                        : 'The transaction has been settled on-chain.'}
                                </p>
                                {isMultiPay && step !== 'ALREADY_PAID' && receiptHash && (
                                    <div className="bg-black/40 border border-neon-primary/30 p-4 rounded-xl text-left space-y-3">
                                        <p className="text-xs text-neon-primary uppercase font-bold mb-1">Your Receipt Hash</p>
                                        <div className="bg-neon-primary/10 border border-neon-primary/20 p-2 rounded break-all font-mono text-xs text-white relative cursor-copy hover:bg-neon-primary/20 transition-colors" onClick={() => {
                                            navigator.clipboard.writeText(receiptHash);
                                            setCopiedHash(true);
                                            setTimeout(() => setCopiedHash(false), 2000);
                                        }}>
                                            {receiptHash}
                                            <div className={`absolute top-1 right-2 text-[10px] font-bold transition-colors ${copiedHash ? 'text-neon-primary' : 'opacity-70 text-gray-400'}`}>
                                                {copiedHash ? 'COPIED!' : 'COPY'}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {txId && (
                                    <Button
                                        variant="primary"
                                        onClick={() => window.open(getExplorerTxUrl(txId), '_blank')}
                                    >
                                        View Transaction
                                    </Button>
                                )}
                            </div>
                        ) : step === 'CONNECT' ? (
                            <div className="flex flex-col gap-3">
                                <ConnectButton className="w-full !bg-neon-primary !text-black !font-bold !rounded-xl !h-12" />
                                {isConnected && (
                                    <Button variant="secondary" onClick={handleConnect}>
                                        Continue with Connected Wallet
                                    </Button>
                                )}
                            </div>
                        ) : step === 'VERIFY' ? (
                            <Button variant="primary" onClick={handleConnect} className="w-full">
                                Verify Hash & Records
                            </Button>
                        ) : isWrongChain ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-xl text-center">
                                    <p className="text-yellow-300 text-sm font-medium">Your wallet is on the wrong network. Please switch to Sepolia to continue.</p>
                                </div>
                                <Button variant="primary" onClick={switchToSepolia} className="w-full" glow>
                                    Switch to Sepolia
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handlePay}
                                disabled={isProcess}
                                className="w-full"
                                glow
                            >
                                {isProcess ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    `Pay ${(invoice?.amount || 0) > 0 ? invoice?.amount : (donationAmount || '0')} ${currencyLabel}`
                                )}
                            </Button>
                        )}
                    </div>
                </GlassCard>

                <p className="text-center mt-8 text-xs font-medium text-gray-500 uppercase tracking-widest">
                    Secured by Fully Homomorphic Encryption
                </p>
            </motion.div>
        </motion.div>
    );
};

export default PaymentPage;
