"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { X, Trophy, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LeaderboardAdventureProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserFid?: number;
}

interface AdventureScore {
  id: number;
  fid: number;
  username: string;
  pfp_url?: string;
  score: number;
  level: number;
  continue_count: number;
  created_at: string;
}

const GRADIENTS = [
  "linear-gradient(135deg, #60a5fa, #3b82f6)",
  "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  "linear-gradient(135deg, #f472b6, #ec4899)",
  "linear-gradient(135deg, #fb923c, #f97316)",
];

// ✅ OPTIMIZED: Memoized loading component
const LoadingBlock = memo(
  ({ gradient, delay }: { gradient: string; delay: number }) => (
    <div
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "4px",
        background: gradient,
        animation: "blockBounce 3s cubic-bezier(0.34, 1.56, 0.64, 1) infinite",
        animationDelay: `${delay}s`,
        boxShadow:
          "0 2px 6px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.35)",
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
            "linear-gradient(to bottom, rgba(255, 255, 255, 0.35), transparent)",
          borderRadius: "4px 4px 0 0",
          pointerEvents: "none",
        }}
      />
    </div>
  )
);

LoadingBlock.displayName = "LoadingBlock";

const LoadingAnimation = memo(() => {
  const blocks = GRADIENTS.map((gradient, index) => ({
    gradient,
    delay: index * 0.15,
  }));

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "12px",
        }}
      >
        {blocks.map((block, index) => (
          <LoadingBlock
            key={index}
            gradient={block.gradient}
            delay={block.delay}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes blockBounce {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
            opacity: 1;
          }
          15% {
            transform: translate3d(0, -20px, 0) scale3d(1.1, 1.1, 1);
            opacity: 0.9;
          }
          30% {
            transform: translate3d(0, -35px, 0) scale3d(0.95, 0.95, 1);
            opacity: 1;
          }
          45% {
            transform: translate3d(0, -20px, 0) scale3d(1.05, 1.05, 1);
            opacity: 0.95;
          }
          60% {
            transform: translate3d(0, -10px, 0) scale3d(1, 1, 1);
            opacity: 1;
          }
          75% {
            transform: translate3d(0, -5px, 0) scale3d(1.02, 1.02, 1);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </>
  );
});

LoadingAnimation.displayName = "LoadingAnimation";

export const LeaderboardAdventure: React.FC<LeaderboardAdventureProps> = memo(
  ({ isOpen, onClose, currentUserFid }) => {
    const [scores, setScores] = useState<AdventureScore[]>([]);
    const [loading, setLoading] = useState(false);

    // ✅ OPTIMIZED: Memoized load function
    const loadScores = useCallback(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("adventure_scores")
          .select("*")
          .order("score", { ascending: false })
          .limit(50);

        if (error) throw error;

        console.log(
          `[LEADERBOARD ADVENTURE] Loaded ${data?.length || 0} entries`
        );
        setScores(data || []);
      } catch (error) {
        console.error("[LEADERBOARD ADVENTURE] Failed to load scores:", error);
      } finally {
        setLoading(false);
      }
    }, []);

    // ✅ OPTIMIZED: Only fetch when modal opens
    useEffect(() => {
      if (isOpen) {
        loadScores();
      }
    }, [isOpen, loadScores]);

    // ✅ OPTIMIZED: Memoized rank number
    const getRankNumber = useCallback((rank: number) => {
      return `#${rank}`;
    }, []);

    if (!isOpen) return null;

    return (
      <>
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            zIndex: 5000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e3c72",
              borderRadius: "20px",
              width: "90%",
              maxWidth: "420px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overscrollBehavior: "contain" /* ✅ ADDED FOR SCROLL FIX */,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
                flexShrink: 0,
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <Zap size={24} className="text-yellow-400" strokeWidth={2.5} />
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "white",
                    margin: 0,
                  }}
                >
                  Adventure
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            <div
              style={{
                padding: "12px 20px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.9)",
                background: "rgba(0, 0, 0, 0.2)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                flexShrink: 0,
              }}
            >
              Just for fun - No rewards!
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                minHeight: 0,
                WebkitOverflowScrolling:
                  "touch" /* ✅ ADDED FOR IOS MOMENTUM */,
                overscrollBehavior: "contain" /* ✅ ADDED FOR SCROLL FIX */,
              }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "300px",
                  }}
                >
                  <LoadingAnimation />
                </div>
              ) : scores.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "300px",
                    color: "white",
                    textAlign: "center",
                    gap: "8px",
                  }}
                >
                  <Trophy size={48} style={{ opacity: 0.2 }} />
                  <div>No scores yet</div>
                  <div style={{ fontSize: "12px", opacity: 0.6 }}>
                    Be the first to play!
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {scores.map((entry, index) => {
                    const rank = index + 1;
                    const isCurrentUser = entry.fid === currentUserFid;

                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          background: isCurrentUser
                            ? "rgba(251, 191, 36, 0.15)"
                            : "rgba(255, 255, 255, 0.08)",
                          padding: "12px",
                          borderRadius: "12px",
                          border: isCurrentUser
                            ? "2px solid #fbbf24"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: 900,
                              color: "white",
                            }}
                          >
                            {getRankNumber(rank)}
                          </span>
                        </div>

                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            border: "2px solid rgba(255, 255, 255, 0.15)",
                            flexShrink: 0,
                          }}
                        >
                          {entry.pfp_url ? (
                            <img
                              src={entry.pfp_url}
                              alt={entry.username}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "#3b82f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "18px",
                                fontWeight: 700,
                              }}
                            >
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              marginBottom: "2px",
                            }}
                          >
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {entry.username}
                            </span>
                            {isCurrentUser && (
                              <span
                                style={{
                                  padding: "2px 6px",
                                  background: "rgba(251, 191, 36, 0.3)",
                                  border: "1px solid rgba(251, 191, 36, 0.5)",
                                  borderRadius: "4px",
                                  fontSize: "9px",
                                  fontWeight: 900,
                                  color: "#fbbf24",
                                  flexShrink: 0,
                                }}
                              >
                                YOU
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "13px",
                              color: "rgba(255, 255, 255, 0.7)",
                              fontWeight: 500,
                            }}
                          >
                            <span>{entry.score.toLocaleString()} pts</span>
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "rgba(139, 92, 246, 0.2)",
                                border: "1px solid rgba(139, 92, 246, 0.4)",
                                borderRadius: "6px",
                                fontSize: "10px",
                                fontWeight: 700,
                                color: "#a78bfa",
                                flexShrink: 0,
                              }}
                            >
                              Lv {entry.level}
                            </span>
                            {entry.continue_count > 0 && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  background:
                                    entry.continue_count >= 10
                                      ? "rgba(139, 92, 246, 0.25)"
                                      : entry.continue_count >= 5
                                      ? "rgba(245, 158, 11, 0.25)"
                                      : "rgba(16, 185, 129, 0.2)",
                                  border:
                                    entry.continue_count >= 10
                                      ? "1px solid rgba(139, 92, 246, 0.5)"
                                      : entry.continue_count >= 5
                                      ? "1px solid rgba(245, 158, 11, 0.5)"
                                      : "1px solid rgba(16, 185, 129, 0.4)",
                                  borderRadius: "6px",
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color:
                                    entry.continue_count >= 10
                                      ? "#a78bfa"
                                      : entry.continue_count >= 5
                                      ? "#fbbf24"
                                      : "#10b981",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                {entry.continue_count >= 10
                                  ? "🏆"
                                  : entry.continue_count >= 5
                                  ? "⭐"
                                  : "⛓️"}
                                {entry.continue_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }
);

LeaderboardAdventure.displayName = "LeaderboardAdventure";
