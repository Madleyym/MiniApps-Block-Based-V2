import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Block Based Mini App webhook received:", body);

    switch (body.type) {
      case "frame_added":
        console.log("Mini app added/saved by user:", body.data);
        break;
      case "frame_removed":
        console.log("Mini app removed by user:", body.data);
        break;
      default:
        console.log("Unknown webhook type:", body.type);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Block Based webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Block Based Mini App webhook endpoint",
    status: "active",
    timestamp: new Date().toISOString(),
  });
}
