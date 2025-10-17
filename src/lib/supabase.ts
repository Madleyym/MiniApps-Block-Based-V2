import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// CLASSIC MODE (with rewards)
// ========================================
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

// ✅ OPTIMIZED: Classic score save with locking
let isSavingClassic = false;

export async function saveScore(
  fid: number,
  username: string,
  score: number,
  pfpUrl?: string,
  walletAddress?: string
): Promise<void> {
  if (isSavingClassic) {
    console.log("[CLASSIC SAVE] ⏭️ Skipped: Already saving");
    return;
  }

  isSavingClassic = true;

  try {
    console.log("=".repeat(60));
    console.log("[CLASSIC SAVE] Starting...");
    console.log(`[CLASSIC SAVE] Input:`, {
      fid,
      username,
      score,
      pfpUrl,
      walletAddress: walletAddress || "undefined",
    });

    if (fid >= 999990 && fid <= 999999) {
      console.log(`[CLASSIC SAVE] ❌ Rejected: Test user FID ${fid}`);
      return;
    }

    console.log(`[CLASSIC SAVE] ✅ Valid FID: ${fid}`);

    const { data: existing, error: selectError } = await supabase
      .from("leaderboard")
      .select("*")
      .eq("fid", fid)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[CLASSIC SAVE] ❌ Select error:", selectError);
      throw selectError;
    }

    console.log(`[CLASSIC SAVE] Existing entry:`, existing || "None");

    if (existing) {
      console.log(
        `[CLASSIC SAVE] Comparing scores: ${score} vs ${existing.score}`
      );

      if (score > existing.score) {
        console.log(`[CLASSIC SAVE] 🔄 Updating entry...`);

        const { data: updated, error: updateError } = await supabase
          .from("leaderboard")
          .update({
            score,
            username,
            pfp_url: pfpUrl,
            wallet_address: walletAddress,
            updated_at: new Date().toISOString(),
          })
          .eq("fid", fid)
          .select();

        if (updateError) {
          console.error("[CLASSIC SAVE] ❌ Update error:", updateError);
          throw updateError;
        }

        console.log(`[CLASSIC SAVE] ✅ Updated successfully:`, updated);
        console.log(`[CLASSIC SAVE] New score: ${score}`);
      } else {
        console.log(
          `[CLASSIC SAVE] ⏭️ Skipped: Existing score ${existing.score} >= ${score}`
        );
      }
    } else {
      console.log(`[CLASSIC SAVE] ➕ Inserting new entry...`);

      const { data: inserted, error: insertError } = await supabase
        .from("leaderboard")
        .insert({
          fid,
          username,
          pfp_url: pfpUrl,
          wallet_address: walletAddress,
          score,
        })
        .select();

      if (insertError) {
        console.error("[CLASSIC SAVE] ❌ Insert error:", insertError);
        throw insertError;
      }

      console.log(`[CLASSIC SAVE] ✅ Inserted successfully:`, inserted);
      console.log(`[CLASSIC SAVE] New score saved: ${score}`);
    }

    console.log("[CLASSIC SAVE] ✅ Completed successfully");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("=".repeat(60));
    console.error("[CLASSIC SAVE] ❌ FAILED:");
    console.error("[CLASSIC SAVE] Error message:", error.message);
    console.error("[CLASSIC SAVE] Error details:", error);
    console.error("=".repeat(60));
    throw error;
  } finally {
    setTimeout(() => {
      isSavingClassic = false;
    }, 500);
  }
}

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
    console.error("[CLASSIC] Failed to get leaderboard:", error);
    return [];
  }
}

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
    console.error("[CLASSIC] Failed to get top 10:", error);
    return [];
  }
}

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
    console.error("[CLASSIC] Failed to get user rank:", error);
    return null;
  }
}

export async function getUserScore(fid: number): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("score")
      .eq("fid", fid)
      .single();

    if (error) throw error;
    return data?.score || null;
  } catch (error) {
    console.error("[CLASSIC] Failed to get user score:", error);
    return null;
  }
}

export async function getTotalPlayers(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("[CLASSIC] Failed to get total players:", error);
    return 0;
  }
}

// ========================================
// ADVENTURE MODE (no rewards)
// ========================================
export interface AdventureScore {
  id?: number;
  fid: number;
  username: string;
  pfp_url?: string;
  score: number;
  level: number;
  continue_count: number;
  created_at?: string;
  updated_at?: string;
}

// ✅ FIXED: Proper save logic with saveType
let isSavingAdventure = false;

export async function saveAdventureScore(
  fid: number,
  username: string,
  score: number,
  level: number,
  pfpUrl?: string,
  continueCount: number = 0,
  saveType: "levelup" | "gameover" | "continue" = "gameover"
): Promise<void> {
  if (isSavingAdventure && saveType !== "gameover") {
    console.log(`[ADVENTURE] Skipped: saving (${saveType})`);
    return;
  }

  isSavingAdventure = true;
  console.log(
    `[ADVENTURE] Save ${saveType}: fid=${fid}, score=${score}, level=${level}, continues=${continueCount}`
  );

  try {
    if (fid >= 999990 && fid <= 999999) {
      console.log(`[ADVENTURE] Skipped test FID ${fid}`);
      return;
    }

    const { data: existing, error: selectError } = await supabase
      .from("adventure_scores")
      .select("*")
      .eq("fid", fid)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    if (existing) {
      console.log(
        `[ADVENTURE] Existing: score=${existing.score}, level=${existing.level}, continues=${existing.continue_count}`
      );

      let shouldUpdate = false;
      let updateData: any = {
        username,
        pfp_url: pfpUrl,
        updated_at: new Date().toISOString(),
      };

      if (saveType === "gameover") {
        if (score > existing.score) {
          shouldUpdate = true;
          updateData.score = score;
          updateData.level = level;
          updateData.continue_count = continueCount;
          console.log(
            `[ADVENTURE] Game Over - New high: ${score} > ${existing.score}`
          );
        } else if (continueCount !== existing.continue_count) {
          shouldUpdate = true;
          updateData.continue_count = continueCount;
          console.log(
            `[ADVENTURE] Game Over - Continue updated: ${continueCount}`
          );
        } else {
          console.log(
            `[ADVENTURE] Game Over - No improvement: ${score} <= ${existing.score}`
          );
        }
      } else if (saveType === "continue") {
        shouldUpdate = true;
        updateData.continue_count = continueCount;
        if (score > existing.score) {
          updateData.score = score;
          updateData.level = level;
          console.log(`[ADVENTURE] Continue - New high: ${score}`);
        } else {
          console.log(`[ADVENTURE] Continue - Keep best: ${existing.score}`);
        }
      } else if (saveType === "levelup") {
        if (score > existing.score) {
          shouldUpdate = true;
          updateData.score = score;
          updateData.level = level;
          updateData.continue_count = continueCount;
          console.log(`[ADVENTURE] Level Up - New high: ${score}`);
        }
      }

      if (shouldUpdate) {
        const { error: updateError } = await supabase
          .from("adventure_scores")
          .update(updateData)
          .eq("fid", fid);

        if (updateError) throw updateError;
        console.log(`[ADVENTURE] ✅ Updated`);
      } else {
        console.log(`[ADVENTURE] ⏭️ No update needed`);
      }
    } else {
      console.log(`[ADVENTURE] ➕ Inserting new entry...`);

      const { error: insertError } = await supabase
        .from("adventure_scores")
        .insert({
          fid,
          username,
          pfp_url: pfpUrl,
          score,
          level,
          continue_count: continueCount,
        });

      if (insertError) throw insertError;
      console.log(`[ADVENTURE] ✅ Inserted`);
    }
  } catch (error: any) {
    console.error(`[ADVENTURE] ❌ Failed:`, error.message);
    throw error;
  } finally {
    setTimeout(() => {
      isSavingAdventure = false;
    }, 500);
  }
}

export async function getAdventureLeaderboard(
  limit: number = 50
): Promise<AdventureScore[]> {
  try {
    const { data, error } = await supabase
      .from("adventure_scores")
      .select("*")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("[ADVENTURE] Failed to get leaderboard:", error);
    return [];
  }
}

export async function getAdventureUserRank(
  fid: number
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("adventure_scores")
      .select("fid, score")
      .order("score", { ascending: false });

    if (error) throw error;
    if (!data) return null;

    const index = data.findIndex((entry) => entry.fid === fid);
    return index >= 0 ? index + 1 : null;
  } catch (error) {
    console.error("[ADVENTURE] Failed to get user rank:", error);
    return null;
  }
}
