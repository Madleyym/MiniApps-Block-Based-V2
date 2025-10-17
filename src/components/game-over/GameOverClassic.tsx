"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePayContinue } from "@/hooks/usePayContinue";

interface GameOverClassicProps {
  isOpen: boolean;
  score: number;
  bestScore: number;
  moves: number;
  continueCount: number;
  isWalletConnected: boolean;
  walletAddress?: string;
  userFid?: number;
  onContinue: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onShare: () => void;
  onWalletClick: () => void;
}

export const GameOverClassic: React.FC<GameOverClassicProps> = ({
  isOpen,
  score,
  bestScore,
  moves,
  continueCount,
  isWalletConnected,
  walletAddress,
  userFid,
  onContinue,
  onRestart,
  onMenu,
  onShare,
  onWalletClick,
}) => {
  const {
    startPayment,
    isPaying,
    isSuccess,
    formattedCost,
    currentStep,
    resetState,
  } = usePayContinue(continueCount);

  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false);

  const onContinueRef = useRef(onContinue);
  const resetStateRef = useRef(resetState);

  // ✅ OPTIMIZED: Update refs without re-render
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    resetStateRef.current = resetState;
  }, [resetState]);

  // ✅ OPTIMIZED: Success handler with proper timing
  useEffect(() => {
    if (isSuccess && !hasProcessedSuccess) {
      console.log("[GAME OVER CLASSIC] Payment complete, continuing game...");
      setHasProcessedSuccess(true);

      setTimeout(() => {
        onContinueRef.current();

        setTimeout(() => {
          console.log("[GAME OVER CLASSIC] Resetting payment states...");
          setHasProcessedSuccess(false);
          resetStateRef.current();
        }, 500);
      }, 300);
    }
  }, [isSuccess, hasProcessedSuccess]);

  // ✅ OPTIMIZED: Cleanup on close
  useEffect(() => {
    if (!isOpen && hasProcessedSuccess) {
      console.log("[GAME OVER CLASSIC] Modal closed, resetting states...");
      setHasProcessedSuccess(false);
      resetStateRef.current();
    }
  }, [isOpen, hasProcessedSuccess]);

  const handleContinueClick = useCallback(async () => {
    console.log("[GAME OVER CLASSIC] Continue button clicked");
    await startPayment();
  }, [startPayment]);

  if (!isOpen) return null;

  const getPriceTier = () => {
    if (continueCount >= 9) return { label: "MAX", class: "high" };
    if (continueCount >= 5) return { label: "HIGH", class: "medium" };
    return { label: "LOW", class: "low" };
  };

  const priceTier = getPriceTier();

  const getButtonText = () => {
    if (isSuccess) return "Resuming...";
    if (currentStep === "approving") return "Approving USDC...";
    if (currentStep === "approved") return "Paying...";
    if (currentStep === "paying") return "Processing...";
    return `Pay ${formattedCost} USDC`;
  };

  const isLoading = isPaying || isSuccess;

  return (
    <div className="game-over-modal">
      <div className="game-over-modal-content">
        <h2>Game Over!</h2>
        <p>No valid moves available</p>

        <div className="game-over-stats">
          <div className="game-over-stat">
            <div className="game-over-stat-label">Final Score</div>
            <div className="game-over-stat-value">{score.toLocaleString()}</div>
          </div>

          <div className="game-over-stat">
            <div className="game-over-stat-label">Best Score</div>
            <div className="game-over-stat-value">
              {bestScore.toLocaleString()}
            </div>
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

        <div
          className="game-over-wallet-info"
          data-price-warning={continueCount >= 7 ? "true" : "false"}
          style={{
            background: isSuccess
              ? "rgba(16, 185, 129, 0.15)"
              : "rgba(99, 102, 241, 0.1)",
            border: `1px solid ${
              isSuccess ? "rgba(16, 185, 129, 0.3)" : "rgba(99, 102, 241, 0.3)"
            }`,
          }}
        >
          {isWalletConnected ? (
            <>
              <div className="wallet-status-badge wallet-connected">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
              <div
                style={{ marginTop: "8px", fontSize: "13px", color: "white" }}
              >
                {isSuccess ? (
                  <span style={{ color: "#10b981", fontWeight: "700" }}>
                    Payment successful! Game resuming...
                  </span>
                ) : currentStep === "approving" ? (
                  <span style={{ color: "#f59e0b", fontWeight: "600" }}>
                    Step 1/2: Approving {formattedCost} USDC...
                  </span>
                ) : currentStep === "approved" || currentStep === "paying" ? (
                  <span style={{ color: "#10b981", fontWeight: "600" }}>
                    Step 2/2: Processing payment...
                  </span>
                ) : (
                  <>
                    Continue #{continueCount + 1}:{" "}
                    <strong>{formattedCost} USDC</strong>
                    <span className={`price-tier ${priceTier.class}`}>
                      {priceTier.label}
                    </span>
                  </>
                )}
              </div>
              {!isPaying && !isSuccess && (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    opacity: 0.8,
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Approval needed, then auto-pay
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{ fontSize: "13px", fontWeight: "600", color: "white" }}
              >
                Continue: {formattedCost} USDC
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "11px",
                  opacity: 0.8,
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Wallet will connect automatically
              </div>
            </>
          )}
        </div>

        <div className="game-over-buttons">
          <button
            className="game-over-button primary"
            onClick={handleContinueClick}
            disabled={isLoading}
            title={`Continue playing for ${formattedCost} USDC`}
            style={{
              opacity: isLoading ? 0.7 : 1,
              background: isSuccess
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #6366f1, #4f46e5)",
              cursor: isLoading ? "not-allowed" : "pointer",
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
