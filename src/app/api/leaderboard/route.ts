import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { getLeaderboard, saveScore, getUserRank } from "@/lib/supabase";

// ✅ Initialize Neynar with error handling
let neynarClient: NeynarAPIClient | null = null;

try {
  if (process.env.NEYNAR_API_KEY) {
    neynarClient = new NeynarAPIClient({
      apiKey: process.env.NEYNAR_API_KEY,
    });
    console.log("[NEYNAR] Client initialized successfully");
  } else {
    console.warn("[NEYNAR] ⚠️ API key not found, user data will use fallbacks");
  }
} catch (error) {
  console.error("[NEYNAR] ❌ Failed to initialize client:", error);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const fidParam = searchParams.get("fid");

    console.log("[API LEADERBOARD] GET request:", { limit, fidParam });

    // If FID provided, get user rank
    if (fidParam) {
      const fid = parseInt(fidParam);
      const rank = await getUserRank(fid);

      return NextResponse.json({
        success: true,
        data: { fid, rank },
      });
    }

    // Get leaderboard
    console.log("[API LEADERBOARD] Fetching from database...");

    const leaderboard = await getLeaderboard(limit);

    console.log(
      `[API LEADERBOARD] Fetched ${leaderboard.length} entries from DB`
    );
    console.log("[API LEADERBOARD] First entry:", leaderboard[0]);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      fid: entry.fid,
      username: entry.username,
      pfpUrl: entry.pfp_url,
      walletAddress: entry.wallet_address,
      score: entry.score,
      rank: index + 1,
    }));

    console.log("[API LEADERBOARD] Returning data:", {
      count: rankedLeaderboard.length,
      firstEntry: rankedLeaderboard[0],
    });

    return NextResponse.json({
      success: true,
      data: rankedLeaderboard,
      count: rankedLeaderboard.length,
    });
  } catch (error) {
    console.error("[API LEADERBOARD] ❌ Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch leaderboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ✅ FIXED: POST - Make wallet optional, use direct Supabase call
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, score, walletAddress } = body;

    console.log("[API LEADERBOARD] POST request:", {
      fid,
      score,
      walletAddress: walletAddress || "undefined",
    });

    // ✅ Validation
    if (!fid || typeof fid !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid FID" },
        { status: 400 }
      );
    }

    // ✅ Block test users
    if (fid >= 999990 && fid <= 999999) {
      console.log(`[API LEADERBOARD] ❌ Rejected test user FID ${fid}`);
      return NextResponse.json(
        {
          success: false,
          error: "Test users cannot be saved to leaderboard",
        },
        { status: 403 }
      );
    }

    // ✅ VALIDATE SCORE
    if (typeof score !== "number" || score < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid score" },
        { status: 400 }
      );
    }

    console.log(
      `[API LEADERBOARD] Saving score for FID ${fid}: ${score}${
        walletAddress
          ? ` with wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(
              -4
            )}`
          : " (no wallet)"
      }`
    );

    // ✅ Get user data from Neynar with proper error handling
    let username = `user_${fid}`;
    let pfpUrl:
      | string
      | undefined = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fid}`;

    if (neynarClient) {
      try {
        console.log(`[NEYNAR] Fetching user data for FID ${fid}...`);

        const userData = await neynarClient.fetchBulkUsers({
          fids: [fid],
          viewerFid: fid,
        });

        const user = userData.users[0];

        if (user) {
          username = user.username || `user_${fid}`;
          pfpUrl = user.pfp_url || pfpUrl;

          console.log(`[NEYNAR] ✅ User data fetched: @${username}`);
        } else {
          console.warn(`[NEYNAR] ⚠️ User ${fid} not found, using fallback`);
        }
      } catch (neynarError: any) {
        console.error("[NEYNAR] ❌ API error:", {
          message: neynarError.message,
          status: neynarError.status,
          fid,
        });

        console.log(`[NEYNAR] Using fallback data for FID ${fid}`);
      }
    } else {
      console.warn("[NEYNAR] Client not initialized, using fallback data");
    }

    // ✅ FIXED: Save score with optional wallet (direct Supabase call)
    try {
      await saveScore(
        fid,
        username,
        score,
        pfpUrl,
        walletAddress // ✅ Can be undefined
      );
      console.log("[API LEADERBOARD] ✅ Score saved successfully");
    } catch (saveError: any) {
      console.error("[API LEADERBOARD] ❌ Failed to save score:", saveError);
      throw saveError;
    }

    // ✅ Get updated rank
    const rank = await getUserRank(fid);

    return NextResponse.json({
      success: true,
      message: "Score saved successfully",
      data: {
        fid,
        username,
        score,
        walletAddress: walletAddress || null,
        rank,
      },
    });
  } catch (error: any) {
    console.error("[API LEADERBOARD] ❌ POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
