import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id?: number;
  fid: number;
  username: string;
  pfp_url?: string;
  wallet_address?: string;
  score: number;
  created_at?: string;
  updated_at?: string;
}

// ✅ Save or update score (REQUIRE WALLET!)
export async function saveScore(
  fid: number,
  username: string,
  score: number,
  pfpUrl?: string,
  walletAddress?: string
): Promise<void> {
  try {
    // ✅ BLOCK GUEST USERS (FID >= 999000)
    if (fid >= 999000) {
      console.log(`[LEADERBOARD] ❌ Skipping guest user FID ${fid}`);
      return;
    }

    // ✅ REQUIRE WALLET ADDRESS
    if (!walletAddress || !walletAddress.startsWith("0x")) {
      console.log(`[LEADERBOARD] ❌ No wallet address for FID ${fid}`);
      throw new Error("Wallet address required for leaderboard entry");
    }

    // Check if user exists
    const { data: existing, error: selectError } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("fid", fid)
      .single();

    // Handle error if no rows found (not an error, user doesn't exist yet)
    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    if (existing) {
      // Update only if new score is higher
      if (score > existing.score) {
        const { error } = await supabase
          .from("leaderboard")
          .update({
            score,
            username,
            pfp_url: pfpUrl,
            wallet_address: walletAddress,
            updated_at: new Date().toISOString(),
          })
          .eq("fid", fid);

        if (error) throw error;
        console.log(`✅ Score updated for ${username}: ${score}`);
      } else {
        console.log(
          `[LEADERBOARD] Score ${score} not higher than existing ${existing.score}`
        );
      }
    } else {
      // Insert new entry
      const { error } = await supabase.from("leaderboard").insert({
        fid,
        username,
        pfp_url: pfpUrl,
        wallet_address: walletAddress,
        score,
      });

      if (error) throw error;
      console.log(`✅ New score saved for ${username}: ${score}`);
    }
  } catch (error) {
    console.error("❌ Failed to save score:", error);
    throw error;
  }
}

// Get leaderboard
export async function getLeaderboard(
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return [];
  }
}

// ✅ Get top 10 with wallets (for weekly rewards)
export async function getTop10WithWallets(): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("*")
      .not("wallet_address", "is", null)
      .order("score", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to get top 10:", error);
    return [];
  }
}

// Get user rank
export async function getUserRank(fid: number): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("fid, score")
      .order("score", { ascending: false });

    if (error) throw error;
    if (!data) return null;

    const index = data.findIndex((entry) => entry.fid === fid);
    return index >= 0 ? index + 1 : null;
  } catch (error) {
    console.error("Failed to get user rank:", error);
    return null;
  }
}

// Get user score
export async function getUserScore(fid: number): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("fid", fid)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data?.score || null;
  } catch (error) {
    console.error("Failed to get user score:", error);
    return null;
  }
}

// Get total players
export async function getTotalPlayers(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Failed to get total players:", error);
    return 0;
  }
}
