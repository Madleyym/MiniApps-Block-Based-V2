"use client";

import { X, Trophy, Medal, Award, Crown, Gift, DollarSign } from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";
import "@/styles/classic-leaderboard.css";

interface LeaderboardEntry {
  fid: number;
  username: string;
  pfpUrl?: string;
  score: number;
  rank: number;
  rewardAmount?: string;
  percentage?: string;
}

interface WeeklyRewards {
  weekStart: string;
  weekEnd: string;
  totalRevenue: string;
  prizePool: string;
  developerShare: string;
  marketingShare: string;
  topPlayers: LeaderboardEntry[];
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserScore?: number;
  currentUserFid?: number;
}

const GRADIENTS = [
  "linear-gradient(135deg, #60a5fa, #3b82f6)",
  "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  "linear-gradient(135deg, #f472b6, #ec4899)",
  "linear-gradient(135deg, #fb923c, #f97316)",
];

// ✅ Helper function for dummy rewards
const getDummyRewards = (): WeeklyRewards => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    totalRevenue: "487.50",
    prizePool: "97.50",
    developerShare: "292.50",
    marketingShare: "97.50",
    topPlayers: [
      {
        fid: 0,
        username: "",
        score: 0,
        rank: 1,
        rewardAmount: "48.75",
        percentage: "50%",
      },
      {
        fid: 0,
        username: "",
        score: 0,
        rank: 2,
        rewardAmount: "29.25",
        percentage: "30%",
      },
      {
        fid: 0,
        username: "",
        score: 0,
        rank: 3,
        rewardAmount: "19.50",
        percentage: "20%",
      },
    ],
  };
};

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

export const LeaderboardClassic: React.FC<LeaderboardProps> = memo(
  ({ isOpen, onClose, currentUserScore = 0, currentUserFid }) => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
      []
    );
    const [weeklyRewards, setWeeklyRewards] = useState<WeeklyRewards | null>(
      null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showRewards, setShowRewards] = useState(true);

    // ✅ OPTIMIZED: Memoized fetch functions
    const fetchLeaderboard = useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const timestamp = Date.now();
        const response = await fetch(
          `/api/leaderboard?limit=50&t=${timestamp}`,
          {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          }
        );

        const result = await response.json();

        if (result.success) {
          console.log(
            `[LEADERBOARD CLASSIC] Loaded ${result.data.length} entries`
          );
          setLeaderboardData(result.data);
        } else {
          setError(result.error || "Failed to load leaderboard");
        }
      } catch (err) {
        console.error("[LEADERBOARD CLASSIC] Failed to fetch:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }, []);

    const fetchWeeklyRewards = useCallback(async () => {
      try {
        const timestamp = Date.now();
        const response = await fetch(`/api/rewards?t=${timestamp}`);
        const result = await response.json();

        if (result.success && parseFloat(result.data.prizePool) > 0) {
          setWeeklyRewards(result.data);
        } else {
          // ✅ Use dummy data if API returns $0.00 or fails
          console.log("[LEADERBOARD] Using dummy reward data");
          const dummyData = getDummyRewards();
          setWeeklyRewards(dummyData);
        }
      } catch (err) {
        console.error("[LEADERBOARD CLASSIC] Failed to fetch rewards:", err);
        // ✅ Use dummy data on error
        const dummyData = getDummyRewards();
        setWeeklyRewards(dummyData);
      }
    }, []);

    // ✅ OPTIMIZED: Only fetch when modal opens
    useEffect(() => {
      if (isOpen) {
        fetchLeaderboard();
        fetchWeeklyRewards();
      }
    }, [isOpen, fetchLeaderboard, fetchWeeklyRewards]);

    // ✅ OPTIMIZED: Enhanced rank icons with better visibility
    const getRankIcon = useCallback((rank: number) => {
      switch (rank) {
        case 1:
          return (
            <Crown
              size={26}
              className="text-white"
              strokeWidth={3}
              fill="#fbbf24"
            />
          );
        case 2:
          return (
            <Medal
              size={26}
              className="text-white"
              strokeWidth={3}
              fill="#e5e7eb"
            />
          );
        case 3:
          return (
            <Award
              size={26}
              className="text-white"
              strokeWidth={3}
              fill="#d97706"
            />
          );
        default:
          return (
            <span className="text-white/80 font-black text-lg">#{rank}</span>
          );
      }
    }, []);

    const getRankBadgeColor = useCallback((rank: number) => {
      switch (rank) {
        case 1:
          return "rank-1";
        case 2:
          return "rank-2";
        case 3:
          return "rank-3";
        default:
          return "from-blue-500 to-blue-600";
      }
    }, []);

    const formatDate = useCallback((dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }, []);

    if (!isOpen) return null;

    return (
      <div className="leaderboard-overlay" onClick={onClose}>
        <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
          <div className="leaderboard-header">
            <div className="leaderboard-title-section">
              <Trophy size={28} className="text-yellow-400" />
              <h2 className="leaderboard-title">Leaderboard</h2>
            </div>
            <button className="leaderboard-close-button" onClick={onClose}>
              <X size={22} strokeWidth={2.5} />
            </button>
          </div>

          {weeklyRewards && showRewards && (
            <div className="rewards-banner">
              <div className="rewards-banner-header">
                <Gift size={20} className="text-green-400" />
                <span className="rewards-banner-title">Weekly Prize Pool</span>
                <button
                  className="rewards-banner-close"
                  onClick={() => setShowRewards(false)}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="rewards-banner-pool">
                <DollarSign size={28} className="text-green-400" />
                <span className="rewards-banner-amount">
                  {weeklyRewards.prizePool} USDC
                </span>
              </div>
              <div className="rewards-banner-dates">
                {formatDate(weeklyRewards.weekStart)} -{" "}
                {formatDate(weeklyRewards.weekEnd)}
              </div>
              <div className="rewards-banner-breakdown">
                <div className="rewards-stat">
                  <span className="rewards-stat-label">Total Revenue</span>
                  <span className="rewards-stat-value">
                    ${weeklyRewards.totalRevenue}
                  </span>
                </div>
                <div className="rewards-stat">
                  <span className="rewards-stat-label">Prizes (20%)</span>
                  <span className="rewards-stat-value">
                    ${weeklyRewards.prizePool}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="leaderboard-content">
            {loading ? (
              <div className="leaderboard-loading">
                <LoadingAnimation />
              </div>
            ) : error ? (
              <div className="leaderboard-loading">
                <p className="text-red-400 text-center">{error}</p>
                <button
                  onClick={fetchLeaderboard}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="leaderboard-loading">
                <Trophy size={48} className="text-white/30 mb-4" />
                <p className="text-white/50 text-center">
                  No scores yet. Be the first!
                </p>
              </div>
            ) : (
              <>
                {leaderboardData.length >= 3 ? (
                  <div className="podium-section">
                    {/* 2nd Place */}
                    <div
                      className={`podium-card ${
                        leaderboardData[1].fid === currentUserFid
                          ? "podium-current-user"
                          : ""
                      }`}
                    >
                      <div
                        className={`podium-rank-badge ${getRankBadgeColor(2)}`}
                      >
                        {getRankIcon(2)}
                      </div>
                      <div className="podium-avatar">
                        {leaderboardData[1].pfpUrl ? (
                          <img
                            src={leaderboardData[1].pfpUrl}
                            alt={leaderboardData[1].username}
                          />
                        ) : (
                          <div className="podium-avatar-placeholder">
                            {leaderboardData[1].username
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="podium-username">
                        {leaderboardData[1].username}
                      </div>
                      <div className="podium-score">
                        {leaderboardData[1].score.toLocaleString()}
                      </div>
                      {weeklyRewards?.topPlayers[1]?.rewardAmount && (
                        <div className="podium-reward">
                          <DollarSign size={14} />
                          <span>
                            {weeklyRewards.topPlayers[1].rewardAmount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 1st Place */}
                    <div
                      className={`podium-card podium-first ${
                        leaderboardData[0].fid === currentUserFid
                          ? "podium-current-user"
                          : ""
                      }`}
                    >
                      <div
                        className={`podium-rank-badge ${getRankBadgeColor(1)}`}
                      >
                        {getRankIcon(1)}
                      </div>
                      <div className="podium-avatar">
                        {leaderboardData[0].pfpUrl ? (
                          <img
                            src={leaderboardData[0].pfpUrl}
                            alt={leaderboardData[0].username}
                          />
                        ) : (
                          <div className="podium-avatar-placeholder">
                            {leaderboardData[0].username
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="podium-username">
                        {leaderboardData[0].username}
                      </div>
                      <div className="podium-score">
                        {leaderboardData[0].score.toLocaleString()}
                      </div>
                      {weeklyRewards?.topPlayers[0]?.rewardAmount && (
                        <div className="podium-reward">
                          <DollarSign size={14} />
                          <span>
                            {weeklyRewards.topPlayers[0].rewardAmount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 3rd Place */}
                    <div
                      className={`podium-card ${
                        leaderboardData[2].fid === currentUserFid
                          ? "podium-current-user"
                          : ""
                      }`}
                    >
                      <div
                        className={`podium-rank-badge ${getRankBadgeColor(3)}`}
                      >
                        {getRankIcon(3)}
                      </div>
                      <div className="podium-avatar">
                        {leaderboardData[2].pfpUrl ? (
                          <img
                            src={leaderboardData[2].pfpUrl}
                            alt={leaderboardData[2].username}
                          />
                        ) : (
                          <div className="podium-avatar-placeholder">
                            {leaderboardData[2].username
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="podium-username">
                        {leaderboardData[2].username}
                      </div>
                      <div className="podium-score">
                        {leaderboardData[2].score.toLocaleString()}
                      </div>
                      {weeklyRewards?.topPlayers[2]?.rewardAmount && (
                        <div className="podium-reward">
                          <DollarSign size={14} />
                          <span>
                            {weeklyRewards.topPlayers[2].rewardAmount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="leaderboard-list">
                    {leaderboardData.map((entry) => {
                      const reward = weeklyRewards?.topPlayers.find(
                        (p) => p.fid === entry.fid
                      );

                      return (
                        <div
                          key={entry.fid}
                          className={`leaderboard-item ${
                            entry.fid === currentUserFid
                              ? "leaderboard-item-current-user"
                              : ""
                          }`}
                        >
                          <div className="leaderboard-item-rank">
                            {getRankIcon(entry.rank)}
                          </div>
                          <div className="leaderboard-item-avatar">
                            {entry.pfpUrl ? (
                              <img src={entry.pfpUrl} alt={entry.username} />
                            ) : (
                              <div className="leaderboard-item-avatar-placeholder">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="leaderboard-item-info">
                            <div className="leaderboard-item-username">
                              {entry.username}
                            </div>
                            <div className="leaderboard-item-score">
                              {entry.score.toLocaleString()} pts
                            </div>
                          </div>
                          {reward && (
                            <div className="leaderboard-item-reward">
                              <DollarSign
                                size={12}
                                className="text-green-400"
                              />
                              <span>{reward.rewardAmount}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {leaderboardData.length > 3 && (
                  <div className="leaderboard-list">
                    {leaderboardData.slice(3).map((entry) => {
                      const reward = weeklyRewards?.topPlayers.find(
                        (p) => p.fid === entry.fid
                      );

                      return (
                        <div
                          key={entry.fid}
                          className={`leaderboard-item ${
                            entry.fid === currentUserFid
                              ? "leaderboard-item-current-user"
                              : ""
                          }`}
                        >
                          <div className="leaderboard-item-rank">
                            {getRankIcon(entry.rank)}
                          </div>
                          <div className="leaderboard-item-avatar">
                            {entry.pfpUrl ? (
                              <img src={entry.pfpUrl} alt={entry.username} />
                            ) : (
                              <div className="leaderboard-item-avatar-placeholder">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="leaderboard-item-info">
                            <div className="leaderboard-item-username">
                              {entry.username}
                            </div>
                            <div className="leaderboard-item-score">
                              {entry.score.toLocaleString()} pts
                            </div>
                          </div>
                          {reward && (
                            <div className="leaderboard-item-reward">
                              <DollarSign
                                size={12}
                                className="text-green-400"
                              />
                              <span>{reward.rewardAmount}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentUserScore > 0 && (
                  <div className="leaderboard-user-score">
                    <Trophy size={18} className="text-yellow-400" />
                    <span>
                      Your Best: {currentUserScore.toLocaleString()} pts
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);

LeaderboardClassic.displayName = "LeaderboardClassic";
