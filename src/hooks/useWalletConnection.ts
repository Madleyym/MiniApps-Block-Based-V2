"use client";

import { useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";

interface WalletConnection {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isFrameWallet: boolean;
  isWagmiWallet: boolean;
  provider: any;
}

export const useWalletConnection = (): WalletConnection => {
  const [state, setState] = useState<WalletConnection>({
    address: undefined,
    isConnected: false,
    isFrameWallet: false,
    isWagmiWallet: false,
    provider: null,
  });

  useEffect(() => {
    let mounted = true;

    const connectWallet = async () => {
      console.log("[WALLET] 🚀 Starting instant connection...");

      try {
        // ✅ PRIORITY 1: Frame Wallet (Instant for Farcaster users)
        if (sdk.wallet?.ethProvider) {
          const provider = sdk.wallet.ethProvider;
          console.log("[WALLET] 🟣 Frame wallet detected");

          try {
            // Try silent connection first (no popup)
            const accounts = await provider.request({
              method: "eth_accounts",
            });

            if (accounts && accounts.length > 0) {
              if (!mounted) return;

              const address = accounts[0] as `0x${string}`;
              console.log("[WALLET] ✅ Frame connected instantly:", address);

              setState({
                address,
                isConnected: true,
                isFrameWallet: true,
                isWagmiWallet: false,
                provider,
              });
              return;
            }

            // If no existing connection, request permission
            console.log("[WALLET] 🔑 Requesting Frame permission...");
            const newAccounts = await provider.request({
              method: "eth_requestAccounts",
            });

            if (newAccounts && newAccounts.length > 0 && mounted) {
              const address = newAccounts[0] as `0x${string}`;
              console.log("[WALLET] ✅ Frame connected:", address);

              setState({
                address,
                isConnected: true,
                isFrameWallet: true,
                isWagmiWallet: false,
                provider,
              });
              return;
            }
          } catch (frameError: any) {
            // User denied Frame wallet, continue to browser fallback
            console.log(
              "[WALLET] ⚠️ Frame denied, trying browser:",
              frameError.code
            );
          }
        }

        // ✅ PRIORITY 2: Browser Wallet (MetaMask, Coinbase, etc)
        if (typeof window !== "undefined" && window.ethereum) {
          console.log("[WALLET] 🦊 Browser wallet detected");

          try {
            // Try silent connection
            const accounts = await window.ethereum.request({
              method: "eth_accounts",
            });

            if (accounts && accounts.length > 0) {
              if (!mounted) return;

              const address = accounts[0] as `0x${string}`;
              console.log("[WALLET] ✅ Browser connected instantly:", address);

              setState({
                address,
                isConnected: true,
                isFrameWallet: false,
                isWagmiWallet: false,
                provider: window.ethereum,
              });
              return;
            }

            // If no existing connection, request permission
            console.log("[WALLET] 🔑 Requesting browser permission...");
            const newAccounts = await window.ethereum.request({
              method: "eth_requestAccounts",
            });

            if (newAccounts && newAccounts.length > 0 && mounted) {
              const address = newAccounts[0] as `0x${string}`;
              console.log("[WALLET] ✅ Browser connected:", address);

              setState({
                address,
                isConnected: true,
                isFrameWallet: false,
                isWagmiWallet: false,
                provider: window.ethereum,
              });
              return;
            }
          } catch (browserError: any) {
            console.error(
              "[WALLET] ❌ Browser wallet failed:",
              browserError.message
            );
          }
        }

        console.log("[WALLET] ℹ️ No wallet available");
      } catch (error: any) {
        console.error("[WALLET] 💥 Error:", error.message);
      }
    };

    // ✅ INSTANT START - No delay!
    connectWallet();

    // ✅ Account change listener with CORRECT TYPES
    const handleAccountsChanged = (
      accounts: readonly `0x${string}`[] | string[]
    ) => {
      if (!mounted) return;

      if (accounts.length > 0) {
        const address = accounts[0] as `0x${string}`;
        console.log("[WALLET] 🔄 Account changed:", address);

        setState((prev) => ({
          ...prev,
          address,
          isConnected: true,
        }));
      } else {
        console.log("[WALLET] 🔌 Disconnected");
        setState({
          address: undefined,
          isConnected: false,
          isFrameWallet: false,
          isWagmiWallet: false,
          provider: null,
        });
      }
    };

    // Setup listeners for both providers (with error handling)
    if (sdk.wallet?.ethProvider?.on) {
      try {
        sdk.wallet.ethProvider.on("accountsChanged", handleAccountsChanged);
      } catch (e) {
        console.warn("[WALLET] Frame listener setup failed:", e);
      }
    }

    if (typeof window !== "undefined" && window.ethereum?.on) {
      try {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
      } catch (e) {
        console.warn("[WALLET] Browser listener setup failed:", e);
      }
    }

    return () => {
      mounted = false;

      // Cleanup listeners (with error handling)
      try {
        if (sdk.wallet?.ethProvider?.removeListener) {
          sdk.wallet.ethProvider.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
        }
      } catch (e) {
        console.warn("[WALLET] Frame cleanup failed:", e);
      }

      try {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
        }
      } catch (e) {
        console.warn("[WALLET] Browser cleanup failed:", e);
      }
    };
  }, []);

  return state;
};
