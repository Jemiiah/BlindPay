import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { writeContract, waitForTransactionReceipt, switchChain } from 'wagmi/actions';
import { wagmiConfig } from '../../hooks/WalletProvider';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { USDC_ADDRESS, MockUSDCABI } from '../../utils/evm-utils';

const MINT_AMOUNT = 10_000_000_000n; // 10,000 USDC (6 decimals)

const Faucet: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [minting, setMinting] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleMint = async () => {
        if (!address) return;
        setMinting(true);
        setError(null);
        setTxHash(null);

        try {
            try {
                await switchChain(wagmiConfig, { chainId: 11155111 });
            } catch {}

            const hash = await writeContract(wagmiConfig, {
                address: USDC_ADDRESS as `0x${string}`,
                abi: MockUSDCABI,
                functionName: 'mint',
                args: [address, MINT_AMOUNT],
                chainId: 11155111,
            });

            await waitForTransactionReceipt(wagmiConfig, { hash });
            setTxHash(hash);
        } catch (e: any) {
            setError(e.shortMessage || e.message || 'Mint failed');
        } finally {
            setMinting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="page-container relative min-h-screen">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-2xl mx-auto pt-10 relative z-10 pb-20"
            >
                {/* HEADER */}
                <motion.div variants={itemVariants} className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter text-white">
                        Testnet <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-primary to-neon-accent">Faucet</span>
                    </h1>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                        Get free testnet tokens to try BlindPay on Sepolia.
                    </p>
                </motion.div>

                {/* USDC FAUCET */}
                <GlassCard variants={itemVariants} className="p-8 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-lg">
                            $
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Test USDC</h2>
                            <p className="text-xs text-gray-500">MockUSDC on Sepolia</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-6">
                        Mint <span className="text-white font-bold">10,000 USDC</span> to your wallet. This is a test token with no real value — mint as many times as you need.
                    </p>

                    {!isConnected ? (
                        <div className="text-center py-4 text-gray-500 text-sm border border-white/5 rounded-xl bg-white/5">
                            Connect your wallet to mint test USDC.
                        </div>
                    ) : (
                        <Button
                            className="w-full"
                            onClick={handleMint}
                            disabled={minting}
                        >
                            {minting ? 'Minting...' : 'Mint 10,000 USDC'}
                        </Button>
                    )}

                    {txHash && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <p className="text-green-400 text-sm font-bold mb-1">Minted successfully!</p>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-400/70 hover:text-green-300 font-mono break-all underline"
                            >
                                {txHash}
                            </a>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}
                </GlassCard>

                {/* ETH FAUCET LINKS */}
                <GlassCard variants={itemVariants} className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-lg">
                            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1.5l-7 10.8L12 16l7-3.7L12 1.5zM12 22.5l-7-9.8L12 17l7-4.3-7 9.8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Sepolia ETH</h2>
                            <p className="text-xs text-gray-500">Needed for gas fees & ETH invoices</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-400 mb-6">
                        You need Sepolia ETH for gas fees and to pay ETH-denominated invoices. Get free ETH from these faucets:
                    </p>

                    <div className="flex flex-col gap-3">
                        {[
                            { name: 'Google Cloud Faucet', url: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia' },
                            { name: 'Alchemy Faucet', url: 'https://sepoliafaucet.com' },
                            { name: 'Infura Faucet', url: 'https://www.infura.io/faucet/sepolia' },
                        ].map((faucet) => (
                            <a
                                key={faucet.name}
                                href={faucet.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all group"
                            >
                                <span className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                                    {faucet.name}
                                </span>
                                <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        ))}
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Faucet;
