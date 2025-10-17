import { useState, useCallback } from "react";

export interface PieceData {
  template: number[][];
  used: boolean;
}

export interface GameState {
  gameGrid: (string | null)[][];
  currentPieces: PieceData[];
  score: number;
  moves: number;
  combo: number;
  comboStreak: number;
  bestScore: number;
  currentLevel: number;
  levelTarget: number;
  gameMode: "classic" | "adventure";
  dailyVictories: number;
  soundEnabled: boolean;
  continueCount: number; // ✅ NEW: Track continue attempts
}

const GRID_SIZE = 8;

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    gameGrid: Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null)),
    currentPieces: [],
    score: 0,
    moves: 0,
    combo: 0,
    comboStreak: 0,
    bestScore: 0,
    currentLevel: 1,
    levelTarget: 500,
    gameMode: "classic",
    dailyVictories: 0,
    soundEnabled: true,
    continueCount: 0, // ✅ NEW: Initialize at 0
  });

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetGame = useCallback((mode: "classic" | "adventure") => {
    setGameState((prev) => ({
      ...prev,
      gameGrid: Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null)),
      currentPieces: [],
      score: 0,
      moves: 0,
      combo: 0,
      comboStreak: 0,
      gameMode: mode,
      currentLevel: mode === "adventure" ? prev.currentLevel : 1,
      levelTarget: mode === "adventure" ? prev.currentLevel * 500 : 500,
      continueCount: 0, // ✅ NEW: Reset continue counter on game restart
    }));
  }, []);

  return { gameState, updateGameState, resetGame };
};
