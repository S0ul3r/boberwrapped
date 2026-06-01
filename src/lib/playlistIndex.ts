/**
 * Build and cache a deduplicated index of tracks from all playlists + liked songs.
 */

import type { SpotifyTrack } from "@/types/spotify";
import {
  getProfile,
  getAllPlaylists,
  getAllPlaylistTracks,
  getAllSavedTracks,
} from "@/lib/spotify";
import type { SpotifyPlaylist } from "@/types/spotify";
import {
  TRACK_INDEX_STORAGE_KEY,
  TRACK_INDEX_TIMESTAMP_KEY,
  TRACK_INDEX_TTL_MS,
} from "@/lib/constants";

export interface TrackSource {
  type: "playlist" | "liked";
  id: string;
  name: string;
}

export interface IndexedTrack {
  track: SpotifyTrack;
  sources: TrackSource[];
}

export interface TrackIndex {
  tracks: IndexedTrack[];
  indexedAt: number;
  stats: {
    playlistCount: number;
    skippedPlaylists: number;
    uniqueTracks: number;
  };
}

export interface IndexProgress {
  phase: "playlists" | "liked" | "done";
  message: string;
  current?: number;
  total?: number;
}

export interface BuildIndexResult {
  index: TrackIndex;
  /** Followed playlists (not owned / not collaborative) — no API access */
  skippedPlaylists: string[];
}

/** Playlists we can read items from (owned or collaborative). */
function canIndexPlaylist(playlist: SpotifyPlaylist, userId: string): boolean {
  const ownerId = playlist.owner?.id;
  if (!ownerId) return true;
  if (ownerId === userId) return true;
  return playlist.collaborative === true;
}

function addTrack(
  map: Map<string, IndexedTrack>,
  track: SpotifyTrack,
  source: TrackSource
) {
  if (!track.id) return;
  const existing = map.get(track.id);
  if (existing) {
    const already = existing.sources.some(
      (s) => s.type === source.type && s.id === source.id
    );
    if (!already) existing.sources.push(source);
    return;
  }
  map.set(track.id, { track, sources: [source] });
}

export async function buildTrackIndex(
  accessToken: string,
  onProgress?: (progress: IndexProgress) => void
): Promise<BuildIndexResult> {
  const map = new Map<string, IndexedTrack>();
  const skippedPlaylists: string[] = [];

  onProgress?.({ phase: "playlists", message: "Fetching playlists…" });
  const profile = await getProfile(accessToken);
  const playlists = await getAllPlaylists(accessToken);
  const indexable = playlists.filter((p) => canIndexPlaylist(p, profile.id));

  for (const playlist of playlists) {
    if (!canIndexPlaylist(playlist, profile.id)) {
      skippedPlaylists.push(playlist.name);
    }
  }

  for (let i = 0; i < indexable.length; i++) {
    const playlist = indexable[i];
    onProgress?.({
      phase: "playlists",
      message: `Indexing playlist ${i + 1}/${indexable.length}: ${playlist.name}`,
      current: i + 1,
      total: indexable.length,
    });
    try {
      const tracks = await getAllPlaylistTracks(accessToken, playlist.id);
      for (const track of tracks) {
        addTrack(map, track, {
          type: "playlist",
          id: playlist.id,
          name: playlist.name,
        });
      }
    } catch (e) {
      skippedPlaylists.push(playlist.name);
      console.warn(`Failed to index playlist "${playlist.name}":`, e);
    }
  }

  onProgress?.({ phase: "liked", message: "Fetching liked tracks…" });
  const liked = await getAllSavedTracks(accessToken);
  for (const { track } of liked) {
    addTrack(map, track, { type: "liked", id: "liked", name: "Liked Songs" });
  }

  const tracks = Array.from(map.values());
  const index: TrackIndex = {
    tracks,
    indexedAt: Date.now(),
    stats: {
      playlistCount: indexable.length,
      skippedPlaylists: skippedPlaylists.length,
      uniqueTracks: tracks.length,
    },
  };

  onProgress?.({
    phase: "done",
    message: `Indexed ${tracks.length} unique tracks`,
  });

  return { index, skippedPlaylists };
}

export function saveTrackIndex(index: TrackIndex): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TRACK_INDEX_STORAGE_KEY, JSON.stringify(index));
    localStorage.setItem(TRACK_INDEX_TIMESTAMP_KEY, String(index.indexedAt));
  } catch {
    // Quota exceeded — index still usable in memory
  }
}

export function loadTrackIndex(): TrackIndex | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRACK_INDEX_STORAGE_KEY);
    if (!raw) return null;
    const index = JSON.parse(raw) as TrackIndex;
    if (!index.tracks || !index.indexedAt) return null;
    if (Date.now() - index.indexedAt > TRACK_INDEX_TTL_MS) return null;
    return index;
  } catch {
    return null;
  }
}

export function clearTrackIndex(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TRACK_INDEX_STORAGE_KEY);
  localStorage.removeItem(TRACK_INDEX_TIMESTAMP_KEY);
}
