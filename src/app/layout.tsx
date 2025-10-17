import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://block-base-pi.vercel.app";

export const metadata: Metadata = {
  title: "Block Based - Puzzle Game on Base",
  description:
    "Tetris-style puzzle game on Base Network. Place pieces on 8x8 grid to clear lines and score points. Adventure mode with 100 levels!",
  openGraph: {
    type: "website",
    url: APP_URL,
    title: "Block Based - Puzzle Game",
    description:
      "Play addictive block puzzle on Base Network! Adventure mode with 100 levels or Classic mode.",
    siteName: "Block Based",
    images: [
      {
        url: `${APP_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: "Block Based - Puzzle Game on Base",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Block Based - Puzzle Game",
    description: "Play addictive block puzzle on Base Network!",
    images: [`${APP_URL}/og.png`],
    creator: "@qianrere",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.png",
    shortcut: "/icon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e3c72",
  colorScheme: "dark",
};

// Mini App Embed JSONs for Farcaster/Warpcast
const miniAppEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/og.png`,
  button: {
    title: "Play Block Based",
    action: {
      type: "launch_miniapp",
      url: APP_URL,
      name: "Block Based",
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#1e3c72",
    },
  },
};

const frameEmbed = {
  ...miniAppEmbed,
  button: {
    ...miniAppEmbed.button,
    action: {
      ...miniAppEmbed.button.action,
      type: "launch_frame",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* --- REMOVE MANUAL OG/Twitter META TAGS --- */}
        {/* OG/Twitter meta tags will be injected by Next.js Metadata API */}

        {/* Mini App Embed Meta Tags (Wajib untuk Farcaster/Warpcast) */}
        <meta name="fc:miniapp" content={JSON.stringify(miniAppEmbed)} />
        <meta name="fc:frame" content={JSON.stringify(frameEmbed)} />

        {/* Jika ingin menambah meta custom lain, boleh di bawah ini */}
      </head>
      <body className={`${inter.className} ${poppins.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
