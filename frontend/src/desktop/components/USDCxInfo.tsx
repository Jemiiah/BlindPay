import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const USDCxInfo: React.FC = () => {
    return (
        <section className="relative z-10 pt-12 pb-20 overflow-hidden">
            {/* BACKGROUND GLOW */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-neon-primary/5 rounded-full blur-[150px] pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto px-6">

                {/* HERO SECTION */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center mb-6"
                >

                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-primary to-neon-accent">Encrypted USDC</span>?
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Control what you share on your terms. BlindPay uses Fully Homomorphic Encryption (FHE) to enable confidential USDC transfers where amounts and balances remain encrypted on-chain.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            variant="ghost"
                            className="h-12 px-8 text-base text-neon-primary hover:text-neon-accent hover:bg-neon-primary/10 border border-neon-primary/20"
                            onClick={() => window.open('https://docs.zama.ai/fhevm', '_blank')}
                        >
                            Learn about fhEVM
                            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-12 px-8 text-base text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                            onClick={() => window.open('https://faucet.circle.com/', '_blank')}
                        >
                            Get Sepolia USDC
                            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </Button>
                    </div>
                </motion.div>

                {/* FOOTER / DISCLAIMER */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeInUp}
                    className="text-center border-t border-white/5 pt-4"
                >
                    <p className="text-xs text-gray-500 max-w-4xl mx-auto leading-relaxed mb-8">
                        BlindPay uses Zama's fhEVM to enable confidential ERC-20 transfers on EVM-compatible chains. Encrypted USDC balances are stored as FHE ciphertexts on-chain, meaning amounts remain hidden from all parties except the transaction participants. The privacy features described apply exclusively to transactions processed through the BlindPay smart contract on fhEVM-enabled networks.
                    </p>

                </motion.div>

            </div>
        </section>
    );
};
