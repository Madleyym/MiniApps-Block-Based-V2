const ROOT_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://block-base-pi.vercel.app";

export const FRAME_ASSETS = {
  icon: {
    svg: `${ROOT_URL}/icon.svg`,
    png: `${ROOT_URL}/icon.png`,
  },
  splash: {
    svg: `${ROOT_URL}/splash.svg`,
    png: `${ROOT_URL}/splash.png`,
  },
  hero: `${ROOT_URL}/hero.svg`,
  og: `${ROOT_URL}/og.png`,
  screenshot: `${ROOT_URL}/screenshot.svg`,
} as const;

export const minikitConfig = {
  accountAssociation: {
    header:
      "eyJmaWQiOjEzNDYwNDcsInR5cGUiOiJhdXRoIiwia2V5IjoiMHgyZjdBRDNGMTFjNmQ2NTkwOWJmYmRDMGM5YTRDZDhCNTEyYmMwMzM0In0",
    payload: "eyJkb21haW4iOiJibG9jay1iYXNlLXBpLnZlcmNlbC5hcHAifQ",
    signature:
      "2I7dNHU0EAfCKRX1tYe8hsKuKeGacrk9P4zy1w//Grt3Ge3jj+1fyeuIJHtf+T0tSeXQe0/Zg7ukDlpytlp1iBs=",
  },

  frame: {
    version: "1",
    name: "Block Based",
    subtitle: "Block Puzzle Game on Base",
    description:
      "Block puzzle on Base Network. Place pieces on 8x8 grid, clear lines to score. Adventure mode with 100 levels or endless Classic mode. Compete globally!",
    iconUrl: FRAME_ASSETS.icon.png,
    imageUrl: FRAME_ASSETS.hero,
    buttonTitle: "Play Block Based",
    splashImageUrl: FRAME_ASSETS.splash.png,
    splashBackgroundColor: "#1e3c72",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    screenshotUrls: [FRAME_ASSETS.screenshot],
    primaryCategory: "games",
    tags: ["puzzle", "gaming", "casual", "base", "blockchain"],
    heroImageUrl: FRAME_ASSETS.hero,
    tagline: "Block puzzle on Base Network",
    ogTitle: "Block Based - Puzzle Game",
    ogDescription:
      "Block puzzle on Base Network. 100-level Adventure mode or endless Classic. Compete globally!",
    ogImageUrl: FRAME_ASSETS.og,
    castShareUrl: ROOT_URL,
  },
} as const;

export const BASE_MINI_APP_CONSTANTS = {
  GRID_SIZE: 8,
  MAX_LEVEL: 100,
  STORAGE_KEYS: {
    BEST_SCORE: "blockBasedBestScore",
    DAILY_VICTORIES: "blockBasedDailyVictories",
    SOUND_ENABLED: "blockBasedSound",
    CURRENT_LEVEL: "blockBasedCurrentLevel",
  },
} as const;

export const getManifest = () => ({
  accountAssociation: minikitConfig.accountAssociation,
  frame: minikitConfig.frame,
});

export const isFrameContext = (): boolean => {
  if (typeof window === "undefined") return false;

  const sdk = (window as any).sdk;
  const hasFrameSDK = !!sdk?.wallet?.ethProvider;

  const userAgent = navigator.userAgent.toLowerCase();
  const isWarpcast = userAgent.includes("warpcast");
  const isFarcaster = userAgent.includes("farcaster");

  return hasFrameSDK || isWarpcast || isFarcaster;
};

export const isLocalhost = (): boolean => {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "" ||
    hostname === "0.0.0.0"
  );
};

export const getWalletProvider = () => {
  if (typeof window === "undefined") return null;

  const sdk = (window as any).sdk;
  if (sdk?.wallet?.ethProvider) {
    return sdk.wallet.ethProvider;
  }

  if (window.ethereum) {
    return window.ethereum;
  }

  return null;
};

export const isAdminWallet = (address?: string): boolean => {
  if (!address) return false;

  const ADMIN_ADDRESS = "0xAeabadae3Cc5f1d1A5De4903a195BF2796dF3481";
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
};
