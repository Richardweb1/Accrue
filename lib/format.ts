import { formatUnits, parseUnits } from "viem";

export const USDC_DECIMALS = 6;

export function parseUsdc(value: string): bigint {
  return parseUnits(value || "0", USDC_DECIMALS);
}

export function formatUsdc(value: bigint | undefined, digits = 4): string {
  if (value === undefined) return "0";
  const formatted = formatUnits(value, USDC_DECIMALS);
  const [whole, decimal = ""] = formatted.split(".");
  const trimmed = decimal.slice(0, digits).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function shortAddress(address?: string): string {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function rateToPerSecond(amount: string, unit: string): bigint {
  const amountUsdc = parseUsdc(amount);
  const divisor = unit === "second" ? 1n : unit === "minute" ? 60n : unit === "hour" ? 3600n : unit === "day" ? 86400n : 604800n;
  return amountUsdc / divisor;
}
