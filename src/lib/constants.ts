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
