/**
 * Server-side lyrics providers: Musixmatch (if API key set) or LRCLib.
 */

import { LYRICS_USER_AGENT } from "@/lib/constants";

export interface LyricsRequest {
  trackName: string;
  artistName: string;
  albumName?: string;
  durationMs?: number;
}

const MUSIXMATCH_BASE = "https://api.musixmatch.com/ws/1.1";
const LRCLIB_BASE = "https://lrclib.net/api";

async function fetchMusixmatchLyrics(req: LyricsRequest): Promise<string | null> {
  const apiKey = process.env.MUSIXMATCH_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    apikey: apiKey,
    q_track: req.trackName,
    q_artist: req.artistName,
    f_has_lyrics: "1",
  });
  if (req.albumName) params.set("q_album", req.albumName);
  if (req.durationMs) params.set("f_duration", String(Math.round(req.durationMs / 1000)));

  const matchRes = await fetch(`${MUSIXMATCH_BASE}/matcher.track.get?${params}`);
  if (!matchRes.ok) return null;

  const matchData = await matchRes.json();
  const trackId = matchData?.message?.body?.track?.track_id;
  if (!trackId) return null;

  const lyricsParams = new URLSearchParams({
    apikey: apiKey,
    track_id: String(trackId),
  });
  const lyricsRes = await fetch(`${MUSIXMATCH_BASE}/track.lyrics.get?${lyricsParams}`);
  if (!lyricsRes.ok) return null;

  const lyricsData = await lyricsRes.json();
  const body = lyricsData?.message?.body?.lyrics?.lyrics_body;
  if (!body || body.includes("***")) return null;
  return body;
}

async function fetchLrcLibLyrics(req: LyricsRequest): Promise<string | null> {
  const params = new URLSearchParams({
    track_name: req.trackName,
    artist_name: req.artistName,
  });
  if (req.albumName) params.set("album_name", req.albumName);
  if (req.durationMs) params.set("duration", String(Math.round(req.durationMs / 1000)));

  const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
    headers: { "User-Agent": LYRICS_USER_AGENT },
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const data = await res.json();
  const lyrics = data.plainLyrics ?? data.plain_lyrics ?? data.syncedLyrics ?? data.synced_lyrics;
  return typeof lyrics === "string" && lyrics.trim() ? lyrics : null;
}

export async function fetchLyrics(req: LyricsRequest): Promise<string | null> {
  if (process.env.MUSIXMATCH_API_KEY) {
    const mxm = await fetchMusixmatchLyrics(req);
    if (mxm) return mxm;
  }
  return fetchLrcLibLyrics(req);
}
