"use client";

import {
  Home,
  RotateCcw,
  Volume2,
  VolumeX,
  Wallet,
  X,
  DollarSign,
  Crown,
  Trophy,
  ExternalLink,
  Gift,
  User,
  Zap,
} from "lucide-react";
import { useState, useEffect, forwardRef, useCallback, memo } from "react";
import { BASE_MINI_APP_CONSTANTS } from "@/lib/minikit.config";
import { CONTRACTS, ABIS } from "@/lib/contracts.config";
import { GameState } from "@/hooks/useGameLogic";
import { useClaimReward } from "@/hooks/useClaimReward";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useDailyGM } from "@/hooks/useDailyGM";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { base } from "viem/chains";
import { LeaderboardClassic } from "@/components/modals/LeaderboardClassic";
import { LeaderboardAdventure } from "@/components/modals/LeaderboardAdventure";
import { Docs } from "@/components/Docs";
import { calculatePieceEdgeOffset } from "@/utils/gameUtils";

type SoundType =
  | "place"
  | "clear"
  | "levelup"
  | "combo"
  | "gameover"
  | "newpiece"
  | "invalid"
  | "winstreak"
  | "button";

interface GameBoardProps {
  gameState: GameState;
  onBackToMenu: () => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (
    e: React.DragEvent<HTMLDivElement>,
    row: number,
    col: number
  ) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd?: () => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>, index: number) => void;
  onTouchMove?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onWalletClick: () => void;
  onOpenSettings: () => void;
  settingsOpen: boolean;
  onCloseSettings: () => void;
  hoverPosition?: { row: number; col: number; valid: boolean } | null;
  draggedPiece?: { index: number; template: number[][] } | null;
  touchPiece?: { index: number; template: number[][] } | null;
  onCellHover?: (row: number, col: number) => void;
  onCellLeave?: () => void;
  isCellHighlighted?: (row: number, col: number) => boolean;
  isWalletConnected?: boolean;
  walletAddress?: string;
  farcasterUser?: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
  } | null;
  playSound?: (type: SoundType) => Promise<void>;
  initAudio?: () => Promise<void>;
}

const { GRID_SIZE } = BASE_MINI_APP_CONSTANTS;
const ADMIN_ADDRESS = "0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481";

export const GameBoard = memo(
  forwardRef<HTMLDivElement, GameBoardProps>(
    (
      {
        gameState,
        onBackToMenu,
        onDragOver,
        onDrop,
        onDragStart,
        onDragEnd,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onRestart,
        onToggleSound,
        onWalletClick,
        onOpenSettings,
        settingsOpen,
        onCloseSettings,
        onCellHover,
        onCellLeave,
        isCellHighlighted,
        hoverPosition,
        draggedPiece,
        touchPiece,
        isWalletConnected = false,
        walletAddress,
        farcasterUser,
        playSound,
        initAudio,
      },
      ref
    ) => {
      const {
        address: detectedAddress,
        isConnected: detectedConnected,
        isFrameWallet,
      } = useWalletConnection();

      const [docsOpen, setDocsOpen] = useState(false);
      const actualAddress = detectedAddress || walletAddress;
      const actualConnected = detectedConnected || isWalletConnected;
      const isAdmin =
        actualAddress?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

      const [leaderboardOpen, setLeaderboardOpen] = useState(false);
      const [showWalletOverlay, setShowWalletOverlay] = useState(false);
      const [claimableRewards, setClaimableRewards] = useState<{
        canClaim: boolean;
        amount: string;
        week: number;
        reason: string;
      } | null>(null);
      const [loadingClaim, setLoadingClaim] = useState(false);

      const { claimReward, claiming } = useClaimReward(
        claimableRewards?.week || 0
      );

      const { sayGM, gmData, loading: gmLoading } = useDailyGM();

      // ✅ NEW: Lock body scroll when game is active
      useEffect(() => {
        console.log("[GAMEBOARD] Mounting - Adding game-active class to body");
        document.body.classList.add("game-active");
        return () => {
          console.log(
            "[GAMEBOARD] Unmounting - Removing game-active class from body"
          );
          document.body.classList.remove("game-active");
        };
      }, []);

      // ✅ OPTIMIZED: Prevent pull-to-refresh on mobile
      useEffect(() => {
        const preventPullToRefresh = (e: TouchEvent) => {
          if (e.touches.length > 1) return;

          const touch = e.touches[0];
          const scrollY = window.scrollY;

          if (scrollY === 0 && touch.clientY > touch.clientX) {
            e.preventDefault();
          }
        };

        document.addEventListener("touchmove", preventPullToRefresh, {
          passive: false,
        });

        return () => {
          document.removeEventListener("touchmove", preventPullToRefresh);
        };
      }, []);

      // ✅ OPTIMIZED: Auto-hide wallet overlay
      useEffect(() => {
        if (showWalletOverlay) {
          const timer = setTimeout(() => {
            setShowWalletOverlay(false);
          }, 2000);
          return () => clearTimeout(timer);
        }
      }, [showWalletOverlay]);

      // ✅ OPTIMIZED: Check claimable rewards
      useEffect(() => {
        if (settingsOpen && actualConnected && actualAddress) {
          checkClaimableRewards();
        }
      }, [settingsOpen, actualConnected, actualAddress]);

      // ✅ NEW: Reinit audio when settings open
      useEffect(() => {
        if (settingsOpen && initAudio) {
          console.log("[GAMEBOARD] Settings opened, reinitializing audio...");
          initAudio().catch((err) =>
            console.warn("[GAMEBOARD] Audio reinit failed:", err)
          );
        }
      }, [settingsOpen, initAudio]);

      // ✅ OPTIMIZED: Memoized functions
      const checkClaimableRewards = useCallback(async () => {
        if (!actualAddress) return;

        setLoadingClaim(true);
        try {
          const rewardsRes = await fetch("/api/rewards");
          const rewardsData = await rewardsRes.json();

          if (rewardsData.success) {
            const currentWeek = rewardsData.data.currentWeek;
            const previousWeek = currentWeek - 1;

            const claimRes = await fetch(
              `/api/user-rewards?wallet=${actualAddress}&week=${previousWeek}`
            );
            const claimData = await claimRes.json();

            if (claimData.success) {
              setClaimableRewards(claimData.data);
            }
          }
        } catch (error) {
          console.error("[CLAIM CHECK] Error:", error);
        } finally {
          setLoadingClaim(false);
        }
      }, [actualAddress]);

      const handleClaimClick = useCallback(async () => {
        if (!claimableRewards?.canClaim) return;

        // ✅ Play sound before claiming
        if (playSound) {
          await playSound("button");
        }

        await claimReward();

        setTimeout(() => {
          checkClaimableRewards();
        }, 3000);
      }, [claimableRewards, claimReward, checkClaimableRewards, playSound]);

      const handleSayGM = useCallback(async () => {
        console.log("[GameBoard] GM button clicked");

        // ✅ Play sound before GM
        if (playSound) {
          await playSound("button");
        }

        await sayGM();
      }, [sayGM, playSound]);

      const handleWalletClickInternal = useCallback(async () => {
        // ✅ Play sound on wallet click
        if (playSound) {
          await playSound("button");
        }

        if (actualConnected && actualAddress) {
          setShowWalletOverlay(true);
        }
      }, [actualConnected, actualAddress, playSound]);

      const getWalletTitle = useCallback(() => {
        if (!actualConnected) return "Connect Wallet";
        return `Connected\n${actualAddress?.slice(
          0,
          6
        )}...${actualAddress?.slice(-4)}`;
      }, [actualConnected, actualAddress]);

      // ✅ NEW: Handle back to menu with sound
      const handleBackToMenu = useCallback(async () => {
        if (playSound) {
          await playSound("button");
        }
        onBackToMenu();
        onCloseSettings();
      }, [onBackToMenu, onCloseSettings, playSound]);

      // ✅ NEW: Handle restart with sound
      const handleRestart = useCallback(async () => {
        if (playSound) {
          await playSound("button");
        }
        onRestart();
        onCloseSettings();
      }, [onRestart, onCloseSettings, playSound]);

      // ✅ NEW: Handle toggle sound with sound
      const handleToggleSound = useCallback(async () => {
        if (gameState.soundEnabled && playSound) {
          await playSound("button");
        }
        onToggleSound();
      }, [onToggleSound, gameState.soundEnabled, playSound]);

      // ✅ NEW: Handle docs open with sound
      const handleDocsOpen = useCallback(async () => {
        if (playSound) {
          await playSound("button");
        }
        setDocsOpen(true);
        onCloseSettings();
      }, [playSound, onCloseSettings]);

      // ✅ NEW: Handle leaderboard with sound
      const handleLeaderboardOpen = useCallback(async () => {
        if (playSound) {
          await playSound("button");
        }
        setLeaderboardOpen(true);
      }, [playSound]);

      // ✅ NEW: Handle settings open with sound
      const handleOpenSettings = useCallback(async () => {
        if (playSound) {
          await playSound("button");
        }
        onOpenSettings();
      }, [onOpenSettings, playSound]);

      // ✅ NEW: Handle settings close with sound
      const handleCloseSettings = useCallback(async () => {
        if (playSound) {
          await playSound("button");
        }
        onCloseSettings();
      }, [onCloseSettings, playSound]);

      return (
        <div className="min-h-screen game-background">
          <div className="miniapp-content">
            {/* ============================================
                HEADER SECTION
                ============================================ */}
            <div className="miniapp-header">
              <div className="header-card">
                <div className="header-top-row">
                  <button
                    className="menu-icon-button"
                    onClick={handleOpenSettings}
                    aria-label="Open settings"
                    type="button"
                  >
                    <span className="menu-dot" />
                    <span className="menu-dot" />
                    <span className="menu-dot" />
                  </button>

                  <button
                    className={`leaderboard-icon-button ${
                      gameState.gameMode === "classic"
                        ? "classic-mode"
                        : "adventure-mode"
                    }`}
                    onClick={handleLeaderboardOpen}
                    aria-label="View leaderboard"
                    type="button"
                  >
                    {gameState.gameMode === "classic" ? (
                      <Trophy
                        size={20}
                        className="text-white"
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Zap size={20} className="text-white" strokeWidth={2.5} />
                    )}
                  </button>

                  <button
                    className={`wallet-icon-button ${
                      actualConnected ? "connected" : ""
                    }`}
                    onClick={handleWalletClickInternal}
                    aria-label={getWalletTitle()}
                    type="button"
                  >
                    <Wallet
                      size={20}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                    {!actualConnected && <div className="wallet-shine"></div>}
                  </button>
                </div>

                <div className="score-row">
                  <div className="score-card">
                    <div className="score-label">Score</div>
                    <div className="score-value">
                      {gameState.score.toLocaleString()}
                    </div>
                  </div>

                  {gameState.gameMode === "classic" ? (
                    <div className="score-card">
                      <div className="score-label">Best</div>
                      <div className="score-value">
                        {gameState.bestScore.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="score-card">
                        <div className="score-label">Target</div>
                        <div className="score-value">
                          {gameState.levelTarget.toLocaleString()}
                        </div>
                      </div>
                      <div className="score-card-mini">
                        <div className="score-label">Lv</div>
                        <div className="score-value">
                          {gameState.currentLevel}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ============================================
                GAME GRID AREA
                ============================================ */}
            <div className="miniapp-game-area">
              <div
                ref={ref}
                className="glass-effect glow-effect grid-container-locked"
              >
                <div className="game-grid">
                  {gameState.gameGrid.flat().map((cell, i) => {
                    const row = Math.floor(i / GRID_SIZE);
                    const col = i % GRID_SIZE;
                    const isHighlighted =
                      isCellHighlighted?.(row, col) ?? false;

                    let cellClass = `game-cell ${
                      cell ? `${cell} cell-filled` : ""
                    }`;

                    if (isHighlighted && hoverPosition) {
                      cellClass += hoverPosition.valid
                        ? " hover-preview-valid"
                        : " hover-preview-invalid";
                    }

                    return (
                      <div
                        key={`cell-${row}-${col}`}
                        className={cellClass}
                        data-row={row}
                        data-col={col}
                        data-snapped={
                          isHighlighted && hoverPosition?.valid
                            ? "true"
                            : "false"
                        }
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDragOver(e);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDrop(e, row, col);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCellHover?.(row, col);
                        }}
                        onDragLeave={(e) => {
                          const relatedTarget = e.relatedTarget as HTMLElement;
                          if (
                            !relatedTarget ||
                            !e.currentTarget.contains(relatedTarget)
                          ) {
                            onCellLeave?.();
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PIECES AREA */}
            <div className="miniapp-pieces-area">
              <div className="pieces-container">
                {gameState.currentPieces.map((piece, index) => {
                  const isDragging =
                    draggedPiece?.index === index ||
                    touchPiece?.index === index;

                  const cellSizeStr =
                    typeof window !== "undefined"
                      ? getComputedStyle(document.documentElement)
                          .getPropertyValue("--cell-size")
                          .trim()
                      : "42px";
                  const cellSize = parseFloat(cellSizeStr) || 42;
                  const { offsetX, offsetY } = calculatePieceEdgeOffset(
                    piece.template,
                    cellSize
                  );

                  const pieceHeight = piece.template.length;
                  const pieceWidth = piece.template[0]?.length || 1;
                  const cellCount = piece.template
                    .flat()
                    .filter((c) => c === 1).length;

                  let baseScale = 0.5;
                  let verticalAdjust = 0;

                  if (pieceHeight === 4 && pieceWidth === 1) {
                    baseScale = 0.47;
                    verticalAdjust = -8;
                  } else if (pieceWidth === 4 && pieceHeight === 1) {
                    baseScale = 0.47;
                    verticalAdjust = 0;
                  } else if (cellCount >= 9) {
                    baseScale = 0.43;
                    verticalAdjust = 0;
                  } else if (pieceHeight === 3 && pieceWidth === 3) {
                    baseScale = 0.43;
                    verticalAdjust = 0;
                  } else if (
                    (pieceHeight === 3 && pieceWidth === 2) ||
                    (pieceHeight === 2 && pieceWidth === 3)
                  ) {
                    baseScale = 0.49;
                    verticalAdjust = 0;
                  } else if (pieceHeight === 3 && pieceWidth === 1) {
                    baseScale = 0.51;
                    verticalAdjust = -4;
                  } else if (pieceWidth === 3 && pieceHeight === 1) {
                    baseScale = 0.51;
                    verticalAdjust = 0;
                  } else if (pieceHeight === 2 && pieceWidth === 2) {
                    baseScale = 0.53;
                    verticalAdjust = 0;
                  } else if (pieceHeight === 2 && pieceWidth === 1) {
                    baseScale = 0.55;
                    verticalAdjust = -2;
                  } else if (pieceWidth === 2 && pieceHeight === 1) {
                    baseScale = 0.55;
                    verticalAdjust = 0;
                  }

                  return (
                    <div key={index} className="piece-slot-wrapper">
                      <div
                        className={`game-piece ${piece.used ? "used" : ""}`}
                        style={{
                          gridTemplateColumns: `repeat(${pieceWidth}, var(--cell-size))`,
                          gridTemplateRows: `repeat(${pieceHeight}, var(--cell-size))`,
                          transform: `translate(${offsetX}px, ${
                            offsetY + verticalAdjust
                          }px) scale(${
                            piece.used ? baseScale * 0.7 : baseScale
                          })`,
                          transformOrigin: "center center",
                        }}
                        data-dragging={isDragging ? "true" : "false"}
                        onMouseDown={(e) =>
                          !piece.used && onTouchStart?.(e as any, index)
                        }
                        onTouchStart={(e) =>
                          !piece.used && onTouchStart?.(e, index)
                        }
                      >
                        {piece.template.flat().map((cell, cellIndex) => (
                          <div
                            key={cellIndex}
                            className={`piece-cell ${cell ? "active" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============================================
              WALLET INFO OVERLAY
              ============================================ */}
          {actualConnected && actualAddress && showWalletOverlay && (
            <div className="wallet-info-integrated">
              <div className="wallet-info-badge">
                <div className="wallet-info-header">
                  <div className="wallet-info-icon-wrapper">
                    <Wallet
                      size={16}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="wallet-info-label">Connected</div>
                  <div className="wallet-info-status-dot"></div>
                </div>
                <div className="wallet-info-address">
                  {actualAddress.slice(0, 6)}...{actualAddress.slice(-4)}
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              SETTINGS SIDEBAR
              ============================================ */}
          <div
            className={`settings-overlay ${settingsOpen ? "visible" : ""}`}
            onClick={handleCloseSettings}
          ></div>

          <div
            className={`settings-sidebar ${settingsOpen ? "open" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settings-sidebar-header">
              {farcasterUser ? (
                <div className="settings-sidebar-profile">
                  <img
                    src={farcasterUser.pfpUrl}
                    alt={farcasterUser.username}
                    className="settings-sidebar-avatar"
                  />
                  <div className="settings-sidebar-user-info">
                    <div className="settings-sidebar-display-name">
                      {farcasterUser.displayName}
                    </div>
                    <div className="settings-sidebar-username">
                      @{farcasterUser.username}
                    </div>
                    <div className="settings-sidebar-fid">
                      FID: {farcasterUser.fid}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="settings-sidebar-title">Settings</div>
              )}
              <button
                className="settings-close-button"
                onClick={handleCloseSettings}
                aria-label="Close settings"
                type="button"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Main Menu */}
            <div className="settings-menu-item" onClick={handleBackToMenu}>
              <div className="settings-menu-item-icon settings-icon-blue">
                <Home size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="settings-menu-item-content">
                <div className="settings-menu-item-title">Main Menu</div>
                <div className="settings-menu-item-description">
                  Back to home
                </div>
              </div>
            </div>

            {/* Restart Game */}
            <div className="settings-menu-item" onClick={handleRestart}>
              <div className="settings-menu-item-icon settings-icon-green">
                <RotateCcw size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="settings-menu-item-content">
                <div className="settings-menu-item-title">Restart Game</div>
                <div className="settings-menu-item-description">Start over</div>
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="settings-menu-item" onClick={handleToggleSound}>
              <div className="settings-menu-item-icon settings-icon-orange">
                {gameState.soundEnabled ? (
                  <Volume2 size={20} className="text-white" strokeWidth={2.5} />
                ) : (
                  <VolumeX size={20} className="text-white" strokeWidth={2.5} />
                )}
              </div>
              <div className="settings-menu-item-content">
                <div className="settings-menu-item-title">Sound</div>
                <div className="settings-menu-item-description">
                  {gameState.soundEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>

            {/* How to Earn (JANGAN DI HAPUS) */}
            {/* <div className="settings-menu-item" onClick={handleDocsOpen}>
              <div className="settings-menu-item-icon settings-icon-pink">
                <DollarSign
                  size={20}
                  className="text-white"
                  strokeWidth={2.5}
                />
              </div>
              <div className="settings-menu-item-content">
                <div className="settings-menu-item-title">How to Earn</div>
                <div className="settings-menu-item-description">
                  Learn earning system
                </div>
              </div>
            </div> */}

            {/* ============================================
                DAILY GM SECTION
                ============================================ */}
            <div className="settings-divider"></div>
            <div className="settings-section-header">Daily GM</div>

            <div className="settings-gm-card">
              <div className="gm-icon">☀️</div>
              <div className="gm-title">GM BASED!</div>

              {actualConnected ? (
                <>
                  <div className="gm-stats">
                    <div className="gm-stat">
                      <div className="gm-stat-label">Streak</div>
                      <div className="gm-stat-value">
                        {gmData.currentStreak} 🔥
                      </div>
                    </div>
                    <div className="gm-stat">
                      <div className="gm-stat-label">Best</div>
                      <div className="gm-stat-value">
                        {gmData.longestStreak} ⭐
                      </div>
                    </div>
                    <div className="gm-stat">
                      <div className="gm-stat-label">Total</div>
                      <div className="gm-stat-value">{gmData.totalGMs} 👋</div>
                    </div>
                  </div>

                  <button
                    onClick={handleSayGM}
                    disabled={!gmData.canGMToday || gmLoading}
                    className="w-full px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      minHeight: "48px",
                    }}
                  >
                    {gmLoading ? (
                      <div
                        style={{
                          display: "inline-block",
                          width: "20px",
                          height: "20px",
                          border: "3px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    ) : gmData.canGMToday ? (
                      <span>GM BASED!</span>
                    ) : (
                      <span>Already GM'd Today!</span>
                    )}
                  </button>

                  {!gmData.canGMToday && (
                    <div
                      className="text-xs text-center mt-2"
                      style={{ color: "rgba(255, 255, 255, 0.6)" }}
                    >
                      Come back tomorrow for your next GM!
                    </div>
                  )}

                  {gmData.currentStreak >= 7 && (
                    <div
                      className="text-xs text-center mt-2"
                      style={{
                        color: "#fbbf24",
                        fontWeight: "700",
                      }}
                    >
                      🔥 {gmData.currentStreak} day streak! You're on fire!
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="text-sm text-center py-4"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  Connect wallet to say GM!
                </div>
              )}
            </div>

            {/* ============================================
                REWARDS SECTION (Classic Mode Only)
                ============================================ */}
            {gameState.gameMode === "classic" && actualConnected && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-section-header">Rewards</div>

                <div className="settings-rewards-card">
                  {loadingClaim ? (
                    <div className="flex items-center justify-center py-4">
                      <div
                        style={{
                          display: "inline-block",
                          width: "24px",
                          height: "24px",
                          border: "3px solid rgba(255, 255, 255, 0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      ></div>
                    </div>
                  ) : claimableRewards?.canClaim ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <Gift size={24} className="text-green-400" />
                        <div>
                          <div className="text-sm font-bold text-white">
                            Reward Available
                          </div>
                          <div className="text-xs text-white/60">
                            Week {claimableRewards.week}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl font-black text-green-400 mb-3">
                        ${claimableRewards.amount} USDC
                      </div>
                      <button
                        onClick={handleClaimClick}
                        disabled={claiming}
                        className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {claiming ? "Claiming..." : "Claim Reward"}
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <Trophy
                        size={32}
                        className="text-white/30 mx-auto mb-2"
                      />
                      <div className="text-sm text-white/50">
                        {claimableRewards?.reason || "No rewards available"}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ============================================
                ADMIN TOOLS (Classic Mode Only)
                ============================================ */}
            {gameState.gameMode === "classic" && isAdmin && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-section-header">Admin Tools</div>

                <div
                  className="settings-menu-item admin-item"
                  onClick={async () => {
                    // ✅ Play sound
                    if (playSound) {
                      await playSound("button");
                    }

                    try {
                      const secret = prompt("Enter CRON_SECRET:");
                      if (!secret) return;

                      onCloseSettings();

                      const loadingDiv = document.createElement("div");
                      loadingDiv.className = "finalize-loading";
                      loadingDiv.innerHTML = `
                        <div class="finalize-loading-content">
                          <div style="display: inline-block; width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                          <div style="margin-top: 16px; font-size: 16px; font-weight: 700; color: white;">Checking week status...</div>
                          <div style="margin-top: 8px; font-size: 13px; color: rgba(255,255,255,0.7);">Please wait</div>
                        </div>
                      `;
                      document.body.appendChild(loadingDiv);

                      const rewardsResponse = await fetch("/api/rewards");
                      const rewardsData = await rewardsResponse.json();

                      if (!rewardsData.success) {
                        throw new Error("Failed to get week status");
                      }

                      const { canFinalize, timeRemainingFormatted } =
                        rewardsData.data;

                      if (!canFinalize) {
                        document.body.removeChild(loadingDiv);
                        alert(
                          `Week Not Ended Yet\n\n${timeRemainingFormatted}\n\nPlease wait until the week ends before finalizing.`
                        );
                        return;
                      }

                      const winnersResponse = await fetch(
                        "/api/finalize-week",
                        {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ secret }),
                        }
                      );

                      const winnersData = await winnersResponse.json();

                      if (!winnersData.success) {
                        throw new Error(winnersData.error);
                      }

                      if (!window.ethereum) {
                        throw new Error("No wallet detected");
                      }

                      const [account] = await window.ethereum.request({
                        method: "eth_requestAccounts",
                      });

                      const publicClient = createPublicClient({
                        chain: base,
                        transport: http(),
                      });

                      const walletClient = createWalletClient({
                        account: account as `0x${string}`,
                        chain: base,
                        transport: custom(window.ethereum),
                      });

                      loadingDiv.innerHTML = `
                        <div class="finalize-loading-content">
                          <div style="display: inline-block; width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                          <div style="margin-top: 16px; font-size: 16px; font-weight: 700; color: white;">Finalizing Week...</div>
                          <div style="margin-top: 8px; font-size: 13px; color: rgba(255,255,255,0.7);">Please confirm in wallet</div>
                        </div>
                      `;

                      await publicClient.estimateContractGas({
                        address: CONTRACTS.CLASSIC as `0x${string}`,
                        abi: ABIS.CLASSIC,
                        functionName: "finalizeWeek",
                        args: [
                          BigInt(winnersData.data.week),
                          winnersData.data.winners as readonly `0x${string}`[],
                        ],
                        account: account as `0x${string}`,
                      });

                      const hash = await walletClient.writeContract({
                        address: CONTRACTS.CLASSIC as `0x${string}`,
                        abi: ABIS.CLASSIC,
                        functionName: "finalizeWeek",
                        args: [
                          BigInt(winnersData.data.week),
                          winnersData.data.winners as readonly `0x${string}`[],
                        ],
                      });

                      const loadingElement =
                        document.querySelector(".finalize-loading");
                      if (loadingElement) {
                        loadingElement.classList.add("fade-out");
                        setTimeout(() => {
                          if (document.body.contains(loadingElement)) {
                            document.body.removeChild(loadingElement);
                          }
                        }, 200);
                      }

                      const winners = winnersData.data.topPlayers
                        .map(
                          (p: any) =>
                            `${p.rank}. ${p.username} - ${p.score} pts`
                        )
                        .join("\n");

                      alert(
                        `Week Finalized!\n\n${winners}\n\nTransaction: ${hash.slice(
                          0,
                          10
                        )}...${hash.slice(
                          -8
                        )}\n\nWinners can now claim rewards!`
                      );
                    } catch (error: any) {
                      const loadingDiv =
                        document.querySelector(".finalize-loading");
                      if (loadingDiv && document.body.contains(loadingDiv)) {
                        loadingDiv.classList.add("fade-out");
                        setTimeout(() => {
                          if (document.body.contains(loadingDiv)) {
                            document.body.removeChild(loadingDiv);
                          }
                        }, 200);
                      }

                      const errorMessage =
                        error.message || error.toString() || "Unknown error";

                      if (errorMessage.includes("Week not ended yet")) {
                        alert(
                          "Week Not Ended Yet\n\nThe current week is still active.\n\nPlease wait until the week ends (7 days) before finalizing."
                        );
                      } else if (
                        errorMessage.includes("Week already finalized")
                      ) {
                        alert(
                          "Week Already Finalized\n\nThis week has already been finalized.\n\nWinners can claim their rewards."
                        );
                      } else if (
                        errorMessage.toLowerCase().includes("user rejected") ||
                        errorMessage.toLowerCase().includes("user denied") ||
                        error.code === 4001
                      ) {
                        alert(
                          "Transaction cancelled by user.\n\nNo changes were made."
                        );
                      } else {
                        alert(
                          `Finalization Failed\n\n${errorMessage}\n\nPlease try again or contact support.`
                        );
                      }
                    }
                  }}
                >
                  <div className="settings-menu-item-icon settings-icon-gold">
                    <Crown size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="settings-menu-item-content">
                    <div className="settings-menu-item-title">
                      Finalize Week On-Chain
                    </div>
                    <div className="settings-menu-item-description">
                      Submit winners to contract
                    </div>
                  </div>
                </div>

                <div
                  className="settings-menu-item admin-item"
                  onClick={async () => {
                    // ✅ Play sound
                    if (playSound) {
                      await playSound("button");
                    }

                    window.open(
                      `https://basescan.org/address/${CONTRACTS.CLASSIC}#writeContract`,
                      "_blank"
                    );
                    onCloseSettings();
                  }}
                >
                  <div className="settings-menu-item-icon settings-icon-purple">
                    <ExternalLink
                      size={20}
                      className="text-white"
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="settings-menu-item-content">
                    <div className="settings-menu-item-title">
                      View Contract
                    </div>
                    <div className="settings-menu-item-description">
                      Open on Basescan
                    </div>
                  </div>
                </div>
              </>
            )}

         
            {/* {farcasterUser && (
              <>
                <div className="settings-divider"></div>
                <div className="settings-profile-card">
                  <div className="flex items-center gap-3">
                    <img
                      src={farcasterUser.pfpUrl}
                      alt={farcasterUser.username}
                      className="w-12 h-12 rounded-full border-2 border-white/20"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">
                        {farcasterUser.displayName}
                      </div>
                      <div className="text-xs text-white/60">
                        @{farcasterUser.username}
                      </div>
                      <div className="text-xs text-white/40">
                        FID: {farcasterUser.fid}
                      </div>
                    </div>
                    <User size={20} className="text-white/40" />
                  </div>
                </div>
              </>
            )} */}
          </div>

          {/* ============================================
              MODALS
              ============================================ */}
          {gameState.gameMode === "classic" ? (
            <LeaderboardClassic
              isOpen={leaderboardOpen}
              onClose={() => {
                if (playSound) {
                  playSound("button");
                }
                setLeaderboardOpen(false);
              }}
              currentUserFid={farcasterUser?.fid}
            />
          ) : (
            <LeaderboardAdventure
              isOpen={leaderboardOpen}
              onClose={() => {
                if (playSound) {
                  playSound("button");
                }
                setLeaderboardOpen(false);
              }}
              currentUserFid={farcasterUser?.fid}
            />
          )}

          <Docs
            isOpen={docsOpen}
            onClose={() => {
              if (playSound) {
                playSound("button");
              }
              setDocsOpen(false);
            }}
            mode={gameState.gameMode}
          />
        </div>
      );
    }
  )
);

GameBoard.displayName = "GameBoard";
