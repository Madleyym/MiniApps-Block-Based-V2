"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi.config";
import { useEffect, useState, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MINIMUM_LOADING_TIME = 3000;
const FADE_DURATION = 400;

const GRADIENTS = [
  "linear-gradient(135deg, #60a5fa, #3b82f6)",
  "linear-gradient(135deg, #a78bfa, #8b5cf6)",
  "linear-gradient(135deg, #f472b6, #ec4899)",
  "linear-gradient(135deg, #fb923c, #f97316)",
];

const LoadingBlock = ({
  gradient,
  delay,
}: {
  gradient: string;
  delay: number;
}) => (
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
);

const LoadingAnimation = () => {
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
};

const LoadingScreen = ({ isVisible }: { isVisible: boolean }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
      opacity: isVisible ? 1 : 0,
      transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      pointerEvents: isVisible ? "auto" : "none",
      zIndex: 10000,
    }}
  >
    <LoadingAnimation />
  </div>
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isMinimumTimePassed, setIsMinimumTimePassed] = useState(false);
  const [showContent, setShowContent] = useState(false);

  const handleAccountsChanged = useCallback(
    (accounts: readonly `0x${string}`[]) => {
      if (accounts.length > 0) {
        console.log("[WALLET] Account changed:", accounts[0]);
      }
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    const loadSDK = async () => {
      try {
        await sdk.actions.ready();

        if (!mounted) return;

        const context = await sdk.context;

        if (context?.client?.added && sdk.wallet?.ethProvider) {
          sdk.wallet.ethProvider.on("accountsChanged", handleAccountsChanged);
        }

        if (mounted) {
          setIsSDKLoaded(true);
        }
      } catch (error) {
        console.warn("[SDK] Load error:", error);

        if (mounted) {
          setIsSDKLoaded(true);
        }
      }
    };

    const minimumTimer = setTimeout(() => {
      if (mounted) {
        setIsMinimumTimePassed(true);
      }
    }, MINIMUM_LOADING_TIME);

    loadSDK();

    return () => {
      mounted = false;
      clearTimeout(minimumTimer);

      if (sdk.wallet?.ethProvider) {
        try {
          sdk.wallet.ethProvider.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
        } catch (error) {
          console.warn("[SDK] Cleanup error:", error);
        }
      }
    };
  }, [handleAccountsChanged]);

  useEffect(() => {
    if (isSDKLoaded && isMinimumTimePassed) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, FADE_DURATION);

      return () => clearTimeout(timer);
    }
  }, [isSDKLoaded, isMinimumTimePassed]);

  const canShowApp = isSDKLoaded && isMinimumTimePassed;

  return (
    <>
      <LoadingScreen isVisible={!canShowApp} />
      <div
        style={{
          opacity: showContent ? 1 : 0,
          transition: `opacity ${FADE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </div>
    </>
  );
}
