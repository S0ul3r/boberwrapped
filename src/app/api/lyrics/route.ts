import { NextResponse } from "next/server";
import { fetchLyrics } from "@/lib/lyricsProvider";

const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_MAX = 5;
const requestTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_LIMIT_MAX) return true;
  requestTimestamps.push(now);
  return false;
}

export async function POST(request: Request) {
  if (isRateLimited()) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in a moment." },
      { status: 429 }
    );
  }

  let body: {
    trackName?: string;
    artistName?: string;
    albumName?: string;
    durationMs?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { trackName, artistName, albumName, durationMs } = body;
  if (!trackName || !artistName) {
    return NextResponse.json(
      { error: "trackName and artistName are required" },
      { status: 400 }
    );
  }

  try {
    const lyrics = await fetchLyrics({
      trackName,
      artistName,
      albumName,
      durationMs,
    });
    return NextResponse.json({ lyrics });
  } catch {
    return NextResponse.json({ lyrics: null });
  }
}
