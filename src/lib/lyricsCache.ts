/**
 * Client-side lyrics cache in localStorage.
 */

import {
  LYRICS_CACHE_STORAGE_KEY,
  LYRICS_CACHE_TTL_MS,
} from "@/lib/constants";
import type { LyricsCache, LyricsCacheEntry } from "@/lib/trackSearch";

export function loadLyricsCache(): LyricsCache {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LYRICS_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const cache = JSON.parse(raw) as LyricsCache;
    const now = Date.now();
    const valid: LyricsCache = {};
    for (const [id, entry] of Object.entries(cache)) {
      if (entry && now - entry.fetchedAt < LYRICS_CACHE_TTL_MS) {
        valid[id] = entry;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

export function saveLyricsCacheEntry(trackId: string, plainLyrics: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const cache = loadLyricsCache();
    cache[trackId] = {
      plainLyrics: plainLyrics ?? "",
      fetchedAt: Date.now(),
    };
    localStorage.setItem(LYRICS_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded
  }
}

export function countLyricsCacheEntries(cache: LyricsCache): number {
  return Object.values(cache).filter((e) => e.plainLyrics).length;
}

export async function fetchLyricsFromApi(
  track: {
    name: string;
    artists: { name: string }[];
    album: { name: string };
    duration_ms: number;
  }
): Promise<string | null> {
  const res = await fetch("/api/lyrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trackName: track.name,
      artistName: track.artists.map((a) => a.name).join(", "),
      albumName: track.album.name,
      durationMs: track.duration_ms,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lyrics: string | null };
  return data.lyrics;
}

/** Throttled sequential lyrics fetch for tracks missing metadata matches. */
export async function fetchLyricsForTracks(
  tracks: { id: string; track: Parameters<typeof fetchLyricsFromApi>[0] }[],
  cache: LyricsCache,
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<LyricsCache> {
  const updated = { ...cache };
  const toFetch = tracks.filter((t) => {
    const cached = updated[t.id];
    return !cached || Date.now() - cached.fetchedAt > LYRICS_CACHE_TTL_MS;
  });

  for (let i = 0; i < toFetch.length; i++) {
    if (signal?.aborted) break;
    const { id, track } = toFetch[i];
    onProgress?.(i + 1, toFetch.length);

    const existing = updated[id];
    if (existing?.plainLyrics) continue;

    const lyrics = await fetchLyricsFromApi(track);
    const entry: LyricsCacheEntry = {
      plainLyrics: lyrics ?? "",
      fetchedAt: Date.now(),
    };
    updated[id] = entry;
    saveLyricsCacheEntry(id, lyrics);

    // ~4 req/s throttle for LRCLib
    await new Promise((r) => setTimeout(r, 250));
  }

  return updated;
}
