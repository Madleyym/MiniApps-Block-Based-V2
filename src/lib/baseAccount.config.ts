// src/lib/baseAccount.config.ts
import { createBaseAccountSDK } from "@base-org/account";
import { base } from "viem/chains";

const ROOT_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://block-base-pi.vercel.app";

// Initialize Base Account SDK with Sub Accounts + Auto Spend Permissions
export const baseAccountSDK = createBaseAccountSDK({
  appName: "Block Based",
  appLogoUrl: `${ROOT_URL}/icon.png`,
  appChainIds: [base.id],

  // Enable Sub Accounts with auto-creation on connect
  subAccounts: {
    creation: "on-connect", // Auto-create sub account when user connects
    defaultAccount: "sub", // Use sub account as default for transactions
    funding: "auto", // Enable Auto Spend Permissions
  },

  // Optional: Configure Paymaster for gasless transactions
  // paymasterUrls: {
  //   [base.id]: 'YOUR_PAYMASTER_URL_HERE'
  // }
});

// Get EIP-1193 provider for wagmi/viem
export const getBaseAccountProvider = () => {
  return baseAccountSDK.getProvider();
};

// Helper to check if we're in a frame context
export const isFrameContext = (): boolean => {
  if (typeof window === "undefined") return false;

  const sdk = (window as any).sdk;
  const hasFrameSDK = !!sdk?.wallet?.ethProvider;

  const userAgent = navigator.userAgent.toLowerCase();
  const isWarpcast = userAgent.includes("warpcast");
  const isFarcaster = userAgent.includes("farcaster");

  return hasFrameSDK || isWarpcast || isFarcaster;
};
