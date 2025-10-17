import { useCallback } from "react";
import { BASE_MINI_APP_CONSTANTS } from "@/lib/minikit.config";

const { STORAGE_KEYS } = BASE_MINI_APP_CONSTANTS;

// ✅ Extended storage keys
const EXTENDED_STORAGE_KEYS = {
  ...STORAGE_KEYS,
  GAME_STATE: "BLOCK_BASED_GAME_STATE",
  LAST_SAVE: "BLOCK_BASED_LAST_SAVE",
  CONTINUE_COUNT: "BLOCK_BASED_CONTINUE_COUNT",
} as const;

export interface SavedGameState {
  gameGrid: (string | null)[][];
  score: number;
  moves: number;
  combo: number;
  comboStreak: number;
  currentLevel: number;
  levelTarget: number;
  gameMode: "classic" | "adventure";
  continueCount: number;
  lastSaveTimestamp: number;
}

export const useStorage = () => {
  const loadStoredData = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      return {
        bestScore: parseInt(
          localStorage.getItem(STORAGE_KEYS.BEST_SCORE) || "0"
        ),
        dailyVictories: parseInt(
          localStorage.getItem(STORAGE_KEYS.DAILY_VICTORIES) || "0"
        ),
        soundEnabled:
          localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED) !== "false",
        currentLevel: parseInt(
          localStorage.getItem(STORAGE_KEYS.CURRENT_LEVEL) || "1"
        ),
        continueCount: parseInt(
          localStorage.getItem(EXTENDED_STORAGE_KEYS.CONTINUE_COUNT) || "0"
        ),
      };
    } catch (error) {
      console.warn("[STORAGE] Failed to load saved data:", error);
      return null;
    }
  }, []);

  const saveData = useCallback(
    (key: keyof typeof STORAGE_KEYS, value: string | number | boolean) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(STORAGE_KEYS[key], value.toString());
      } catch (error) {
        console.warn("[STORAGE] Failed to save data:", error);
      }
    },
    []
  );

  const saveContinueCount = useCallback((count: number) => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        EXTENDED_STORAGE_KEYS.CONTINUE_COUNT,
        count.toString()
      );
      console.log(`[STORAGE] ✅ Continue count saved: ${count}`);
    } catch (error) {
      console.warn("[STORAGE] Failed to save continue count:", error);
    }
  }, []);

  const saveGameState = useCallback((state: SavedGameState) => {
    if (typeof window === "undefined") return;

    try {
      const stateWithTimestamp = {
        ...state,
        lastSaveTimestamp: Date.now(),
      };

      localStorage.setItem(
        EXTENDED_STORAGE_KEYS.GAME_STATE,
        JSON.stringify(stateWithTimestamp)
      );

      localStorage.setItem(
        EXTENDED_STORAGE_KEYS.CONTINUE_COUNT,
        state.continueCount.toString()
      );

      console.log("[STORAGE] ✅ Game state saved:", {
        score: state.score,
        level: state.currentLevel,
        mode: state.gameMode,
        continues: state.continueCount,
      });
    } catch (error) {
      console.warn("[STORAGE] Failed to save game state:", error);
    }
  }, []);

  const loadGameState = useCallback((): SavedGameState | null => {
    if (typeof window === "undefined") return null;

    try {
      const saved = localStorage.getItem(EXTENDED_STORAGE_KEYS.GAME_STATE);

      if (!saved) return null;

      const state = JSON.parse(saved) as SavedGameState;

      const now = Date.now();
      const hoursSinceLastSave =
        (now - state.lastSaveTimestamp) / (1000 * 60 * 60);

      if (hoursSinceLastSave > 24) {
        console.log("[STORAGE] Save too old, clearing...");
        clearGameState();
        return null;
      }

      console.log("[STORAGE] ✅ Game state loaded:", {
        score: state.score,
        level: state.currentLevel,
        mode: state.gameMode,
        continues: state.continueCount,
        age: `${hoursSinceLastSave.toFixed(1)}h ago`,
      });

      return state;
    } catch (error) {
      console.warn("[STORAGE] Failed to load game state:", error);
      return null;
    }
  }, []);

  const clearGameState = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(EXTENDED_STORAGE_KEYS.GAME_STATE);
      localStorage.removeItem(EXTENDED_STORAGE_KEYS.CONTINUE_COUNT);
      console.log("[STORAGE] ✅ Game state cleared");
    } catch (error) {
      console.warn("[STORAGE] Failed to clear game state:", error);
    }
  }, []);

  return {
    loadStoredData,
    saveData,
    saveContinueCount,
    saveGameState,
    loadGameState,
    clearGameState,
  };
};
