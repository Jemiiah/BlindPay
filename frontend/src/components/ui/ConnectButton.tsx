import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { shortenAddress } from "../../utils/evm-utils";

interface ConnectButtonProps {
    className?: string;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ className = "" }) => {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [showOptions, setShowOptions] = useState(false);

    const handleConnect = () => {
        // Find the injected connector (MetaMask, OKX, etc.)
        const injectedConnector = connectors.find((c) => c.type === "injected");

        if (injectedConnector) {
            connect({ connector: injectedConnector });
        } else if (connectors.length > 0) {
            // Show connector options if no injected wallet found
            setShowOptions(true);
        } else {
            alert("No wallet found. Please install MetaMask or OKX Wallet.");
        }
    };

    if (isConnected && address) {
        return (
            <button
                onClick={() => disconnect()}
                className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] ${className}`}
            >
                {shortenAddress(address)}
            </button>
        );
    }

    if (showOptions) {
        return (
            <div className="flex flex-col gap-2">
                {connectors.map((connector) => (
                    <button
                        key={connector.uid}
                        onClick={() => {
                            connect({ connector });
                            setShowOptions(false);
                        }}
                        disabled={isPending}
                        className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all ${className}`}
                    >
                        {isPending ? "Connecting..." : connector.name}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <button
            onClick={handleConnect}
            disabled={isPending}
            className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] ${className}`}
        >
            {isPending ? "Connecting..." : "Connect Wallet"}
        </button>
    );
};
