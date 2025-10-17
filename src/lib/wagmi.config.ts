import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// ✅ Simple config - No custom connector
export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [injected()], // Works for both Frame SDK and browser wallets
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

// USDC Contract on Base Mainnet
export const USDC_ADDRESS =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export const USDC_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
] as const;

export const PAYMENT_RECEIVER =
  "0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481" as const;

export const BASE_CONTINUE_COST = BigInt(100000); // 0.1 USDC
export const MAX_CONTINUE_MULTIPLIER = 10;

export const calculateContinueCost = (continueCount: number): bigint => {
  const count = Math.max(0, continueCount);
  const multiplier = Math.min(count + 1, MAX_CONTINUE_MULTIPLIER);
  return BASE_CONTINUE_COST * BigInt(multiplier);
};

export const formatUSDC = (amount: bigint): string => {
  const numericAmount = Number(amount) / 1000000;
  return numericAmount.toFixed(1);
};

export const getPriceTier = (
  continueCount: number
): "low" | "medium" | "high" => {
  if (continueCount < 5) return "low";
  if (continueCount < 9) return "medium";
  return "high";
};

export const isMaxPrice = (continueCount: number): boolean => {
  return continueCount >= MAX_CONTINUE_MULTIPLIER - 1;
};

export const getTotalSpent = (continueCount: number): string => {
  let total = BigInt(0);
  for (let i = 0; i < continueCount; i++) {
    total += calculateContinueCost(i);
  }
  return formatUSDC(total);
};

export const getPricingBreakdown = (maxCount: number = 10): string[] => {
  const breakdown: string[] = [];
  for (let i = 0; i < maxCount; i++) {
    const cost = calculateContinueCost(i);
    breakdown.push(formatUSDC(cost));
  }
  return breakdown;
};
