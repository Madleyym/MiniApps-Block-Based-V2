import { NextResponse } from "next/server";
import { getManifest } from "@/lib/minikit.config";

export async function GET() {
  const manifest = getManifest();
  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
