"use client";

import dynamic from "next/dynamic";

const BlockBasedGame = dynamic(() => import("@/components/BlockBasedGame"), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden" role="main">
      <BlockBasedGame />
    </main>
  );
}
