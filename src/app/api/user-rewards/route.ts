import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");
    const week = searchParams.get("week");

    if (!walletAddress || !week) {
      return NextResponse.json(
        { success: false, error: "Missing parameters" },
        { status: 400 }
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Check if week is finalized
    const isFinalized = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "weekFinalized",
      args: [BigInt(week)],
    });

    if (!isFinalized) {
      return NextResponse.json({
        success: true,
        data: {
          canClaim: false,
          reason: "Week not finalized yet",
          amount: "0.00",
        },
      });
    }

    // Check if already claimed
    const hasClaimed = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "claimed",
      args: [BigInt(week), walletAddress as `0x${string}`],
    });

    if (hasClaimed) {
      return NextResponse.json({
        success: true,
        data: {
          canClaim: false,
          reason: "Already claimed",
          amount: "0.00",
        },
      });
    }

    // Get claimable amount
    const claimableAmount = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "getClaimableReward",
      args: [BigInt(week), walletAddress as `0x${string}`],
    });

    const amount = (Number(claimableAmount as bigint) / 1000000).toFixed(2);

    return NextResponse.json({
      success: true,
      data: {
        canClaim: Number(amount) > 0,
        reason: Number(amount) > 0 ? "Ready to claim" : "Not a winner",
        amount,
        week: Number(week),
      },
    });
  } catch (error: any) {
    console.error("[USER-REWARDS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check rewards",
      },
      { status: 500 }
    );
  }
}
