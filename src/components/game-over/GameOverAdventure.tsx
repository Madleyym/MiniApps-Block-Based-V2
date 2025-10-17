"use client";

import { useState, useEffect, useCallback } from "react";
import { useContinueAdventure } from "@/hooks/useContinueAdventure";

interface GameOverAdventureProps {
  isOpen: boolean;
  score: number;
  moves: number;
  continueCount: number;
  currentLevel: number;
  onContinue: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onShare: () => void;
}

export const GameOverAdventure: React.FC<GameOverAdventureProps> = ({
  isOpen,
  score,
  moves,
  continueCount,
  currentLevel,
  onContinue,
  onRestart,
  onMenu,
  onShare,
}) => {
  const { continueFree, isPaying, isSuccess, isConnected, txHash, resetState } =
    useContinueAdventure();

  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false);

  // ✅ OPTIMIZED: Success handler with proper timing
  useEffect(() => {
    if (isSuccess && !hasProcessedSuccess) {
      console.log("[GAME OVER ADVENTURE] Continue success, resuming...");
      setHasProcessedSuccess(true);

      setTimeout(() => {
        onContinue();

        setTimeout(() => {
          setHasProcessedSuccess(false);
          resetState();
        }, 500);
      }, 300);
    }
  }, [isSuccess, hasProcessedSuccess, onContinue, resetState]);

  // ✅ OPTIMIZED: Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setHasProcessedSuccess(false);
      resetState();
    }
  }, [isOpen, resetState]);

  const handleContinueClick = useCallback(async () => {
    console.log("[GAME OVER ADVENTURE] Starting continue flow...", {
      isConnected,
      isPaying,
      isSuccess,
    });

    const success = await continueFree();

    if (!success) {
      console.log("[GAME OVER ADVENTURE] Continue failed");
    }
  }, [continueFree, isConnected, isPaying, isSuccess]);

  if (!isOpen) return null;

  const isLoading = isPaying;

  const getButtonText = () => {
    if (isSuccess) return "Resuming...";
    if (isLoading) return "Processing...";
    if (!isConnected) return "Connecting...";
    return "Continue Free";
  };

  return (
    <div className="game-over-modal">
      <div className="game-over-modal-content">
        <h2>Game Over!</h2>
        <p>No valid moves available</p>

        {/* Stats */}
        <div className="game-over-stats">
          <div className="game-over-stat">
            <div className="game-over-stat-label">Final Score</div>
            <div className="game-over-stat-value">{score.toLocaleString()}</div>
          </div>

          <div className="game-over-stat">
            <div className="game-over-stat-label">Level</div>
            <div className="game-over-stat-value">{currentLevel}</div>
          </div>

          <div className="game-over-stat">
            <div className="game-over-stat-label">Moves</div>
            <div className="game-over-stat-value">{moves}</div>
          </div>

          <div className="game-over-stat" data-continue="true">
            <div className="game-over-stat-label">Continues</div>
            <div className="game-over-stat-value">{continueCount}</div>
          </div>
        </div>

        {/* Wallet Info Banner */}
        <div
          className="game-over-wallet-info"
          style={{
            background: isSuccess
              ? "rgba(16, 185, 129, 0.15)"
              : "rgba(16, 185, 129, 0.1)",
            border: `1px solid ${
              isSuccess ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)"
            }`,
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "white",
            }}
          >
            {isSuccess ? (
              <span style={{ color: "#10b981" }}>
                Continue successful! Game resuming...
              </span>
            ) : isLoading ? (
              <span style={{ color: "#f59e0b" }}>
                Confirm transaction in your wallet
              </span>
            ) : !isConnected ? (
              "Wallet connecting..."
            ) : (
              <>
                Continue: <strong>FREE</strong> (Gas fee ~$0.01)
              </>
            )}
          </div>
          {txHash && (
            <div
              style={{
                fontSize: "10px",
                marginTop: "6px",
                opacity: 0.7,
                color: "#10b981",
                wordBreak: "break-all",
              }}
            >
              TX: {txHash.slice(0, 10)}...{txHash.slice(-6)}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="game-over-buttons">
          <button
            className="game-over-button primary"
            onClick={handleContinueClick}
            disabled={isLoading || isSuccess || !isConnected}
            title="Continue playing for free (gas only)"
            style={{
              opacity: isSuccess || !isConnected ? 0.7 : 1,
              background: isSuccess
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #10b981, #059669)",
              cursor:
                isLoading || isSuccess || !isConnected
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "inline-block",
                  width: "18px",
                  height: "18px",
                  border: "3px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {isSuccess ? (
                    <>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </>
                  ) : (
                    <>
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </>
                  )}
                </svg>
                <span style={{ fontSize: "13px", fontWeight: "700" }}>
                  {getButtonText()}
                </span>
              </>
            )}
          </button>

          <button
            className="game-over-button secondary"
            onClick={onRestart}
            disabled={isLoading}
            title="Start a new game"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Restart</span>
          </button>

          <button
            className="game-over-button tertiary"
            onClick={onMenu}
            disabled={isLoading}
            title="Back to main menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Menu</span>
          </button>

          <button
            className="game-over-button share"
            onClick={onShare}
            disabled={isLoading}
            title="Share your score"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span style={{ fontSize: "13px", fontWeight: "700" }}>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
