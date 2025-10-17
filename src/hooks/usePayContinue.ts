"use client";

import { useState, useCallback, useRef } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { CONTRACTS, ABIS, USDC_ABI } from "@/lib/contracts.config";
import { calculateContinueCost, formatUSDC } from "@/lib/wagmi.config";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { base } from "viem/chains";
import { showNotification } from "@/lib/notification";

type TransactionStep =
  | "idle"
  | "checking"
  | "whitelisted"
  | "approving"
  | "approved"
  | "paying"
  | "success";

export const usePayContinue = (continueCount: number = 0) => {
  const { address, isConnected, provider } = useWalletConnection();
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<TransactionStep>("idle");
  const [isWhitelistedUser, setIsWhitelistedUser] = useState(false);

  // ✅ OPTIMIZED: Use ref to prevent stale closure
  const isPayingRef = useRef(false);

  const continueCost = calculateContinueCost(continueCount);

  const startPayment = useCallback(async () => {
    // ✅ OPTIMIZED: Prevent double execution
    if (isPayingRef.current) {
      console.log("[CLASSIC PAYMENT] Already processing, skipping...");
      return false;
    }

    if (!isConnected || !address || !provider) {
      showNotification(
        "Wallet Not Connected",
        "Please connect your wallet first",
        "error"
      );
      return false;
    }

    isPayingRef.current = true;

    try {
      setIsPaying(true);
      setIsSuccess(false);
      setCurrentStep("checking");

      console.log("=".repeat(60));
      console.log("[CLASSIC PAYMENT] Starting...");
      console.log(`[CLASSIC PAYMENT] Continue #${continueCount + 1}`);
      console.log(`[CLASSIC PAYMENT] Cost: ${formatUSDC(continueCost)}`);
      console.log(
        `[CLASSIC PAYMENT] Wallet: ${address.slice(0, 6)}...${address.slice(
          -4
        )}`
      );
      console.log("=".repeat(60));

      const walletClient = createWalletClient({
        account: address,
        chain: base,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
      });

      console.log("[WHITELIST CHECK] Checking whitelist status...");

      const isWhitelisted = await publicClient.readContract({
        address: CONTRACTS.CLASSIC as `0x${string}`,
        abi: ABIS.CLASSIC,
        functionName: "checkWhitelist",
        args: [address],
      });

      setIsWhitelistedUser(!!isWhitelisted);

      if (isWhitelisted) {
        console.log("[WHITELIST] ✅ Wallet is whitelisted - FREE CONTINUE!");
        setCurrentStep("whitelisted");

        showNotification(
          "Free Continue!",
          "Your wallet is whitelisted",
          "success"
        );

        console.log("[WHITELIST] Calling payForContinue (free)...");

        const payHash = await walletClient.writeContract({
          address: CONTRACTS.CLASSIC as `0x${string}`,
          abi: ABIS.CLASSIC,
          functionName: "payForContinue",
          args: [BigInt(continueCount + 1)],
        });

        console.log(`[WHITELIST] TX sent: ${payHash}`);
        showNotification("Sent!", "Confirming transaction...", "info");

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: payHash,
          confirmations: 1,
        });

        if (receipt.status === "success") {
          console.log("[WHITELIST] ✅ FREE CONTINUE SUCCESS!");

          setIsSuccess(true);
          setIsPaying(false);
          setCurrentStep("success");

          showNotification("Success!", "Game resuming...", "success");

          return true;
        } else {
          throw new Error("Transaction reverted");
        }
      }

      console.log("[WHITELIST] Not whitelisted - proceeding with payment");
      console.log("[BALANCE CHECK] Checking USDC balance...");

      const balance = await publicClient.readContract({
        address: CONTRACTS.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      });

      const currentBalance = BigInt(balance as bigint);
      const hasEnough = currentBalance >= continueCost;

      console.log(
        `[BALANCE CHECK] Your balance: ${formatUSDC(currentBalance)}`
      );
      console.log(`[BALANCE CHECK] Required: ${formatUSDC(continueCost)}`);

      if (!hasEnough) {
        const shortfall = continueCost - currentBalance;

        setIsPaying(false);
        setCurrentStep("idle");
        isPayingRef.current = false;

        console.error(`[BALANCE CHECK] ❌ INSUFFICIENT BALANCE!`);

        showNotification(
          "Insufficient USDC",
          `Need ${formatUSDC(shortfall)} more USDC`,
          "error"
        );

        alert(
          `INSUFFICIENT USDC!\n\nRequired: ${formatUSDC(
            continueCost
          )}\nYour balance: ${formatUSDC(
            currentBalance
          )}\n\nGet USDC on Uniswap or Coinbase!`
        );

        return false;
      }

      console.log("[ALLOWANCE CHECK] Checking USDC allowance...");

      const allowance = await publicClient.readContract({
        address: CONTRACTS.USDC as `0x${string}`,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [address, CONTRACTS.CLASSIC],
      });

      const currentAllowance = BigInt(allowance as bigint);
      const needsApproval = currentAllowance < continueCost;

      if (needsApproval) {
        console.log("[APPROVAL] Requesting approval...");
        setCurrentStep("approving");

        showNotification(
          "Step 1/2",
          `Approving ${formatUSDC(continueCost)} USDC...`,
          "info"
        );

        try {
          const approveHash = await walletClient.writeContract({
            address: CONTRACTS.USDC as `0x${string}`,
            abi: USDC_ABI,
            functionName: "approve",
            args: [CONTRACTS.CLASSIC, continueCost],
          });

          console.log(`[APPROVAL] TX sent: ${approveHash}`);

          await publicClient.waitForTransactionReceipt({
            hash: approveHash,
            confirmations: 1,
          });

          console.log("[APPROVAL] Confirmed!");
          setCurrentStep("approved");

          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (approveError: any) {
          console.error("[APPROVAL] ❌ Failed:", approveError);

          if (
            approveError.message?.includes("User rejected") ||
            approveError.message?.includes("User denied")
          ) {
            showNotification(
              "Cancelled",
              "You rejected the approval",
              "warning"
            );
          } else {
            showNotification(
              "Approval Failed",
              approveError.shortMessage || "Please try again",
              "error"
            );
          }

          throw approveError;
        }
      }

      console.log("[PAYMENT] Processing payment...");
      setCurrentStep("paying");

      showNotification(
        "Step 2/2",
        `Paying ${formatUSDC(continueCost)} USDC...`,
        "info"
      );

      try {
        const payHash = await walletClient.writeContract({
          address: CONTRACTS.CLASSIC as `0x${string}`,
          abi: ABIS.CLASSIC,
          functionName: "payForContinue",
          args: [BigInt(continueCount + 1)],
        });

        console.log(`[PAYMENT] TX sent: ${payHash}`);

        const receipt = await publicClient.waitForTransactionReceipt({
          hash: payHash,
          confirmations: 1,
        });

        if (receipt.status === "success") {
          console.log("[PAYMENT] SUCCESS!");

          setIsSuccess(true);
          setIsPaying(false);
          setCurrentStep("success");

          showNotification("Success!", "Game resuming...", "success");

          return true;
        } else {
          throw new Error("Transaction reverted");
        }
      } catch (payError: any) {
        console.error("[PAYMENT] ❌ Failed:", payError);

        if (
          payError.message?.includes("User rejected") ||
          payError.message?.includes("User denied")
        ) {
          showNotification("Cancelled", "You rejected the payment", "warning");
        } else if (payError.message?.includes("insufficient funds")) {
          showNotification(
            "Insufficient USDC",
            "Not enough USDC in wallet",
            "error"
          );
        } else {
          showNotification(
            "TX Failed",
            payError.shortMessage ||
              payError.message?.slice(0, 40) ||
              "Unknown error",
            "error"
          );
        }

        throw payError;
      }
    } catch (error: any) {
      console.error("[CLASSIC PAYMENT] ❌ FAILED:", error.message || error);

      setIsPaying(false);
      setCurrentStep("idle");

      return false;
    } finally {
      // ✅ OPTIMIZED: Reset ref after delay
      setTimeout(() => {
        isPayingRef.current = false;
      }, 1000);
    }
  }, [isConnected, address, provider, continueCost, continueCount]);

  const resetState = useCallback(() => {
    console.log("[PAYMENT] Resetting payment state...");
    setIsPaying(false);
    setIsSuccess(false);
    setCurrentStep("idle");
    setIsWhitelistedUser(false);
    isPayingRef.current = false;
  }, []);

  return {
    startPayment,
    isPaying,
    isSuccess,
    currentStep,
    isConnected,
    address,
    formattedCost: formatUSDC(continueCost),
    isWhitelistedUser,
    resetState,
  };
};
