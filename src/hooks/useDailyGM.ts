"use client";

import { useState, useCallback, useEffect } from "react";
import { useWalletConnection } from "./useWalletConnection";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { base } from "viem/chains";
import { showNotification } from "@/lib/notification";

export const useDailyGM = () => {
  const { address, isConnected, provider } = useWalletConnection();
  const [loading, setLoading] = useState(false);
  const [gmData, setGmData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalGMs: 0,
    canGMToday: true,
    lastGMTime: 0,
  });

  const fetchGMData = useCallback(async () => {
    if (!isConnected || !address) {
      console.log("[GM] Not connected, skipping fetch");
      return;
    }

    try {
      console.log("[GM] Fetching data for:", address);

      const publicClient = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
      });

      const result = await publicClient.readContract({
        address: CONTRACTS.GM as `0x${string}`,
        abi: ABIS.GM,
        functionName: "getGMRecord",
        args: [address],
      });

      const [lastGM, currentStreak, longestStreak, totalGMs, canGMToday] =
        result as [bigint, bigint, bigint, bigint, boolean];

      const gmDataObj = {
        currentStreak: Number(currentStreak),
        longestStreak: Number(longestStreak),
        totalGMs: Number(totalGMs),
        canGMToday,
        lastGMTime: Number(lastGM),
      };

      setGmData(gmDataObj);

      console.log("[GM] ✅ Data fetched:", gmDataObj);
    } catch (error) {
      console.error("[GM] ❌ Fetch failed:", error);
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchGMData();
    }
  }, [isConnected, address, fetchGMData]);

  const sayGM = useCallback(async () => {
    console.log("[GM] sayGM called", {
      isConnected,
      address,
      canGMToday: gmData.canGMToday,
    });

    if (!isConnected || !address || !provider) {
      showNotification(
        "Connect Wallet",
        "Please connect wallet first",
        "error"
      );
      return false;
    }

    if (!gmData.canGMToday) {
      showNotification("Already GM'd!", "Come back tomorrow! ☀️", "warning");
      return false;
    }

    setLoading(true);
    try {
      const walletClient = createWalletClient({
        account: address,
        chain: base,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: base,
        transport: http("https://mainnet.base.org"),
      });

      console.log("[GM] 📤 Sending GM transaction...");

      const hash = await walletClient.writeContract({
        address: CONTRACTS.GM as `0x${string}`,
        abi: ABIS.GM,
        functionName: "sayGM",
        args: [],
      });

      console.log(`[GM] TX sent: ${hash}`);
      showNotification("GM Sent!", "Confirming transaction...", "info");

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === "success") {
        console.log("[GM] ✅ Transaction confirmed!");

        // Wait a bit for blockchain state to update
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Refresh data
        await fetchGMData();

        const newStreak = gmData.currentStreak + 1;
        const message =
          newStreak === 1
            ? "First GM! Start your streak! 🔥"
            : `${newStreak} day streak! Keep it up! 🔥`;

        showNotification("GM BASE! ☀️", message, "success");

        return true;
      } else {
        throw new Error("Transaction reverted");
      }
    } catch (error: any) {
      console.error("[GM] ❌ Failed:", error);

      if (error.message?.includes("Already said GM today")) {
        showNotification("Already GM'd!", "Come back tomorrow! ☀️", "warning");
      } else if (
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
        showNotification(
          "Insufficient ETH",
          "Need ETH for gas (~$0.01)",
          "error"
        );
      } else {
        showNotification(
          "GM Failed",
          error.shortMessage || error.message?.slice(0, 40) || "Try again",
          "error"
        );
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, provider, gmData, fetchGMData]);

  return {
    sayGM,
    fetchGMData,
    loading,
    gmData,
    isConnected,
  };
};
