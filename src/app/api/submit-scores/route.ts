import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/supabase";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { secret, batchSize = 50 } = body;

    // ✅ Verify secret
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[SUBMIT-SCORES] Fetching leaderboard...");

    // Get current leaderboard
    const leaderboard = await getLeaderboard(batchSize);

    if (leaderboard.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No scores to submit",
      });
    }

    console.log(`[SUBMIT-SCORES] Found ${leaderboard.length} scores`);

    // Prepare batch data
    const players = leaderboard.map(
      (entry) =>
        entry.wallet_address || "0x0000000000000000000000000000000000000000"
    );
    const scores = leaderboard.map((entry) => BigInt(entry.score));

    // Check operator private key
    const operatorPrivateKey = process.env.OPERATOR_PRIVATE_KEY;
    if (!operatorPrivateKey) {
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

    console.log("[SUBMIT-SCORES] Submitting batch...");

    const txHash = await walletClient.writeContract({
      address: CONTRACTS.CLASSIC as `0x${string}`,
      abi: ABIS.CLASSIC,
      functionName: "submitScoresBatch",
      args: [players, scores],
    });

    console.log(`[SUBMIT-SCORES] TX Hash: ${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    return NextResponse.json({
      success: true,
      message: `Submitted ${leaderboard.length} scores`,
      txHash,
      blockNumber: Number(receipt.blockNumber),
    });
  } catch (error: any) {
    console.error("[SUBMIT-SCORES] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
