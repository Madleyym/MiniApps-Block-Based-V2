// scripts/populate-test-data.js
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://rcdnrcchuijbrddzhzeh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjZG5yY2NodWlqYnJkZHpoemVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4NTI1NjksImV4cCI6MjA3NTQyODU2OX0.5pkERZ6BFSRdsxP93QSfIIwoI4hg033JP9AZlWPcSn0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test wallets
const testWallets = [
  "0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481", // #1
  "0x07DCE223775f17D6d09dbC3241b488cBb1e6Ce9f", // #2
  "0x2f7AD3F11c6d65909bfbdC0c9a4Cd8B512bc0334", // #3
  "0x1234567890123456789012345678901234567890", // #4
  "0x2345678901234567890123456789012345678901", // #5
  "0x3456789012345678901234567890123456789012", // #6
  "0x4567890123456789012345678901234567890123", // #7
  "0x5678901234567890123456789012345678901234", // #8
  "0x6789012345678901234567890123456789012345", // #9
  "0x7890123456789012345678901234567890123456", // #10
];

async function populate() {
  console.log("=".repeat(60));
  console.log("[POPULATE] Starting...");

  try {
    // 1. Clear old test data
    console.log("[POPULATE] Clearing old test data (FID >= 100000)...");
    const { error: deleteError } = await supabase
      .from("leaderboard")
      .delete()
      .gte("fid", 100000);

    if (deleteError) {
      console.log("[POPULATE] Warning:", deleteError.message);
    }

    // 2. Insert 10 test players
    const testPlayers = testWallets.map((wallet, i) => ({
      fid: 100000 + i + 1,
      username: `TestPlayer${i + 1}`,
      pfp_url: "https://i.imgur.com/test.png",
      wallet_address: wallet,
      score: 10000 - i * 500, // 10000, 9500, 9000, ...
    }));

    console.log("[POPULATE] Inserting 10 test players...");
    const { data, error } = await supabase
      .from("leaderboard")
      .insert(testPlayers)
      .select();

    if (error) throw error;

    console.log("[POPULATE] ✅ SUCCESS!");
    console.log("[POPULATE] Inserted:");
    console.log("=".repeat(60));
    data?.forEach((player, i) => {
      console.log(
        `  ${(i + 1).toString().padStart(2)}. ${player.username.padEnd(
          15
        )} | ${player.score
          .toString()
          .padStart(5)} pts | ${player.wallet_address.slice(
          0,
          6
        )}...${player.wallet_address.slice(-4)}`
      );
    });
    console.log("=".repeat(60));
  } catch (error) {
    console.error("[POPULATE] ❌ ERROR:", error.message);
  }
}

populate();
