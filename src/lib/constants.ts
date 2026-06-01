/**
 * Application constants
 */

import type { TimeRange } from "@/types/spotify";

export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: "4 weeks",
  medium_term: "6 months",
  long_term: "All time",
};

export const CHART_COLORS = [
  "#1db954",
  "#1ed760",
  "#2ecc71",
  "#27ae60",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#166534",
  "#14532d",
  "#052e16",
] as const;

export const DASHBOARD_LINK = "https://developer.spotify.com/dashboard";

/** Spotify API limit for adding tracks to playlist in one request */
export const PLAYLIST_ADD_BATCH_SIZE = 100;

/** localStorage keys for track search index and lyrics cache */
export const TRACK_INDEX_STORAGE_KEY = "boberwrapped_track_index";
export const TRACK_INDEX_TIMESTAMP_KEY = "boberwrapped_track_index_at";
export const LYRICS_CACHE_STORAGE_KEY = "boberwrapped_lyrics_cache";

/** Track index cache TTL — 24 hours */
export const TRACK_INDEX_TTL_MS = 24 * 60 * 60 * 1000;

/** Lyrics cache TTL — 30 days */
export const LYRICS_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** LRCLib / lyrics API User-Agent */
export const LYRICS_USER_AGENT = "Boberwrapped/1.0 (https://github.com/boberwrapped)";
