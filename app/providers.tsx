"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { arcTestnet } from "@/lib/chains";
import { WALLETCONNECT_PROJECT_ID } from "@/lib/env";
import { useState } from "react";

const config = getDefaultConfig({
  appName: "Accrue",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [arcTestnet],
  ssr: true
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
