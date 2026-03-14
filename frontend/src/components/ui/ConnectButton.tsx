import React, { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "../../utils/evm-utils";

interface ConnectButtonProps {
    className?: string;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ className = "" }) => {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [showDropdown, setShowDropdown] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setError(null);
            }
        };
        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showDropdown]);

    const handleConnect = (connector: typeof connectors[number]) => {
        setError(null);
        connect(
            { connector },
            {
                onSuccess: () => {
                    setShowDropdown(false);
                },
                onError: (err) => {
                    const msg = (err as Error).message || String(err);
                    if (msg.includes("wallet must has") || msg.includes("no accounts")) {
                        setError("Wallet has no accounts. Please create or unlock an account in your wallet extension, then try again.");
                    } else if (msg.includes("rejected") || (err as { code?: number }).code === 4001) {
                        setError("Connection rejected by user.");
                    } else {
                        setError(msg.length > 100 ? msg.slice(0, 100) + "…" : msg);
                    }
                },
            }
        );
    };

    if (isConnected && address) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] ${className}`}
                >
                    {shortenAddress(address)}
                </button>

                {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 z-50 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 min-w-[200px] shadow-2xl">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(address);
                                setShowDropdown(false);
                            }}
                            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl py-2.5 px-3 font-sans text-sm text-white transition-all text-left w-full"
                        >
                            Copy Address
                        </button>
                        <button
                            onClick={() => {
                                disconnect();
                                setShowDropdown(false);
                            }}
                            className="flex items-center gap-3 bg-white/5 hover:bg-red-900/30 border border-white/5 hover:border-red-500/30 rounded-xl py-2.5 px-3 font-sans text-sm text-red-400 transition-all text-left w-full mt-1.5"
                        >
                            Disconnect
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    setError(null);
                }}
                className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] ${className}`}
            >
                Connect Wallet
            </button>

            {showDropdown && (
                <div className="absolute right-0 top-full mt-2 z-50 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 min-w-[240px] shadow-2xl">
                    <p className="text-white/50 text-xs px-2 mb-2">Select a wallet</p>

                    {connectors.length === 0 ? (
                        <div className="px-2 py-3">
                            <p className="text-white/70 text-sm mb-2">No wallet detected.</p>
                            <a
                                href="https://metamask.io/download/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                            >
                                Install MetaMask
                            </a>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {connectors.map((connector) => (
                                <button
                                    key={connector.uid}
                                    onClick={() => handleConnect(connector)}
                                    disabled={isPending}
                                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl py-2.5 px-3 font-sans text-sm text-white transition-all text-left w-full disabled:opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">
                                        {connector.name.toLowerCase().includes("metamask") ? "🦊" :
                                         connector.name.toLowerCase().includes("okx") ? "⬡" :
                                         connector.name.toLowerCase().includes("coinbase") ? "🔵" :
                                         connector.name.toLowerCase().includes("wallet connect") ? "🔗" : "👛"}
                                    </div>
                                    <span>{isPending ? "Connecting..." : connector.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="mt-2 bg-red-900/50 border border-red-500/20 rounded-xl p-2.5">
                            <p className="text-red-200 text-xs">{error}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
