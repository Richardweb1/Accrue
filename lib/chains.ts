import { defineChain } from "viem";
import { ARC_CHAIN_ID, ARC_EXPLORER_URL, ARC_RPC_URL } from "./env";

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] }
  },
  blockExplorers: {
    default: { name: "ArcScan", url: ARC_EXPLORER_URL }
  },
  testnet: true
});
