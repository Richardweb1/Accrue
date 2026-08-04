import { isAddress } from "viem";

export const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "5042002");
export const ARC_RPC_URL = process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.testnet.arc.io";
export const ARC_EXPLORER_URL = process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app";
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000") as `0x${string}`;
export const ACCRUE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ACCRUE_CONTRACT_ADDRESS as `0x${string}` | undefined;
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

export const hasContractAddress = Boolean(ACCRUE_CONTRACT_ADDRESS && isAddress(ACCRUE_CONTRACT_ADDRESS));
