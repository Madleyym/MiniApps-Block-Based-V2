"use client";

import {
  X,
  DollarSign,
  Trophy,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle,
  ExternalLink,
  Rocket,
  Gift,
  Users,
} from "lucide-react";
import { useState } from "react";

interface DocsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "classic" | "adventure";
}

export const Docs: React.FC<DocsProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
}) => {
  const [activeTab, setActiveTab] = useState<
    "basics" | "earning" | "technical" | "roadmap"
  >("basics");
  const [mode, setMode] = useState<"classic" | "adventure">(initialMode);

  if (!isOpen) return null;

  const CLASSIC_CONTRACT = "0x50280e0ae6157de214bd38298d25341f1fadb993";
  const ADVENTURE_CONTRACT = "0x53666b780ba487386fc53c78a7fd4af1089782ff";

  return (
    <div className="docs-overlay" onClick={onClose}>
      <div className="docs-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="docs-header">
          <div className="docs-header-title">
            <img
              src="/icon.png"
              alt="BlockBased"
              className="docs-header-icon"
            />
            <h2>BlockBased Documentation</h2>
          </div>
          <button className="docs-close-button" onClick={onClose}>
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="docs-mode-selector">
          <button
            className={`mode-button ${mode === "classic" ? "active" : ""}`}
            onClick={() => setMode("classic")}
          >
            Classic Mode
          </button>
          <button
            className={`mode-button ${mode === "adventure" ? "active" : ""}`}
            onClick={() => setMode("adventure")}
          >
            Adventure Mode
          </button>
        </div>

        {/* Tabs */}
        <div className="docs-tabs">
          <button
            className={`docs-tab ${activeTab === "basics" ? "active" : ""}`}
            onClick={() => setActiveTab("basics")}
          >
            Basics
          </button>
          <button
            className={`docs-tab ${activeTab === "earning" ? "active" : ""}`}
            onClick={() => setActiveTab("earning")}
          >
            Earning
          </button>
          <button
            className={`docs-tab ${activeTab === "technical" ? "active" : ""}`}
            onClick={() => setActiveTab("technical")}
          >
            Technical
          </button>
          <button
            className={`docs-tab ${activeTab === "roadmap" ? "active" : ""}`}
            onClick={() => setActiveTab("roadmap")}
          >
            Roadmap
          </button>
        </div>

        {/* Content */}
        <div className="docs-content">
          {activeTab === "basics" && (
            <div className="docs-section">
              <h3>Game Basics</h3>

              <div className="docs-card">
                <div
                  className="docs-card-icon"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  1
                </div>
                <div className="docs-card-content">
                  <h4>Place Pieces</h4>
                  <p>
                    Drag and drop pieces from the bottom onto the 8x8 grid.
                    Pieces can be rotated and placed anywhere with enough space.
                  </p>
                </div>
              </div>

              <div className="docs-card">
                <div
                  className="docs-card-icon"
                  style={{
                    background: "linear-gradient(135deg, #ec4899, #f43f5e)",
                  }}
                >
                  2
                </div>
                <div className="docs-card-content">
                  <h4>Clear Lines</h4>
                  <p>
                    Fill complete rows or columns to clear them. Clearing
                    multiple lines at once gives bonus points!
                  </p>
                </div>
              </div>

              <div className="docs-card">
                <div
                  className="docs-card-icon"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #f97316)",
                  }}
                >
                  3
                </div>
                <div className="docs-card-content">
                  <h4>Combo System</h4>
                  <p>
                    Chain multiple clears consecutively for massive combo
                    multipliers (up to 10x bonus!)
                  </p>
                </div>
              </div>

              <div className="docs-info-box">
                <Zap size={20} />
                <div>
                  <strong>Scoring System</strong>
                  <ul className="docs-bullet-list">
                    <li>10 pts per cell placed</li>
                    <li>10 pts per cell cleared</li>
                    <li>Combo multiplier: 2x, 3x, up to 10x</li>
                    <li>Strategic planning equals higher scores</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "earning" && (
            <div className="docs-section">
              {mode === "classic" ? (
                <>
                  <h3>Weekly Prize Pool System</h3>

                  <div className="docs-highlight-card">
                    <Trophy size={24} />
                    <div>
                      <h4>Top 10 Players Share 20% of Weekly Revenue</h4>
                      <p>
                        Every week, 20% of all continue payments go to the prize
                        pool and are distributed to the best players.
                      </p>
                    </div>
                  </div>

                  <h4>Prize Distribution</h4>
                  <div className="docs-prize-grid">
                    <div className="docs-prize-item rank-1">
                      <span className="prize-rank">1st</span>
                      <span className="prize-percent">30%</span>
                    </div>
                    <div className="docs-prize-item rank-2">
                      <span className="prize-rank">2nd</span>
                      <span className="prize-percent">20%</span>
                    </div>
                    <div className="docs-prize-item rank-3">
                      <span className="prize-rank">3rd</span>
                      <span className="prize-percent">15%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">4th</span>
                      <span className="prize-percent">10%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">5th</span>
                      <span className="prize-percent">8%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">6th</span>
                      <span className="prize-percent">6%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">7th</span>
                      <span className="prize-percent">4%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">8th</span>
                      <span className="prize-percent">3%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">9th</span>
                      <span className="prize-percent">2%</span>
                    </div>
                    <div className="docs-prize-item">
                      <span className="prize-rank">10th</span>
                      <span className="prize-percent">2%</span>
                    </div>
                  </div>

                  <h4>Revenue Model</h4>
                  <div className="docs-revenue-breakdown">
                    <div className="revenue-item">
                      <div
                        className="revenue-bar"
                        style={{ width: "20%", background: "#10b981" }}
                      >
                        20%
                      </div>
                      <span>Prize Pool - Top 10 Players</span>
                    </div>
                    <div className="revenue-item">
                      <div
                        className="revenue-bar"
                        style={{ width: "30%", background: "#6366f1" }}
                      >
                        30%
                      </div>
                      <span>Development - New Features</span>
                    </div>
                    <div className="revenue-item">
                      <div
                        className="revenue-bar"
                        style={{ width: "40%", background: "#8b5cf6" }}
                      >
                        40%
                      </div>
                      <span>Community Rewards</span>
                    </div>
                    <div className="revenue-item">
                      <div
                        className="revenue-bar"
                        style={{ width: "10%", background: "#f59e0b" }}
                      >
                        10%
                      </div>
                      <span>Marketing & Growth</span>
                    </div>
                  </div>

                  <h4>Requirements to Earn</h4>
                  <div className="docs-requirements">
                    <div className="requirement-item">
                      <CheckCircle size={16} />
                      <span>Connect wallet with USDC on Base</span>
                    </div>
                    <div className="requirement-item">
                      <CheckCircle size={16} />
                      <span>Finish in top 10 at week end</span>
                    </div>
                    <div className="requirement-item">
                      <CheckCircle size={16} />
                      <span>Have valid Farcaster account</span>
                    </div>
                    <div className="requirement-item">
                      <CheckCircle size={16} />
                      <span>Claim reward after finalization</span>
                    </div>
                  </div>

                  <h4>Maximize Your Earnings</h4>
                  <div className="docs-requirements">
                    <div className="requirement-item">
                      <TrendingUp size={16} />
                      <span>Play multiple sessions</span>
                    </div>
                    <div className="requirement-item">
                      <TrendingUp size={16} />
                      <span>Use continue strategically</span>
                    </div>
                    <div className="requirement-item">
                      <TrendingUp size={16} />
                      <span>Plan combo chains carefully</span>
                    </div>
                    <div className="requirement-item">
                      <TrendingUp size={16} />
                      <span>Check leaderboard regularly</span>
                    </div>
                  </div>

                  <div className="docs-example-box">
                    <DollarSign size={20} />
                    <div>
                      <strong>Example Week Scenario</strong>
                      <ul className="docs-bullet-list">
                        <li>Total Revenue: $100 USDC</li>
                        <li>Prize Pool: $20 USDC (20%)</li>
                        <li>1st Place: $6 USDC</li>
                        <li>2nd Place: $4 USDC</li>
                        <li>3rd Place: $3 USDC</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-warning-box">
                    <Gift size={18} />
                    <div>
                      <strong>Future Community Rewards</strong>
                      <p>40% of revenue for community rewards:</p>
                      <ul className="docs-bullet-list">
                        <li>Native token airdrops (TBA)</li>
                        <li>USDC rewards for active players</li>
                        <li>Special events and competitions</li>
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3>Adventure Mode - Free to Play</h3>

                  <div className="docs-highlight-card">
                    <Zap size={24} />
                    <div>
                      <h4>No Prizes, Pure Skill Challenge</h4>
                      <p>
                        Adventure mode is completely free - no USDC required.
                        Perfect for practicing and having fun!
                      </p>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Level Progression</h4>
                      <ul className="docs-bullet-list">
                        <li>Each level has a target score</li>
                        <li>Level 1: 500 pts, Level 2: 1000 pts</li>
                        <li>Reach target to advance</li>
                        <li>Grid becomes more challenging</li>
                        <li>Score resets, difficulty increases</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Free Continue System</h4>
                      <ul className="docs-bullet-list">
                        <li>Game over? Continue for FREE</li>
                        <li>Only gas fee (~$0.01 ETH)</li>
                        <li>No USDC payment needed</li>
                        <li>Clears most-blocking row/column</li>
                        <li>Unlimited continues per game</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-info-box">
                    <Trophy size={18} />
                    <div>
                      <strong>Compete on Leaderboard</strong>
                      <ul className="docs-bullet-list">
                        <li>See who reached highest level</li>
                        <li>Compare scores with friends</li>
                        <li>Track your progress over time</li>
                        <li>No prizes, just bragging rights</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-mission-card">
                    <img
                      src="/icon.png"
                      alt="BlockBased"
                      className="mission-icon"
                    />
                    <div>
                      <h4>Our Mission</h4>
                      <p>
                        Adventure mode normalizes on-chain gaming on Base. By
                        making it free, we encourage daily users to experience
                        blockchain gaming: transparency, ownership, and
                        verifiable achievements.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "technical" && (
            <div className="docs-section">
              <h3>Technical Details</h3>

              {mode === "classic" ? (
                <>
                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Smart Contract</h4>
                      <p>
                        <strong>Blockchain:</strong> Base (Ethereum L2)
                        <br />
                        <strong>Token:</strong> USDC (USD Coin)
                        <br />
                        <strong>Contract Address:</strong>
                      </p>
                      <code className="contract-code">{CLASSIC_CONTRACT}</code>
                      <button
                        onClick={() =>
                          window.open(
                            `https://basescan.org/address/${CLASSIC_CONTRACT}`,
                            "_blank"
                          )
                        }
                        className="docs-link-button"
                      >
                        <ExternalLink size={14} />
                        View on Basescan
                      </button>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Continue Pricing</h4>
                      <ul className="docs-bullet-list">
                        <li>
                          <strong>Tier 1 (1-4):</strong> $0.10 USDC
                        </li>
                        <li>
                          <strong>Tier 2 (5-9):</strong> $0.50 USDC
                        </li>
                        <li>
                          <strong>Tier 3 (10+):</strong> $1.00 USDC
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Weekly Cycle</h4>
                      <ul className="docs-bullet-list">
                        <li>
                          <strong>Week starts:</strong> Monday 00:00 UTC
                        </li>
                        <li>
                          <strong>Week ends:</strong> Sunday 23:59 UTC
                        </li>
                        <li>
                          <strong>Finalization:</strong> Automated
                        </li>
                        <li>
                          <strong>Prize claiming:</strong> Winners claim
                          directly
                        </li>
                        <li>
                          <strong>Leaderboard:</strong> Resets each week
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Security & Transparency</h4>
                      <ul className="docs-bullet-list">
                        <li>All payments on-chain (verifiable)</li>
                        <li>Prize pool in smart contract</li>
                        <li>Transparent winner selection</li>
                        <li>No custodial risk - claim anytime</li>
                        <li>Contract verified on Basescan</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-warning-box">
                    <Lock size={18} />
                    <div>
                      <strong>Gas Fees:</strong> All transactions require ETH
                      for gas (~$0.01 per transaction). Make sure you have ETH
                      in your wallet.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Smart Contract</h4>
                      <p>
                        <strong>Blockchain:</strong> Base (Ethereum L2)
                        <br />
                        <strong>Cost:</strong> Gas only (~$0.01 ETH)
                        <br />
                        <strong>Contract Address:</strong>
                      </p>
                      <code className="contract-code">
                        {ADVENTURE_CONTRACT}
                      </code>
                      <button
                        onClick={() =>
                          window.open(
                            `https://basescan.org/address/${ADVENTURE_CONTRACT}`,
                            "_blank"
                          )
                        }
                        className="docs-link-button"
                      >
                        <ExternalLink size={14} />
                        View on Basescan
                      </button>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Free Continue System</h4>
                      <p>The Adventure contract is ultra-simple:</p>
                      <code className="inline-code">
                        function recordContinue() external
                      </code>
                      <ul className="docs-bullet-list">
                        <li>No USDC payment required</li>
                        <li>Only gas fee (~$0.01 ETH)</li>
                        <li>Recorded on-chain permanently</li>
                        <li>Unlimited continues per player</li>
                        <li>Instant confirmation on Base</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-card">
                    <div className="docs-card-content">
                      <h4>Score & Continue Tracking</h4>
                      <p className="section-label">
                        <strong>On-Chain Data:</strong>
                      </p>
                      <ul className="docs-bullet-list">
                        <li>Continue count in smart contract</li>
                        <li>Every continue emits event</li>
                        <li>Transparent verifiable history</li>
                      </ul>
                      <p className="section-label">
                        <strong>Off-Chain Data:</strong>
                      </p>
                      <ul className="docs-bullet-list">
                        <li>Scores saved to database</li>
                        <li>Real-time leaderboard updates</li>
                        <li>Progress tracked by Farcaster FID</li>
                      </ul>
                    </div>
                  </div>

                  <div className="docs-info-box">
                    <Zap size={18} />
                    <div>
                      <strong>Daily On-Chain Activity</strong>
                      <p>
                        Adventure mode normalizes on-chain gaming on Base. Every
                        continue is a real blockchain transaction.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* BASE NETWORK CARD */}
              <div className="docs-base-network-card">
                <div className="base-network-card-header">
                  <img
                    src="/assets/base.png"
                    alt="Base Network"
                    className="base-network-card-image"
                  />
                  <div className="base-network-card-text">
                    <h4>Why Base Network?</h4>
                    <p>
                      BlockBased is built exclusively on Base, Coinbase's
                      Ethereum L2:
                    </p>
                  </div>
                </div>
                <ul className="docs-bullet-list base-network-card-bullets">
                  <li>
                    <strong>Ultra-low fees:</strong> ~$0.01 per transaction
                  </li>
                  <li>
                    <strong>Fast:</strong> 2-second block time
                  </li>
                  <li>
                    <strong>Secure:</strong> $ETH L2 with full EVM
                    compatibility
                  </li>
                  <li>
                    <strong>Growing:</strong> Perfect for Farcaster community
                  </li>
                  <li>
                    <strong>USDC native:</strong> Seamless payments
                  </li>
                </ul>
              </div>

              {/* FARCASTER CARD */}
              <div className="docs-base-network-card farcaster-variant">
                <div className="base-network-card-header">
                  <img
                    src="/assets/BlockBasedXf.png"
                    alt="Farcaster"
                    className="base-network-card-image"
                  />
                  <div className="base-network-card-text">
                    <h4>Built for Farcaster Community</h4>
                    <p>
                      BlockBased is natively integrated with Farcaster, the
                      decentralized social protocol. Your FID, username, and
                      avatar are used throughout the game for leaderboards and
                      social features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "roadmap" && (
            <div className="docs-section">
              <h3>Future Roadmap</h3>

              <div className="docs-highlight-card">
                <Rocket size={24} />
                <div>
                  <h4>Building the Future of BlockBased</h4>
                  <p>
                    We're committed to creating an engaging, rewarding gaming
                    experience on Base. Follow our journey!
                  </p>
                </div>
              </div>

              <h4>Community Rewards (40% Revenue)</h4>

              <div className="docs-card">
                <div className="docs-card-content">
                  <h4>Native Token Launch (TBA)</h4>
                  <p>We're planning to launch a native BlockBased token!</p>
                  <p className="section-label">
                    <strong>Potential Features:</strong>
                  </p>
                  <ul className="docs-bullet-list">
                    <li>Airdrop to active Classic players</li>
                    <li>Rewards based on transaction frequency</li>
                    <li>Governance rights for game features</li>
                    <li>Staking for bonus rewards</li>
                    <li>Special perks and benefits</li>
                  </ul>
                </div>
              </div>

              <div className="docs-card">
                <div className="docs-card-content">
                  <h4>USDC Reward Pool (Alternative)</h4>
                  <p>
                    If native token isn't launched, 40% distributed as USDC!
                  </p>
                  <p className="section-label">
                    <strong>Distribution Ideas:</strong>
                  </p>
                  <ul className="docs-bullet-list">
                    <li>Monthly airdrops to active players</li>
                    <li>Bonus rewards for high transactions</li>
                    <li>Special event prizes</li>
                    <li>Community-voted distributions</li>
                  </ul>
                </div>
              </div>

              <h4>Upcoming Features</h4>

              <div className="docs-requirements">
                <div className="requirement-item">
                  <Rocket size={16} />
                  <span>
                    <strong>New Game Modes:</strong> Time Attack, Battle Mode
                  </span>
                </div>
                <div className="requirement-item">
                  <Rocket size={16} />
                  <span>
                    <strong>NFT Integration:</strong> Collectible skins, badges
                  </span>
                </div>
                <div className="requirement-item">
                  <Rocket size={16} />
                  <span>
                    <strong>Social Features:</strong> Challenges, tournaments
                  </span>
                </div>
                <div className="requirement-item">
                  <Rocket size={16} />
                  <span>
                    <strong>Mobile App:</strong> Native iOS and Android
                  </span>
                </div>
                <div className="requirement-item">
                  <Rocket size={16} />
                  <span>
                    <strong>Cross-chain:</strong> Expand beyond Base
                  </span>
                </div>
              </div>

              {/* BASE ECOSYSTEM CARD */}
              <div className="docs-base-network-card">
                <div className="base-network-card-header">
                  <img
                    src="/assets/base.png"
                    alt="Base"
                    className="base-network-card-image"
                  />
                  <div className="base-network-card-text">
                    <h4>Supporting Base Ecosystem</h4>
                    <p>
                      BlockBased is built exclusively on Base to support the
                      growing ecosystem:
                    </p>
                  </div>
                </div>
                <ul className="docs-bullet-list base-network-card-bullets">
                  <li>Onboarding new users to Base network</li>
                  <li>Demonstrating real-world L2 gaming use cases</li>
                  <li>Building on Coinbase's infrastructure</li>
                  <li>Integrating with Farcaster community</li>
                  <li>Promoting daily on-chain activity</li>
                </ul>
              </div>

              <div className="docs-warning-box">
                <Gift size={18} />
                <div>
                  <strong>Important Note:</strong> All future plans and token
                  details are subject to change based on community feedback and
                  market conditions. Follow official channels for updates!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
