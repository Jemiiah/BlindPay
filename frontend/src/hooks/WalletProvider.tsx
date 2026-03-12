import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
    chains: [sepolia],
    connectors: [
        injected(),
    ],
    transports: {
        [sepolia.id]: http(
            import.meta.env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"
        ),
    },
});

const queryClient = new QueryClient();

interface WalletProviderProps {
    children: React.ReactNode;
}

export const BlindPayWalletProvider = ({ children }: WalletProviderProps) => {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
};
