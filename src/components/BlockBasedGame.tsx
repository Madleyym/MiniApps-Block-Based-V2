"use client";

import { saveScore, saveAdventureScore } from "@/lib/supabase";
import { useState, useEffect, useCallback, useRef, memo } from "react";
import { GameMenu } from "./GameMenu";
import { GameBoard } from "./GameBoard";
import { GameOverClassic } from "./game-over/GameOverClassic";
import { GameOverAdventure } from "./game-over/GameOverAdventure";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useAudio } from "@/hooks/useAudio";
import { useStorage } from "@/hooks/useStorage";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import {
  canPlacePiece,
  generateNewPieces,
  checkAndClearLines,
  colors,
  isGameOver,
  calculateComboBonus,
  getSafeGridPosition,
} from "@/utils/gameUtils";
import { BASE_MINI_APP_CONSTANTS } from "@/lib/minikit.config";
import sdk from "@farcaster/frame-sdk";

const { GRID_SIZE } = BASE_MINI_APP_CONSTANTS;

interface DraggedPiece {
  index: number;
  template: number[][];
}

interface HoverPosition {
  row: number;
  col: number;
  valid: boolean;
}

const DRAG_OFFSET = 100;
const HAPTIC_THROTTLE = 100;
const POINTER_MOVE_THROTTLE = 16;

const BlockBasedGame: React.FC = () => {
  const { gameState, updateGameState, resetGame } = useGameLogic();
  const { initAudio, playSound } = useAudio(gameState.soundEnabled);
  const {
    loadStoredData,
    saveData,
    saveContinueCount,
    saveGameState,
    loadGameState,
    clearGameState,
  } = useStorage();

  const {
    address: walletAddress,
    isConnected: isWalletConnected,
    isFrameWallet,
  } = useWalletConnection();

  const [showMenu, setShowMenu] = useState<boolean>(true);
  const [draggedPiece, setDraggedPiece] = useState<DraggedPiece | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition | null>(
    null
  );
  const [isReady, setIsReady] = useState<boolean>(false);
  const [gameLoaded, setGameLoaded] = useState<boolean>(false);
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [farcasterUser, setFarcasterUser] = useState<{
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  } | null>(null);

  // ✅ Optimized refs
  const isInitialized = useRef<boolean>(false);
  const activeModalRef = useRef<HTMLDivElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastHapticRef = useRef<number>(0);
  const lastPointerMoveRef = useRef<number>(0);
  const previewCacheRef = useRef<Map<string, HoverPosition>>(new Map());

  // ✅ Memoized haptic function
  const throttledHaptic = useCallback(
    (type: "light" | "medium" | "heavy" = "light") => {
      const now = Date.now();
      if (now - lastHapticRef.current < HAPTIC_THROTTLE) return;

      lastHapticRef.current = now;
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        const duration = type === "light" ? 10 : type === "medium" ? 20 : 50;
        navigator.vibrate(duration);
      }
    },
    []
  );

  const triggerHaptic = useCallback(
    (type: "light" | "medium" | "heavy" = "light") => {
      throttledHaptic(type);
    },
    [throttledHaptic]
  );

  const clearMostBlockingLine = useCallback((grid: (string | null)[][]) => {
    const newGrid = grid.map((row) => [...row]);
    let maxBlocks = 0;
    let targetRow = -1;

    for (let r = 0; r < GRID_SIZE; r++) {
      const blockCount = newGrid[r].filter((cell) => cell !== null).length;
      if (blockCount > maxBlocks) {
        maxBlocks = blockCount;
        targetRow = r;
      }
    }

    let maxColBlocks = 0;
    let targetCol = -1;

    for (let c = 0; c < GRID_SIZE; c++) {
      let blockCount = 0;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (newGrid[r][c] !== null) blockCount++;
      }
      if (blockCount > maxColBlocks) {
        maxColBlocks = blockCount;
        targetCol = c;
      }
    }

    if (maxBlocks >= maxColBlocks && targetRow >= 0) {
      for (let c = 0; c < GRID_SIZE; c++) {
        newGrid[targetRow][c] = null;
      }
    } else if (targetCol >= 0) {
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r][targetCol] = null;
      }
    }

    return newGrid;
  }, []);

  const handleContinueSuccess = useCallback(async () => {
    console.log("[GAME] Continue success handler started");

    // ✅ CRITICAL: Reinitialize audio after transaction
    try {
      console.log("[CONTINUE] 🔊 Reinitializing audio after transaction...");
      await initAudio();
      await playSound("clear");
    } catch (error) {
      console.error("[CONTINUE] Audio reinit failed:", error);
    }

    const currentScore = gameState.score;
    const currentLevel = gameState.currentLevel;
    const newContinueCount = gameState.continueCount + 1;

    const newGrid = clearMostBlockingLine(gameState.gameGrid);
    const newPieces = generateNewPieces();

    updateGameState({
      gameGrid: newGrid,
      currentPieces: newPieces,
      continueCount: newContinueCount,
    });

    saveContinueCount(newContinueCount);

    if (farcasterUser) {
      const userFid = farcasterUser.fid;

      console.log("[CONTINUE] Saving score...", {
        userFid,
        mode: gameState.gameMode,
        score: currentScore,
        level: currentLevel,
        continueCount: newContinueCount,
      });

          if (gameState.gameMode === "adventure") {
            saveAdventureScore(
              userFid,
              farcasterUser.username,
              currentScore,
              currentLevel,
              farcasterUser.pfpUrl,
              newContinueCount,
              "continue" // ✅ TAMBAH PARAMETER INI
            )
              .then(() => {
                console.log("[CONTINUE] ✅ Adventure score saved");
              })
              .catch((error) => {
                console.error("[CONTINUE] ❌ Adventure save failed:", error);
              });
          } else if (gameState.gameMode === "classic") {
            if (userFid >= 999990 && userFid <= 999999) {
              console.log(`[CONTINUE] ⏭️ Skipping test user FID ${userFid}`);
            } else {
              saveScore(
                userFid,
                farcasterUser.username,
                currentScore,
                farcasterUser.pfpUrl,
                walletAddress
              )
                .then(() => {
                  console.log(
                    "[CONTINUE] ✅ Classic score saved (paid continue)"
                  );
                })
                .catch((error) => {
                  console.error("[CONTINUE] ❌ Classic save failed:", error);
                });
            }
          }
    }

    setShowGameOverModal(false);
    console.log("[GAME] Continue success completed");
  }, [
    gameState,
    farcasterUser,
    walletAddress,
    initAudio,
    playSound,
    clearMostBlockingLine,
    updateGameState,
    saveContinueCount,
  ]);

  const handleShare = useCallback(async () => {
    await playSound("button");

    const gameUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://block-base-pi.vercel.app";

    const shareText = `I just scored ${gameState.score.toLocaleString()} points in Block Based!\n\nCan you beat my score?`;

    try {
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(
        shareText
      )}&embeds[]=${encodeURIComponent(gameUrl)}`;

      await sdk.actions.openUrl(composeUrl);
    } catch (error) {
      console.error("[SHARE] Failed:", error);

      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${gameUrl}`);
        alert("Share text copied to clipboard!");
      } catch {
        alert("Share failed. Please screenshot manually.");
      }
    }
  }, [gameState.score, playSound]);

  const showScorePopup = useCallback((score: number, x: number, y: number) => {
    const popup = document.createElement("div");
    popup.className = "score-popup";
    popup.textContent = `+${score}`;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    document.body.appendChild(popup);

    requestAnimationFrame(() => {
      popup.style.opacity = "1";
      popup.style.transform = "translateY(-40px) scale(1.2)";
    });

    setTimeout(() => {
      popup.style.opacity = "0";
      popup.style.transform = "translateY(-60px) scale(0.8)";
      setTimeout(() => {
        if (document.body.contains(popup)) document.body.removeChild(popup);
      }, 300);
    }, 700);
  }, []);

  const createParticles = useCallback(
    (x: number, y: number, count: number = 8) => {
      const particleColors = ["#8b5cf6", "#ec4899", "#3b82f6", "#f97316"];
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.className = "particle";
        const color =
          particleColors[Math.floor(Math.random() * particleColors.length)];
        particle.style.backgroundColor = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        const angle = (Math.PI * 2 * i) / count;
        const distance = 50 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        particle.style.setProperty("--tx", `${tx}px`);
        particle.style.setProperty("--ty", `${ty}px`);
        fragment.appendChild(particle);

        setTimeout(() => {
          if (document.body.contains(particle))
            document.body.removeChild(particle);
        }, 600);
      }

      document.body.appendChild(fragment);
    },
    []
  );

  const showComboAnimation = useCallback(
    (comboStreak: number, bonus: number): void => {
      const comboDisplay = document.getElementById("comboDisplay");
      if (comboDisplay && comboStreak > 0) {
        comboDisplay.textContent = `COMBO x${comboStreak + 1} +${bonus}`;
        comboDisplay.classList.add("show");
        setTimeout(() => comboDisplay.classList.remove("show"), 1400);
      }
    },
    []
  );

  const handleGameOver = useCallback(async (): Promise<void> => {
    console.log("[GAME OVER] 🚨 Triggered", {
      mode: gameState.gameMode,
      score: gameState.score,
      level: gameState.currentLevel,
    });

    const finalScore = gameState.score;
    const finalLevel = gameState.currentLevel;
    const mode = gameState.gameMode;

    await playSound("gameover");
    triggerHaptic("heavy");

    if (mode === "classic") {
      console.log("[GAME OVER] Processing Classic mode...");

      if (finalScore > gameState.bestScore) {
        saveData("BEST_SCORE", finalScore);
        const newVictories = gameState.dailyVictories + 1;
        saveData("DAILY_VICTORIES", newVictories);
        updateGameState({
          bestScore: finalScore,
          dailyVictories: newVictories,
        });
      }

      try {
        const userFid = farcasterUser?.fid || 999999;

        if (userFid >= 999990 && userFid <= 999999) {
          console.log(`[GAME OVER] ⏭️ Skipping test user FID ${userFid}`);
        } else {
          await saveScore(
            userFid,
            farcasterUser?.username || `user_${userFid}`,
            finalScore,
            farcasterUser?.pfpUrl,
            walletAddress
          );
          console.log("[GAME OVER] ✅ Classic score saved");
        }
      } catch (error) {
        console.error("[GAME OVER] ❌ Classic save failed:", error);
      }
    }

    if (mode === "adventure") {
      console.log("[GAME OVER] Processing Adventure mode...");

      try {
        if (farcasterUser && finalScore > 0) {
          // ✅ CRITICAL: Add 'gameover' saveType parameter
          await saveAdventureScore(
            farcasterUser.fid,
            farcasterUser.username,
            finalScore,
            finalLevel,
            farcasterUser.pfpUrl,
            gameState.continueCount,
            "gameover" // ✅ NEW: Explicitly mark as game over save
          );
          console.log("[GAME OVER] ✅ Adventure final score saved");
        }
      } catch (error) {
        console.error("[GAME OVER] ❌ Adventure save failed:", error);
      }
    }

    clearGameState();
    setShowGameOverModal(true);
  }, [
    gameState,
    playSound,
    triggerHaptic,
    saveData,
    updateGameState,
    farcasterUser,
    walletAddress,
    clearGameState,
  ]);

  const handleCloseGameOver = useCallback((): void => {
    setShowGameOverModal(false);
    setTimeout(() => setShowMenu(true), 300);
  }, []);

  const setupAdventureLevel = useCallback(
    (newLevel: number): void => {
      const target = newLevel * 500;
      const newGrid = Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null));
      const fillPercentage = Math.min(0.15 + newLevel * 0.005, 0.4);
      const cellsToFill = Math.floor(GRID_SIZE * GRID_SIZE * fillPercentage);

      for (let i = 0; i < cellsToFill; i++) {
        let row, col;
        do {
          row = Math.floor(Math.random() * GRID_SIZE);
          col = Math.floor(Math.random() * GRID_SIZE);
        } while (newGrid[row][col] !== null);
        newGrid[row][col] = colors[Math.floor(Math.random() * colors.length)];
      }

      updateGameState({ gameGrid: newGrid, levelTarget: target });
    },
    [updateGameState]
  );

  // ✅ FIXED: Generate New Pieces dengan game over check yang benar
  const handleGenerateNewPieces = useCallback((): void => {
    const newPieces = generateNewPieces();

    console.log("[PIECES] 🎲 Generated:", newPieces.length, "new pieces");

    updateGameState({ currentPieces: newPieces });
    playSound("newpiece");

    // ✅ FIX: Check game over menggunakan gameState.gameGrid langsung
    setTimeout(() => {
      console.log(
        "[GAME OVER CHECK] 🔍 Checking game over after generating new pieces"
      );
      const gameOver = isGameOver(newPieces, gameState.gameGrid);

      if (gameOver) {
        console.log(
          "[GAME OVER] ❌ No valid moves with new pieces - triggering game over"
        );
        setTimeout(() => {
          handleGameOver();
        }, 150);
      } else {
        console.log(
          "[GAME OVER CHECK] ✅ Game continues - valid moves available"
        );
      }
    }, 500); // ✅ Delay lebih lama untuk memastikan state sudah update
  }, [gameState.gameGrid, updateGameState, playSound, handleGameOver]);

  const placePiece = useCallback(
    (
      piece: number[][],
      startRow: number,
      startCol: number,
      pieceIndex: number
    ): void => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const newGrid = gameState.gameGrid.map((row) => [...row]);
      let cellsPlaced = 0;

      for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece[r].length; c++) {
          if (piece[r][c] === 1) {
            newGrid[startRow + r][startCol + c] = color;
            cellsPlaced++;
          }
        }
      }

      const newPieces = [...gameState.currentPieces];
      newPieces[pieceIndex].used = true;
      const placementScore = cellsPlaced * 10;

      updateGameState({
        gameGrid: newGrid,
        currentPieces: newPieces,
        moves: gameState.moves + 1,
        score: gameState.score + placementScore,
      });

      playSound("place");
      triggerHaptic("medium");

      const gridElement = document.querySelector(".game-grid");
      if (gridElement) {
        const rect = gridElement.getBoundingClientRect();
        const cellSize = rect.width / GRID_SIZE;

        const x =
          rect.left + (startCol + (piece[0]?.length || 1) / 2) * cellSize;
        const y = rect.top + (startRow + piece.length / 2) * cellSize;

        requestAnimationFrame(() => {
          showScorePopup(placementScore, x, y);
          createParticles(x, y, 6);
        });
      }

      let clearedGrid = newGrid;

      setTimeout(() => {
        const clearResult = checkAndClearLines(newGrid);
        clearedGrid = clearResult.newGrid;

        if (clearResult.cellsCleared.length > 0) {
          const newComboStreak = gameState.comboStreak + 1;
          const comboBonus = calculateComboBonus(
            newComboStreak,
            clearResult.scoreEarned
          );
          const totalScore = clearResult.scoreEarned + comboBonus;

          updateGameState({
            gameGrid: clearResult.newGrid,
            score: gameState.score + placementScore + totalScore,
            combo: gameState.combo + 1,
            comboStreak: newComboStreak,
          });

          setTimeout(() => {
            playSound(clearResult.linesCleared > 1 ? "combo" : "clear");
            triggerHaptic("heavy");
            if (newComboStreak > 0)
              showComboAnimation(newComboStreak, comboBonus);
          }, 50);
        } else {
          if (gameState.comboStreak > 0)
            updateGameState({ combo: 0, comboStreak: 0 });
        }
      }, 100);

      const allUsed = newPieces.every((p) => p.used);

      if (allUsed) {
        console.log("[PIECES] ✅ All pieces used - generating new pieces");
        setTimeout(() => handleGenerateNewPieces(), 1200);
      } else {
        // ✅ FIX: Check game over menggunakan clearedGrid (setelah line clear)
        setTimeout(() => {
          console.log(
            "[GAME OVER CHECK] 🔍 Checking game over after piece placement"
          );

          const unusedPieces = newPieces.filter((p) => !p.used);

          // ✅ CRITICAL: Gunakan clearedGrid, bukan gameState.gameGrid
          const gameOver = isGameOver(unusedPieces, clearedGrid);

          if (gameOver) {
            console.log(
              "[GAME OVER] ❌ No valid moves after placement - triggering game over"
            );
            setTimeout(() => {
              handleGameOver();
            }, 150);
          } else {
            console.log("[GAME OVER CHECK] ✅ Game continues after placement");
          }
        }, 600); // ✅ Tunggu lebih lama untuk memastikan line clear animation selesai
      }
    },
    [
      gameState,
      updateGameState,
      playSound,
      triggerHaptic,
      showScorePopup,
      createParticles,
      handleGenerateNewPieces,
      handleGameOver,
      showComboAnimation,
    ]
  );

  // ✅ OPTIMIZED: Touch handling with immediate sound feedback
  const handlePointerStart = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
      index: number
    ): void => {
      if (gameState.currentPieces[index].used) return;

      e.preventDefault();
      e.stopPropagation();

      // ✅ CRITICAL: Play sound IMMEDIATELY on touch/click
      playSound("button");
      triggerHaptic("light");

      const pieceData = {
        index,
        template: gameState.currentPieces[index].template,
      };

      setDraggedPiece(pieceData);
      isDraggingRef.current = true;
      previewCacheRef.current.clear();

      if ("touches" in e) {
        const touch = e.touches[0];
        dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      } else {
        dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [gameState.currentPieces, playSound, triggerHaptic]
  );

  const calculateHoverPosition = useCallback(
    (clientX: number, clientY: number, draggedPiece: DraggedPiece) => {
      const gridElement = document.querySelector(".game-grid");
      if (!gridElement) return null;

      const gridRect = gridElement.getBoundingClientRect();
      const cellSize = gridRect.width / GRID_SIZE;

      const pieceRows = draggedPiece.template.length;
      const pieceCols = draggedPiece.template[0]?.length || 1;

      const pieceCenterOffsetRow = (pieceRows - 1) / 2;
      const pieceCenterOffsetCol = (pieceCols - 1) / 2;

      const adjustedY = clientY - DRAG_OFFSET;

      const exactCol = (clientX - gridRect.left) / cellSize;
      const exactRow = (adjustedY - gridRect.top) / cellSize;

      const col = Math.round(exactCol - pieceCenterOffsetCol);
      const row = Math.round(exactRow - pieceCenterOffsetRow);

      const { row: safeRow, col: safeCol } = getSafeGridPosition(
        draggedPiece.template,
        row,
        col
      );

      const cacheKey = `${safeRow},${safeCol}`;
      const cached = previewCacheRef.current.get(cacheKey);

      if (cached) return cached;

      if (
        safeRow >= 0 &&
        safeRow < GRID_SIZE &&
        safeCol >= 0 &&
        safeCol < GRID_SIZE
      ) {
        const isValid = canPlacePiece(
          draggedPiece.template,
          safeRow,
          safeCol,
          gameState.gameGrid
        );

        const result = {
          row: safeRow,
          col: safeCol,
          valid: isValid,
        };

        previewCacheRef.current.set(cacheKey, result);
        return result;
      }

      return null;
    },
    [gameState.gameGrid]
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent): void => {
      if (!isDraggingRef.current || !draggedPiece) return;

      const now = Date.now();
      if (now - lastPointerMoveRef.current < POINTER_MOVE_THROTTLE) return;
      lastPointerMoveRef.current = now;

      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const result = calculateHoverPosition(clientX, clientY, draggedPiece);
        setHoverPosition(result);
      });
    },
    [draggedPiece, calculateHoverPosition]
  );

  const handlePointerEnd = useCallback(
    (e: MouseEvent | TouchEvent): void => {
      if (!isDraggingRef.current || !draggedPiece) return;

      e.preventDefault();

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const clientX =
        "changedTouches" in e
          ? e.changedTouches[0].clientX
          : (e as MouseEvent).clientX;
      const clientY =
        "changedTouches" in e
          ? e.changedTouches[0].clientY
          : (e as MouseEvent).clientY;

      const hasMoved = dragStartPosRef.current
        ? Math.abs(clientX - dragStartPosRef.current.x) > 5 ||
          Math.abs(clientY - dragStartPosRef.current.y) > 5
        : true;

      if (!hasMoved) {
        // ✅ Play sound even on tap without drag
        playSound("button");
        setDraggedPiece(null);
        setHoverPosition(null);
        isDraggingRef.current = false;
        dragStartPosRef.current = null;
        previewCacheRef.current.clear();
        return;
      }

      if (hoverPosition && hoverPosition.valid) {
        // ✅ Sound will be played in placePiece function
        placePiece(
          draggedPiece.template,
          hoverPosition.row,
          hoverPosition.col,
          draggedPiece.index
        );
      } else {
        const result = calculateHoverPosition(clientX, clientY, draggedPiece);

        if (result && result.valid) {
          // ✅ Sound will be played in placePiece function
          placePiece(
            draggedPiece.template,
            result.row,
            result.col,
            draggedPiece.index
          );
        } else {
          // ✅ CRITICAL: Play invalid sound with haptic
          playSound("invalid");
          triggerHaptic("light");
        }
      }

      setDraggedPiece(null);
      setHoverPosition(null);
      isDraggingRef.current = false;
      dragStartPosRef.current = null;
      previewCacheRef.current.clear();
    },
    [
      draggedPiece,
      hoverPosition,
      calculateHoverPosition,
      placePiece,
      playSound,
      triggerHaptic,
    ]
  );

  // ✅ OPTIMIZED: Single initialization effect
  useEffect(() => {
    if (isInitialized.current) return;

    console.log("[INIT] 🚀 Initializing app...");

    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
        setSdkLoaded(true);
        setIsReady(true);
      } catch (error) {
        console.error("[SDK] Failed:", error);
        setIsReady(true);
      }
    };

    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };

    document.addEventListener("touchstart", preventZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, false);
    document.body.classList.add("mini-app-container");

    const storedData = loadStoredData();
    if (storedData) {
      console.log("[LOAD] Loading stored stats");
      updateGameState({
        bestScore: storedData.bestScore || 0,
        dailyVictories: storedData.dailyVictories || 0,
        soundEnabled: storedData.soundEnabled ?? true,
        continueCount: storedData.continueCount || 0,
      });
    }

    initializeSDK();
    setGameLoaded(true);
    setShowMenu(true);
    isInitialized.current = true;

    return () => {
      document.removeEventListener("touchstart", preventZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
      document.body.classList.remove("mini-app-container");

      if (
        activeModalRef.current &&
        document.body.contains(activeModalRef.current)
      ) {
        document.body.removeChild(activeModalRef.current);
      }
    };
  }, [loadStoredData, updateGameState]);

  // ✅ OPTIMIZED: User detection
  useEffect(() => {
    if (!sdkLoaded || farcasterUser) return;

    const getFarcasterUser = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setFarcasterUser({
            fid: context.user.fid,
            username: context.user.username || `user_${context.user.fid}`,
            displayName:
              context.user.displayName || context.user.username || "Player",
            pfpUrl:
              context.user.pfpUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${context.user.fid}`,
          });
        } else {
          setFarcasterUser({
            fid: 999999,
            username: "localhost_user",
            displayName: "Test User",
            pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=999999",
          });
        }
      } catch {
        setFarcasterUser({
          fid: 999999,
          username: "guest",
          displayName: "Guest Player",
          pfpUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=guest",
        });
      }
    };

    getFarcasterUser();
  }, [sdkLoaded, farcasterUser]);

  // ✅ OPTIMIZED: Drag handlers
  useEffect(() => {
    if (!draggedPiece) return;

    const handleMove = (e: Event) =>
      handlePointerMove(e as MouseEvent | TouchEvent);
    const handleEnd = (e: Event) =>
      handlePointerEnd(e as MouseEvent | TouchEvent);

    document.addEventListener("mousemove", handleMove, { passive: false });
    document.addEventListener("mouseup", handleEnd, { passive: false });
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleEnd, { passive: false });

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [draggedPiece, handlePointerMove, handlePointerEnd]);

  // ✅ OPTIMIZED: Auto-save
  useEffect(() => {
    if (
      showMenu ||
      gameState.score === 0 ||
      gameState.currentPieces.length === 0
    )
      return;

    const saveInterval = setInterval(() => {
      saveGameState({
        gameGrid: gameState.gameGrid,
        score: gameState.score,
        moves: gameState.moves,
        combo: gameState.combo,
        comboStreak: gameState.comboStreak,
        currentLevel: gameState.currentLevel,
        levelTarget: gameState.levelTarget,
        gameMode: gameState.gameMode,
        continueCount: gameState.continueCount,
        lastSaveTimestamp: Date.now(),
      });
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [showMenu, gameState, saveGameState]);

  // ✅ OPTIMIZED: Level up (NO duplicate saves)
  useEffect(() => {
    if (
      gameState.gameMode !== "adventure" ||
      gameState.score < gameState.levelTarget ||
      showGameOverModal ||
      gameState.currentPieces.length === 0
    )
      return;

    const newLevel = gameState.currentLevel + 1;
    const newTarget = newLevel * 500;
    const finalScore = gameState.score;
    const completedLevel = gameState.currentLevel;

      playSound("levelup");
      triggerHaptic("heavy");
      setTimeout(() => {
        const overlay = document.createElement("div");
        overlay.className = "level-up-overlay";
        overlay.innerHTML = `
      <div class="level-up-content">
        <div class="level-up-stars">
          <div class="star star-1">⭐</div>
          <div class="star star-2">⭐</div>
          <div class="star star-3">⭐</div>
          <div class="star star-4">⭐</div>
          <div class="star star-5">⭐</div>
        </div>
        <div class="level-up-badge">
          <div class="level-up-icon">🏆</div>
          <div class="level-up-title">LEVEL ${newLevel} UNLOCKED!</div>
          <div class="level-up-subtitle">Level ${completedLevel} Completed</div>
        </div>
        <div class="level-up-stats">
          <div class="stat-item">
            <div class="stat-label">Final Score</div>
            <div class="stat-value">${finalScore.toLocaleString()}</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-label">New Target</div>
            <div class="stat-value">${newTarget.toLocaleString()}</div>
          </div>
        </div>
        <div class="level-up-message">Score reset! Reach ${newTarget.toLocaleString()} to advance!</div>
      </div>
      <div class="level-up-fireworks">
        <div class="firework" style="left:20%;top:30%;"></div>
        <div class="firework" style="left:80%;top:40%;"></div>
        <div class="firework" style="left:50%;top:20%;"></div>
        <div class="firework" style="left:30%;top:60%;"></div>
        <div class="firework" style="left:70%;top:50%;"></div>
      </div>
    `;
        document.body.appendChild(overlay);

        setTimeout(() => {
          overlay.classList.add("fade-out");
          setTimeout(() => {
            if (document.body.contains(overlay))
              document.body.removeChild(overlay);
          }, 500);
        }, 3000);

        setupAdventureLevel(newLevel);
        updateGameState({
          currentLevel: newLevel,
          score: 0,
          levelTarget: newTarget,
        });

        setTimeout(() => handleGenerateNewPieces(), 3500);
      }, 300);
  }, [
    gameState.gameMode,
    gameState.score,
    gameState.levelTarget,
    gameState.currentLevel,
    gameState.currentPieces.length,
    gameState.continueCount,
    showGameOverModal,
    playSound,
    triggerHaptic,
    setupAdventureLevel,
    updateGameState,
    farcasterUser,
    handleGenerateNewPieces,
  ]);

  // ✅ ENHANCED: Start game with audio reinit
  const startGame = useCallback(
    async (mode: "classic" | "adventure"): Promise<void> => {
      console.log("[START GAME] 🎮 Mode:", mode);

      const savedGame = loadGameState();

      if (savedGame && savedGame.gameMode === mode && savedGame.score > 0) {
        console.log("[START GAME] 📂 Loading saved game");

        updateGameState({
          gameGrid: savedGame.gameGrid,
          score: savedGame.score,
          moves: savedGame.moves,
          combo: savedGame.combo,
          comboStreak: savedGame.comboStreak,
          currentLevel: savedGame.currentLevel,
          levelTarget: savedGame.levelTarget,
          gameMode: savedGame.gameMode,
          continueCount: savedGame.continueCount,
        });

        setShowMenu(false);
        setShowGameOverModal(false);

        // ✅ CRITICAL: Reinit audio when starting/resuming game
        try {
          console.log("[START GAME] 🔊 Initializing audio...");
          await initAudio();
          await playSound("button");
        } catch (error) {
          console.error("[START GAME] Audio init failed:", error);
        }

        setTimeout(() => {
          console.log("[START GAME] 🎲 Generating pieces");
          handleGenerateNewPieces();
        }, 200);
        return;
      }

      console.log("[START GAME] 🆕 Starting NEW game");

      resetGame(mode);
      setShowMenu(false);

      // ✅ CRITICAL: Reinit audio for new game
      try {
        console.log("[START GAME] 🔊 Initializing audio...");
        await initAudio();
        await playSound("button");
      } catch (error) {
        console.error("[START GAME] Audio init failed:", error);
      }

      setShowGameOverModal(false);

      if (mode === "adventure") {
        setTimeout(() => setupAdventureLevel(gameState.currentLevel), 100);
      }

      setTimeout(() => {
        console.log("[START GAME] 🎲 Generating initial pieces");
        handleGenerateNewPieces();
      }, 200);
    },
    [
      resetGame,
      initAudio,
      playSound,
      setupAdventureLevel,
      gameState.currentLevel,
      handleGenerateNewPieces,
      loadGameState,
      updateGameState,
    ]
  );

  const backToMenu = useCallback((): void => {
    console.log("[BACK TO MENU] 🏠 Returning to menu");

    setShowMenu(true);
    setDraggedPiece(null);
    setHoverPosition(null);
    setShowGameOverModal(false);
    setSettingsOpen(false);

    updateGameState({
      currentPieces: [],
    });

    previewCacheRef.current.clear();
  }, [updateGameState]);

  const handleMoreGames = useCallback(
    (
      e:
        | React.MouseEvent<HTMLButtonElement>
        | React.TouchEvent<HTMLButtonElement>
    ): void => {
      if (!e || !e.isTrusted) {
        console.log("[MORE GAMES] ❌ Blocked: Not a trusted user event");
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      console.log("[MORE GAMES] ✅ Manual click detected");

      // ✅ Play sound
      playSound("button");

      if (
        activeModalRef.current &&
        document.body.contains(activeModalRef.current)
      ) {
        document.body.removeChild(activeModalRef.current);
      }

      const modal = document.createElement("div");
      modal.className = "coming-soon-modal";
      modal.innerHTML = `
      <div class="coming-soon-overlay"></div>
      <div class="coming-soon-content">
        <h2 class="coming-soon-title">Coming Soon!</h2>
        <p class="coming-soon-text">We're working on exciting new games for you:</p>
        <div class="coming-soon-games">
          <div class="coming-soon-game">
            <span class="game-emoji">⚡</span>
            <span class="game-name">Block Blast</span>
            <span class="game-tag">Action Mode</span>
          </div>
          <div class="coming-soon-game">
            <span class="game-emoji">⏱️</span>
            <span class="game-name">Time Attack</span>
            <span class="game-tag">Challenge Mode</span>
          </div>
          <div class="coming-soon-game">
            <span class="game-emoji">⚔️</span>
            <span class="game-name">Battle Mode</span>
            <span class="game-tag">Multiplayer</span>
          </div>
        </div>
        <div class="coming-soon-footer">
          <p class="coming-soon-hint">Follow me on Farcaster for updates!</p>
        </div>
        <button type="button" class="coming-soon-follow" id="followFarcaster">Follow on Farcaster</button>
        <button type="button" class="coming-soon-close" id="closeComingSoon">Close</button>
      </div>
    `;

      activeModalRef.current = modal;
      document.body.appendChild(modal);

      const followBtn = document.getElementById("followFarcaster");
      const handleFollow = (ev?: Event) => {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }

        // ✅ Play sound
        playSound("button");

        const profileUrl = "https://warpcast.com/qianrere";
        try {
          sdk.actions.openUrl(profileUrl);
        } catch (error) {
          window.open(profileUrl, "_blank");
        }

        modal.classList.add("fade-out");
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
            if (activeModalRef.current === modal) {
              activeModalRef.current = null;
            }
          }
        }, 300);
      };

      const closeBtn = document.getElementById("closeComingSoon");
      const handleClose = (ev?: Event) => {
        if (ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }

        // ✅ Play sound
        playSound("button");

        modal.classList.add("fade-out");
        setTimeout(() => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
            if (activeModalRef.current === modal) {
              activeModalRef.current = null;
            }
          }
        }, 300);
      };

      followBtn?.addEventListener("click", handleFollow, { once: true });
      closeBtn?.addEventListener("click", handleClose, { once: true });

      const overlay = modal.querySelector(".coming-soon-overlay");
      overlay?.addEventListener("click", handleClose, { once: true });
    },
    [playSound]
  );

  const toggleSound = useCallback((): void => {
    const newSoundState = !gameState.soundEnabled;
    updateGameState({ soundEnabled: newSoundState });
    saveData("SOUND_ENABLED", newSoundState);
    if (newSoundState) {
      initAudio();
      playSound("button");
    }
  }, [gameState.soundEnabled, updateGameState, saveData, initAudio, playSound]);

  const restartGame = useCallback((): void => {
    clearGameState();
    setSettingsOpen(false);
    startGame(gameState.gameMode);
  }, [startGame, gameState.gameMode, clearGameState]);

  const handleWalletClick = useCallback(async () => {
    // ✅ Play sound
    await playSound("button");

    if (isWalletConnected && walletAddress) {
      const source = isFrameWallet ? "Farcaster" : "Browser";
      alert(
        `Wallet Connected\n\n${walletAddress.slice(
          0,
          6
        )}...${walletAddress.slice(-4)}\n\nSource: ${source}`
      );
    } else {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            alert(
              `Wallet Connected!\n\n${address.slice(0, 6)}...${address.slice(
                -4
              )}\n\nRefresh to see wallet status.`
            );

            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else if (sdk.wallet?.ethProvider) {
          const accounts = await sdk.wallet.ethProvider.request({
            method: "eth_requestAccounts",
          });

          if (accounts && accounts.length > 0) {
            const address = accounts[0];
            alert(
              `Wallet Connected!\n\n${address.slice(0, 6)}...${address.slice(
                -4
              )}\n\nRefresh to see wallet status.`
            );

            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } else {
          alert(
            "No wallet detected.\n\nPlease:\n1. Use Farcaster mobile app\n2. Or install MetaMask/Coinbase Wallet\n3. Then try again"
          );
        }
      } catch (error: any) {
        if (error.code === 4001) {
          alert(
            "Connection rejected.\n\nPlease try again and approve the connection."
          );
        } else {
          alert(
            "Failed to connect wallet.\n\nPlease ensure:\n1. You're in Farcaster app or have wallet installed\n2. Wallet is unlocked\n3. Try refreshing the page"
          );
        }
      }
    }
  }, [playSound, isWalletConnected, walletAddress, isFrameWallet]);

  const isCellHighlighted = useCallback(
    (row: number, col: number): boolean => {
      if (!hoverPosition || !draggedPiece) return false;

      const { row: hRow, col: hCol } = hoverPosition;

      for (let r = 0; r < draggedPiece.template.length; r++) {
        for (let c = 0; c < draggedPiece.template[r].length; c++) {
          if (
            draggedPiece.template[r][c] === 1 &&
            hRow + r === row &&
            hCol + c === col
          ) {
            return true;
          }
        }
      }
      return false;
    },
    [hoverPosition, draggedPiece]
  );

  if (!gameLoaded || !isReady) {
    return null;
  }

  console.log("[RENDER] State:", {
    showMenu,
    pieces: gameState.currentPieces.length,
    mode: gameState.gameMode,
  });

  const shouldShowMenu =
    showMenu || gameState.currentPieces.length === 0 || !gameState.gameMode;

  if (shouldShowMenu) {
    return (
      <>
        <GameMenu
          dailyVictories={gameState.dailyVictories}
          onStartGame={startGame}
          onMoreGames={handleMoreGames}
          bestScore={gameState.bestScore}
          userFid={farcasterUser?.fid}
          playSound={playSound}
          initAudio={initAudio}
        />
        <div className="combo-display" id="comboDisplay"></div>
      </>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          touchAction: "none",
          WebkitTouchCallout: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          isolation: "isolate",
          zIndex: 1,
        }}
      >
        <GameBoard
          ref={gridContainerRef}
          gameState={gameState}
          onBackToMenu={backToMenu}
          onDragOver={() => {}}
          onDrop={() => {}}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          onTouchStart={(e, index) => handlePointerStart(e, index)}
          onTouchMove={() => {}}
          onTouchEnd={() => {}}
          onRestart={restartGame}
          onToggleSound={toggleSound}
          onWalletClick={handleWalletClick}
          onOpenSettings={() => setSettingsOpen(true)}
          settingsOpen={settingsOpen}
          onCloseSettings={() => setSettingsOpen(false)}
          hoverPosition={hoverPosition}
          draggedPiece={draggedPiece}
          touchPiece={null}
          onCellHover={() => {}}
          onCellLeave={() => {}}
          isCellHighlighted={isCellHighlighted}
          isWalletConnected={isWalletConnected}
          walletAddress={walletAddress || undefined}
          farcasterUser={farcasterUser}
          playSound={playSound}
          initAudio={initAudio}
        />
        <div className="combo-display" id="comboDisplay"></div>
        <div className="streak-indicator" id="streakIndicator"></div>
      </div>

      {gameState.gameMode === "classic" && (
        <GameOverClassic
          isOpen={showGameOverModal}
          score={gameState.score}
          bestScore={gameState.bestScore}
          moves={gameState.moves}
          continueCount={gameState.continueCount}
          isWalletConnected={isWalletConnected}
          walletAddress={walletAddress || undefined}
          userFid={farcasterUser?.fid}
          onContinue={handleContinueSuccess}
          onRestart={restartGame}
          onMenu={handleCloseGameOver}
          onShare={handleShare}
          onWalletClick={handleWalletClick}
        />
      )}

      {gameState.gameMode === "adventure" && (
        <GameOverAdventure
          isOpen={showGameOverModal}
          score={gameState.score}
          moves={gameState.moves}
          continueCount={gameState.continueCount}
          currentLevel={gameState.currentLevel}
          onContinue={handleContinueSuccess}
          onRestart={restartGame}
          onMenu={handleCloseGameOver}
          onShare={handleShare}
        />
      )}
    </>
  );
};

export default memo(BlockBasedGame);
