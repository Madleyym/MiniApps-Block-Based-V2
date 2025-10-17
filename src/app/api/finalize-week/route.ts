import { NextRequest, NextResponse } from "next/server";
import { getTop10WithWallets } from "@/lib/supabase";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, weekNumber, autoExecute } = body;

    // ✅ Verify secret
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=".repeat(60));
    console.log("[FINALIZE-WEEK] Starting finalization process...");
    console.log(`[FINALIZE-WEEK] Week: ${weekNumber || "current"}`);
    console.log(`[FINALIZE-WEEK] Auto Execute: ${autoExecute || false}`);

    // ✅ Get top 10 with wallets
    console.log("[FINALIZE-WEEK] Fetching top 10 winners...");
    const top10 = await getTop10WithWallets();

    if (top10.length < 10) {
      console.error(
        `[FINALIZE-WEEK] ❌ Only ${top10.length} players with wallets (need 10)`
      );
      return NextResponse.json({
        success: false,
        error: `Only ${top10.length} players with wallets (need 10)`,
        data: {
          topPlayers: top10.map((p, i) => ({
            rank: i + 1,
            username: p.username,
            score: p.score,
            wallet: p.wallet_address,
          })),
        },
      });
    }

    // ✅ Extract wallet addresses (must be exactly 10)
    const winnerWallets = top10.map((player) => player.wallet_address!);

    console.log("[FINALIZE-WEEK] Top 10 Winners:");
    top10.forEach((player, i) => {
      console.log(
        `  ${i + 1}. ${player.username} - ${
          player.score
        } pts - ${player.wallet_address?.slice(
          0,
          6
        )}...${player.wallet_address?.slice(-4)}`
      );
    });

    // ✅ If autoExecute is false, just return data
    if (!autoExecute) {
      console.log(
        "[FINALIZE-WEEK] ⏸️ Auto-execute disabled. Returning data only."
      );
      console.log("=".repeat(60));

      return NextResponse.json({
        success: true,
        message: "Winners ready for manual finalization",
        data: {
          week: weekNumber || 1,
          contractAddress: CONTRACTS.CLASSIC,
          winners: winnerWallets,
          topPlayers: top10.map((p, i) => ({
            rank: i + 1,
            username: p.username,
            score: p.score,
            wallet: p.wallet_address,
          })),
        },
      });
    }

    // ✅ AUTO-EXECUTE: Finalize on blockchain
    console.log("[FINALIZE-WEEK] 🚀 Auto-executing finalization...");

    // Check operator private key
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
    if (!operatorPrivateKey) {
      console.error("[FINALIZE-WEEK] ❌ OPERATOR_PRIVATE_KEY not set!");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: Missing operator key",
        },
        { status: 500 }
      );
    }

    // Create operator account
    const operatorAccount = privateKeyToAccount(
      operatorPrivateKey as `0x${string}`
    );

    console.log(
      `[FINALIZE-WEEK] Operator: ${operatorAccount.address.slice(
        0,
        6
      )}...${operatorAccount.address.slice(-4)}`
    );

    // Create clients
    const walletClient = createWalletClient({
      account: operatorAccount,
      chain: base,
      transport: http("https://mainnet.base.org"),
    });

    const publicClient = createPublicClient({
      chain: base,
      transport: http("https://mainnet.base.org"),
    });

    // Get current week from contract
    console.log("[FINALIZE-WEEK] Reading current week from contract...");
    const currentWeek = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "currentWeek",
    });

    const weekToFinalize = weekNumber
      ? BigInt(weekNumber)
      : BigInt(currentWeek as bigint) - 1n;

    console.log(`[FINALIZE-WEEK] Current Week: ${currentWeek}`);
    console.log(`[FINALIZE-WEEK] Finalizing Week: ${weekToFinalize}`);

    // Check if week already finalized
    const isFinalized = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "weekFinalized",
      args: [weekToFinalize],
    });

    if (isFinalized) {
      console.error(
        `[FINALIZE-WEEK] ❌ Week ${weekToFinalize} already finalized!`
      );
      return NextResponse.json({
        success: false,
        error: `Week ${weekToFinalize} is already finalized`,
      });
    }

    // Get prize pool
    const prizePool = await publicClient.readContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "weeklyPrizePool",
      args: [weekToFinalize],
    });

    console.log(`[FINALIZE-WEEK] Prize Pool: ${Number(prizePool) / 1e6} USDC`);

    if (Number(prizePool) === 0) {
      console.error(
        `[FINALIZE-WEEK] ❌ No prize pool for week ${weekToFinalize}`
      );
      return NextResponse.json({
        success: false,
        error: `No prize pool for week ${weekToFinalize}`,
      });
    }

    // Execute finalization
    console.log("[FINALIZE-WEEK] 📝 Submitting finalization transaction...");

    const txHash = await walletClient.writeContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "finalizeWeek",
      args: [weekToFinalize, winnerWallets as any],
    });

    console.log(`[FINALIZE-WEEK] TX Hash: ${txHash}`);
    console.log("[FINALIZE-WEEK] ⏳ Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    if (receipt.status === "success") {
      console.log("[FINALIZE-WEEK] ✅ FINALIZATION SUCCESSFUL!");
      console.log(`[FINALIZE-WEEK] Block: ${receipt.blockNumber}`);
      console.log(`[FINALIZE-WEEK] Gas Used: ${receipt.gasUsed}`);
      console.log("=".repeat(60));

      return NextResponse.json({
        success: true,
        message: `Week ${weekToFinalize} finalized successfully`,
        data: {
          week: Number(weekToFinalize),
          txHash,
          blockNumber: Number(receipt.blockNumber),
          gasUsed: Number(receipt.gasUsed),
          prizePool: Number(prizePool) / 1e6,
          winners: top10.map((p, i) => ({
            rank: i + 1,
            username: p.username,
            score: p.score,
            wallet: p.wallet_address,
            expectedReward:
              (Number(prizePool) / 1e6) *
              ([30, 20, 15, 10, 8, 6, 4, 3, 2, 2][i] / 100),
          })),
        },
      });
    } else {
      throw new Error("Transaction reverted");
    }
  } catch (error: any) {
    console.error("=".repeat(60));
    console.error("[FINALIZE-WEEK] ❌ ERROR:");
    console.error("[FINALIZE-WEEK]", error.message || error);
    console.error("=".repeat(60));

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
