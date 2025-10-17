"use client";

import { MapPin, Infinity, Gamepad2, Trophy } from "lucide-react";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { LeaderboardClassic } from "./modals/LeaderboardClassic";

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

interface GameMenuProps {
  dailyVictories: number;
  onStartGame: (mode: "classic" | "adventure") => void;
  onMoreGames: (
    e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>
  ) => void;
  bestScore?: number;
  userFid?: number;
  playSound?: (type: SoundType) => Promise<void>;
  initAudio?: () => Promise<void>;
}

const GRADIENTS = [
  "linear-gradient(135deg, #60a5fa, #3b82f6)",
  "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  "linear-gradient(135deg, #f472b6, #ec4899)",
  "linear-gradient(135deg, #fb923c, #f97316)",
];

const AnimatedBlock = memo(
  ({ gradient, delay }: { gradient: string; delay: number }) => (
    <div
      style={{
        width: "clamp(14px, 4vw, 18px)",
        height: "clamp(14px, 4vw, 18px)",
        borderRadius: "clamp(3px, 0.8vw, 4px)",
        background: gradient,
        animation: "blockBounce 3s cubic-bezier(0.34, 1.56, 0.64, 1) infinite",
        animationDelay: `${delay}s`,
        boxShadow:
          "0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
        willChange: "transform, opacity",
        transform: "translate3d(0, 0, 0)",
        backfaceVisibility: "hidden" as const,
        position: "relative" as const,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "35%",
          background:
            "linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent)",
          borderRadius: "clamp(3px, 0.8vw, 4px) clamp(3px, 0.8vw, 4px) 0 0",
          pointerEvents: "none",
        }}
      />
    </div>
  )
);

AnimatedBlock.displayName = "AnimatedBlock";

const AnimatedLogo = memo(() => {
  const blocks = GRADIENTS.map((gradient, index) => ({
    gradient,
    delay: index * 0.15,
  }));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(8px, 2vw, 10px)",
        marginBottom: "clamp(12px, 3vw, 16px)",
      }}
    >
      {blocks.map((block, index) => (
        <AnimatedBlock
          key={index}
          gradient={block.gradient}
          delay={block.delay}
        />
      ))}
    </div>
  );
});

AnimatedLogo.displayName = "AnimatedLogo";

export const GameMenu: React.FC<GameMenuProps> = memo(
  ({
    dailyVictories,
    onStartGame,
    onMoreGames,
    bestScore = 0,
    userFid,
    playSound,
    initAudio,
  }) => {
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    const isReady = useRef<boolean>(false);
    const hasAutoOpened = useRef<boolean>(false);
    const initAttempted = useRef<boolean>(false); // ✅ ADDED: Prevent multiple init attempts

    // ✅ OPTIMIZED: Initialization guard
    useEffect(() => {
      console.log("[GAME MENU] Mounted");

      const timer = setTimeout(() => {
        isReady.current = true;
        console.log(
          "[GAME MENU] Click guard disabled - ready for user interaction"
        );
      }, 1000);

      return () => clearTimeout(timer);
    }, []);

    // ✅ FIXED: Initialize audio on mount with guard
    useEffect(() => {
      if (initAudio && !initAttempted.current) {
        initAttempted.current = true;
        console.log("[GAME MENU] 🔊 Initializing audio on mount...");

        const timer = setTimeout(() => {
          initAudio().catch((err) =>
            console.warn("[GAME MENU] Audio init failed:", err)
          );
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [initAudio]);

    // ✅ FIXED: Safe play sound helper
    const safePlaySound = useCallback(
      async (type: SoundType) => {
        if (playSound) {
          try {
            await playSound(type);
          } catch (error) {
            console.warn("[GAME MENU] Sound failed:", error);
          }
        }
      },
      [playSound]
    );

    // ✅ FIXED: Handle game start with sound
    const handleStartGame = useCallback(
      async (mode: "classic" | "adventure") => {
        console.log(`[GAME MENU] Starting ${mode} mode`);
        await safePlaySound("button");
        onStartGame(mode);
      },
      [onStartGame, safePlaySound]
    );

    // ✅ FIXED: Memoized leaderboard handler with sound
    const handleLeaderboardClick = useCallback(
      async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isReady.current) {
          console.log("[GAME MENU] ❌ Blocked: Component not ready yet");
          return;
        }

        if (hasAutoOpened.current) {
          console.log("[GAME MENU] ❌ Blocked: Already opened once");
          return;
        }

        await safePlaySound("button");

        console.log("[GAME MENU] ✅ User clicked leaderboard button");
        hasAutoOpened.current = true;
        setShowLeaderboard(true);
      },
      [safePlaySound]
    );

    // ✅ FIXED: Memoized close handler with sound
    const handleLeaderboardClose = useCallback(async () => {
      console.log("[GAME MENU] Leaderboard closed");
      await safePlaySound("button");
      setShowLeaderboard(false);

      setTimeout(() => {
        hasAutoOpened.current = false;
      }, 500);
    }, [safePlaySound]);

    // ✅ FIXED: Handle more games with sound
    const handleMoreGamesClick = useCallback(
      async (
        e:
          | React.MouseEvent<HTMLButtonElement>
          | React.TouchEvent<HTMLButtonElement>
      ) => {
        await safePlaySound("button");
        onMoreGames(e);
      },
      [onMoreGames, safePlaySound]
    );

    const letters = [
      { char: "B", color: "text-orange-400", delay: 0 },
      { char: "L", color: "text-cyan-300", delay: 0.15 },
      { char: "O", color: "text-red-400", delay: 0.3 },
      { char: "C", color: "text-yellow-300", delay: 0.45 },
      { char: "K", color: "text-purple-400", delay: 0.6 },
    ];

    return (
      <div className="min-h-screen game-background relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${
                  Math.random() * 3 + 3
                }s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-5 gap-6">
          <div
            className="absolute top-6 right-6 w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl border-3 border-white/80 cursor-pointer active:scale-95 transition-transform hover:scale-105"
            onClick={handleLeaderboardClick}
            style={{
              pointerEvents: isReady.current ? "auto" : "none",
            }}
          >
            <Trophy size={20} className="text-white" strokeWidth={2.5} />
            {dailyVictories > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {dailyVictories}
                </span>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="relative mb-2">
              <AnimatedLogo />
            </div>

            <h1 className="text-7xl font-black tracking-tight mb-2">
              {letters.map((letter, i) => (
                <span
                  key={i}
                  className={`inline-block ${letter.color}`}
                  style={{
                    textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  {letter.char}
                </span>
              ))}
            </h1>
            <div className="text-2xl font-bold text-cyan-300 tracking-[0.3em] drop-shadow-lg">
              BASED
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">
              Block Puzzle Game
            </div>
          </div>

          <div className="w-full max-w-sm">
            <div className="glass-effect glow-effect rounded-2xl p-5 border border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white/70 mb-1 uppercase tracking-wide">
                    Consecutive Daily Victories
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                      <Trophy size={24} className="text-white" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl text-white/60 font-bold">
                        ×
                      </span>
                      <span className="text-5xl font-black text-white drop-shadow-lg">
                        {dailyVictories}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              type="button"
              className="group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold cursor-pointer flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-2xl active:scale-98 border-2 border-orange-400/50"
              onClick={() => handleStartGame("adventure")}
            >
              <MapPin size={20} />
              <span className="tracking-wide">Adventure Mode</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>

            <button
              type="button"
              className="group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold cursor-pointer flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg hover:shadow-2xl active:scale-98 border-2 border-cyan-400/50"
              onClick={() => handleStartGame("classic")}
            >
              <Infinity size={20} />
              <span className="tracking-wide">Classic Mode</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>

            <button
              type="button"
              className="group relative overflow-hidden px-8 py-4 rounded-2xl text-xl font-bold cursor-pointer flex items-center justify-center gap-3 transition-all duration-300 bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-lg hover:shadow-2xl active:scale-98 border-2 border-teal-300/50"
              onClick={handleMoreGamesClick}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
            >
              <Gamepad2 size={20} />
              <span className="tracking-wide">More Games</span>
              <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </div>

          <div className="text-center mt-2">
            <div className="text-xs text-white/50 font-medium">
              Built for Base Mini Apps
            </div>
          </div>
        </div>

        <LeaderboardClassic
          isOpen={showLeaderboard}
          onClose={handleLeaderboardClose}
          currentUserFid={userFid}
        />

        <style jsx>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0) translateX(0);
              opacity: 0.3;
            }
            50% {
              transform: translateY(-20px) translateX(10px);
              opacity: 0.6;
            }
          }

          @keyframes blockBounce {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
              opacity: 1;
            }
            15% {
              transform: translate3d(0, -10px, 0) scale3d(1.15, 1.15, 1);
              opacity: 0.9;
            }
            30% {
              transform: translate3d(0, -18px, 0) scale3d(0.95, 0.95, 1);
              opacity: 1;
            }
            45% {
              transform: translate3d(0, -10px, 0) scale3d(1.08, 1.08, 1);
              opacity: 0.95;
            }
            60% {
              transform: translate3d(0, -5px, 0) scale3d(1, 1, 1);
              opacity: 1;
            }
            75% {
              transform: translate3d(0, -3px, 0) scale3d(1.05, 1.05, 1);
              opacity: 1;
            }
          }

          @keyframes titleBounce {
            0%,
            100% {
              transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            }
            15% {
              transform: translate3d(0, -12px, 0) scale3d(1.08, 1.08, 1);
            }
            30% {
              transform: translate3d(0, -20px, 0) scale3d(0.98, 0.98, 1);
            }
            45% {
              transform: translate3d(0, -12px, 0) scale3d(1.05, 1.05, 1);
            }
            60% {
              transform: translate3d(0, -6px, 0) scale3d(1, 1, 1);
            }
            75% {
              transform: translate3d(0, -3px, 0) scale3d(1.02, 1.02, 1);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
            }
          }

          .active\\:scale-98:active {
            transform: scale(0.98);
          }
        `}</style>
      </div>
    );
  }
);

GameMenu.displayName = "GameMenu";
