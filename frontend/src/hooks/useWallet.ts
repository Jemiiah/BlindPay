import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

export const useWallet = () => {
    const { address, isConnected, chain } = useAccount();
    const { connect, isPending: isConnecting, connectors, error } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

    const isWrongChain = isConnected && !!chain && chain.id !== sepolia.id;

    // Auto-switch to Sepolia when connected on wrong chain
    useEffect(() => {
        if (isWrongChain && switchChain) {
            switchChain({ chainId: sepolia.id });
        }
    }, [isWrongChain, switchChain]);

    const connectWallet = async () => {
        try {
            const injectedConnector = connectors.find((c) => c.id === "injected");
            if (injectedConnector) {
                connect({ connector: injectedConnector });
            } else if (connectors.length > 0) {
                connect({ connector: connectors[0] });
            } else {
                console.error("No wallet connectors available.");
                alert("No wallet detected. Please install MetaMask or another Web3 wallet extension.");
            }
        } catch (err) {
            console.error("Failed to connect wallet:", err);
        }
    };

    const switchToSepolia = async () => {
        if (isWrongChain && switchChain) {
            switchChain({ chainId: sepolia.id });
        }
    };

    return {
        address,
        isConnected,
        chain,
        isConnecting,
        isWrongChain,
        connectWallet,
        switchToSepolia,
        disconnect,
        error,
    };
};
