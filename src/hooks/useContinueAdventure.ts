"use client";

import { useState, useCallback, useRef } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { base } from "viem/chains";
import { showNotification } from "@/lib/notification";

export const useContinueAdventure = () => {
  const { address, isConnected, provider, isFrameWallet } =
    useWalletConnection();
  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // ✅ OPTIMIZED: Use ref to prevent double execution
  const isProcessingRef = useRef(false);

  const continueFree = useCallback(async () => {
    // ✅ OPTIMIZED: Prevent double execution
    if (isProcessingRef.current) {
      console.log("[ADVENTURE] Already processing, skipping...");
      return false;
    }

    const startTime = Date.now();
    console.log("[ADVENTURE] ⚡ FAST TX Starting...");

    if (!isConnected || !address || !provider) {
      const missing = !isConnected
        ? "Not connected"
        : !address
        ? "No address"
        : "No provider";
      console.error(`[ADVENTURE] ❌ ${missing}`);
      showNotification("Wallet Error", missing, "error");
      return false;
    }

    isProcessingRef.current = true;

    try {
      setIsPaying(true);

      console.log(
        `[ADVENTURE] 🔗 Using ${isFrameWallet ? "Frame" : "Browser"} wallet`
      );
      console.log(
        `[ADVENTURE] 📝 Address: ${address.slice(0, 6)}...${address.slice(-4)}`
      );

      const walletClient = createWalletClient({
        account: address,
        chain: base,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
      });

      console.log("[ADVENTURE] 📤 Sending TX...");
      const hash = await walletClient.writeContract({
        address: CONTRACTS.ADVENTURE as `0x${string}`,
        abi: ABIS.ADVENTURE,
        functionName: "recordContinue",
        args: [],
      });

      const sendTime = Date.now() - startTime;
      console.log(`[ADVENTURE] ✅ TX sent in ${sendTime}ms: ${hash}`);

      setTxHash(hash);
      showNotification("Sent!", "Confirming transaction...", "info");

      console.log("[ADVENTURE] ⏳ Waiting for confirmation...");

      const receipt = (await Promise.race([
        publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 45000)
        ),
      ])) as any;

      const totalTime = Date.now() - startTime;

      if (receipt.status === "success") {
        console.log(`[ADVENTURE] 🎉 SUCCESS in ${totalTime}ms!`);
        setIsSuccess(true);
        setIsPaying(false);
        showNotification("Success!", "Game resuming...", "success");
        return true;
      } else {
        throw new Error("TX reverted");
      }
    } catch (error: any) {
      const errorTime = Date.now() - startTime;
      console.error(
        `[ADVENTURE] ❌ Failed after ${errorTime}ms:`,
        error.message
      );

      setIsPaying(false);

      if (
        error.message?.includes("User rejected") ||
        error.message?.includes("User denied") ||
        error.code === 4001 ||
        error.code === "ACTION_REJECTED"
      ) {
        showNotification(
          "Cancelled",
          "You rejected the transaction",
          "warning"
        );
      } else if (error.message?.includes("insufficient funds")) {
        showNotification("Insufficient ETH", "Need ~$0.01 for gas", "error");
      } else if (error.message?.includes("Timeout")) {
        showNotification(
          "Slow Network",
          "Check Base explorer for TX status",
          "error"
        );
      } else {
        showNotification(
          "TX Failed",
          error.shortMessage || error.message?.slice(0, 40) || "Unknown error",
          "error"
        );
      }

      return false;
    } finally {
      // ✅ OPTIMIZED: Reset ref after delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 1000);
    }
  }, [isConnected, address, provider, isFrameWallet]);

  const resetState = useCallback(() => {
    setIsPaying(false);
    setIsSuccess(false);
    setTxHash(null);
    isProcessingRef.current = false;
  }, []);

  return {
    continueFree,
    isPaying,
    isSuccess,
    txHash,
    isConnected,
    address,
    hasProvider: !!provider,
    resetState,
  };
};
