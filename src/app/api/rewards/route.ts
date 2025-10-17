import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";
import { getTop10WithWallets } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(
        process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org"
      ),
    });

    // Get current week stats from contract
    const stats = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "getCurrentWeekStats",
    });

    const [currentWeek, revenue, prizePool, timeRemaining] = stats as [
      bigint,
      bigint,
      bigint,
      bigint
    ];

    // Calculate week start/end times
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const weekEnd = new Date(now);
    weekEnd.setUTCDate(now.getUTCDate() + daysUntilMonday);
    weekEnd.setUTCHours(0, 0, 0, 0);

    const weekStart = new Date(weekEnd);
    weekStart.setUTCDate(weekEnd.getUTCDate() - 7);

    // Format values (USDC has 6 decimals)
    const formatUSDC = (value: bigint) => {
      return (Number(value) / 1000000).toFixed(2);
    };

    // Get top 10 for reward preview
    const topPlayers = await getTop10WithWallets();

    // Prize distribution percentages
    const distribution = [30, 20, 15, 10, 8, 6, 4, 3, 2, 2];

    return NextResponse.json({
      success: true,
      data: {
        currentWeek: Number(currentWeek),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        timeRemaining: Number(timeRemaining),
        timeRemainingFormatted: formatTimeRemaining(Number(timeRemaining)),
        totalRevenue: formatUSDC(revenue),
        prizePool: formatUSDC(prizePool),
        developerShare: formatUSDC((revenue * BigInt(70)) / BigInt(100)),
        marketingShare: formatUSDC((revenue * BigInt(10)) / BigInt(100)),
        canFinalize: Number(timeRemaining) === 0,
        topPlayers: topPlayers.slice(0, 10).map((player, index) => {
          const playerPrize =
            (Number(prizePool) * distribution[index]) / 100 / 1000000;
          return {
            rank: index + 1,
            fid: player.fid,
            username: player.username,
            pfpUrl: player.pfp_url,
            score: player.score,
            walletAddress: player.wallet_address,
            rewardAmount: playerPrize.toFixed(2),
            percentage: `${distribution[index]}%`,
          };
        }),
      },
    });
  } catch (error: any) {
    console.error("[REWARDS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch rewards",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

function formatTimeRemaining(seconds: number): string {
  if (seconds === 0) return "Week ended";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}
