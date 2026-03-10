import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * Thin wrapper around wagmi hooks to provide a unified wallet interface.
 * Provides a unified wallet interface using wagmi hooks.
 */
export const useWallet = () => {
    const { address, isConnected, chain } = useAccount();
    const { connect, isPending: isConnecting, connectors, error } = useConnect();
    const { disconnect } = useDisconnect();

    const connectWallet = async () => {
        try {
            // Try to connect with injected wallet first (MetaMask, etc.)
            const injectedConnector = connectors.find((c) => c.id === "injected");

            if (injectedConnector) {
                connect({ connector: injectedConnector });
            } else {
                // Fallback to any available connector
                if (connectors.length > 0) {
                    connect({ connector: connectors[0] });
                } else {
                    console.error("No wallet connectors available. Please install MetaMask or another Web3 wallet.");
                    alert("No wallet detected. Please install MetaMask or another Web3 wallet extension.");
                }
            }
        } catch (err) {
            console.error("Failed to connect wallet:", err);
        }
    };

    return {
        address,
        isConnected,
        chain,
        isConnecting,
        connectWallet,
        disconnect,
        error,
    };
};
