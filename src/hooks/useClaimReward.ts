"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";

export const useClaimReward = (week: number) => {
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { writeContract, data: hash, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess && claiming) {
      console.log(`[CLAIM] Success for week ${week}`);
      setClaimSuccess(true);
      setClaiming(false);

      showNotification(
        "Claim Successful",
        `Reward claimed for week ${week}`,
        "success"
      );
    }
  }, [isSuccess, claiming, week]);

  useEffect(() => {
    if (error) {
      console.error("[CLAIM] Error:", error);
      setClaiming(false);

      const errorMessage = error.message || "Unknown error";

      if (
        errorMessage.includes("User rejected") ||
        errorMessage.includes("User denied")
      ) {
        showNotification(
          "Claim Cancelled",
          "You cancelled the transaction",
          "warning"
        );
      } else if (errorMessage.includes("Already claimed")) {
        showNotification(
          "Already Claimed",
          "You already claimed this reward",
          "warning"
        );
      } else if (errorMessage.includes("Not a winner")) {
        showNotification(
          "Not Eligible",
          "You are not a winner for this week",
          "error"
        );
      } else if (errorMessage.includes("Week not finalized")) {
        showNotification(
          "Week Not Finalized",
          "Week is not finalized yet",
          "warning"
        );
      } else {
        showNotification("Claim Failed", errorMessage.slice(0, 100), "error");
      }
    }
  }, [error]);

  // ✅ Auto-reset after 30 seconds if stuck
  useEffect(() => {
    if (claiming) {
      const timeout = setTimeout(() => {
        console.warn("[CLAIM] Timeout - resetting state");
        setClaiming(false);
        showNotification(
          "Transaction Timeout",
          "Please try again or check wallet",
          "warning"
        );
      }, 30000); // 30 seconds

      return () => clearTimeout(timeout);
    }
  }, [claiming]);

  const claimReward = async () => {
    try {
      console.log(`[CLAIM] Starting claim for week ${week}...`);

      // Reset previous errors
      reset();

      setClaiming(true);
      setClaimSuccess(false);

      writeContract({
        address: CONTRACTS.CLASSIC as `0x${string}`,
        abi: ABIS.CLASSIC,
        functionName: "claimReward",
        args: [BigInt(week)],
      });
    } catch (error: any) {
      console.error("[CLAIM] Failed to initiate:", error);
      setClaiming(false);

      showNotification(
        "Claim Failed",
        error.message || "Failed to start transaction",
        "error"
      );
    }
  };

  return {
    claimReward,
    claiming: claiming || isConfirming,
    isSuccess: claimSuccess,
    error,
    txHash: hash,
  };
};

function showNotification(
  title: string,
  message: string,
  type: "info" | "success" | "error" | "warning"
) {
  const color =
    type === "success"
      ? "#10b981"
      : type === "error"
      ? "#ef4444"
      : type === "warning"
      ? "#f59e0b"
      : "#3b82f6";

  const icon =
    type === "success"
      ? "✅"
      : type === "error"
      ? "❌"
      : type === "warning"
      ? "⚠️"
      : "ℹ️";

  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, ${color}, ${color}dd);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 320px;
    font-family: 'Poppins', sans-serif;
    animation: slideInRight 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="font-size: 24px; line-height: 1;">${icon}</div>
      <div style="flex: 1;">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 12px; opacity: 0.9;">${message}</div>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-in";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 5000);
}
