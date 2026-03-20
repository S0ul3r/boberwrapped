/**
 * Spotify Web API client
 * https://developer.spotify.com/documentation/web-api
 */

import type {
  TimeRange,
  SpotifyUser,
  SpotifyArtist,
  SpotifyTrack,
  SpotifyPlaylist,
  AudioFeatures,
  PlayHistoryItem,
} from "@/types/spotify";
import { SPOTIFY_API_BASE } from "./constants";

export type { TimeRange, SpotifyUser, SpotifyArtist, SpotifyTrack, SpotifyPlaylist, AudioFeatures, PlayHistoryItem };

async function parseSpotifyError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    const msg = body?.error?.message ?? body?.error ?? res.statusText;
    return typeof msg === "string" ? msg : "Request failed";
  } catch {
    return res.statusText || "Request failed";
  }
}

async function fetchWithAuth(
  url: string,
  accessToken: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });
}

async function handleResponse<T>(res: Response, parse: () => Promise<T>): Promise<T> {
  if (!res.ok) {
    const msg = await parseSpotifyError(res);
    if (res.status === 403) {
      throw new Error(`${msg} Request extended access in Spotify Developer Dashboard.`);
    }
    throw new Error(msg);
  }
  return parse();
}

export async function getProfile(accessToken: string): Promise<SpotifyUser> {
  const res = await fetchWithAuth(`${SPOTIFY_API_BASE}/me`, accessToken);
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  return res.json();
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = "medium_term",
  limit = 50
): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/top/artists?${params}`,
    accessToken
  );
  return handleResponse(res, async () => {
    const data = await res.json();
    return data.items;
  });
}

export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = "medium_term",
  limit = 50
): Promise<SpotifyTrack[]> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/top/tracks?${params}`,
    accessToken
  );
  return handleResponse(res, async () => {
    const data = await res.json();
    return data.items;
  });
}

export async function getRecentlyPlayed(
  accessToken: string,
  limit = 50
): Promise<PlayHistoryItem[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/player/recently-played?${params}`,
    accessToken
  );
  return handleResponse(res, async () => {
    const data = await res.json();
    return data.items;
  });
}

export async function getCurrentlyPlaying(
  accessToken: string
): Promise<{ item: SpotifyTrack; is_playing: boolean } | null> {
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/player/currently-playing`,
    accessToken
  );
  if (res.status === 204) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function getSavedTracks(
  accessToken: string,
  limit = 50,
  offset = 0
): Promise<{ items: { track: SpotifyTrack; added_at: string }[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/tracks?${params}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  const data = await res.json();
  return { items: data.items, total: data.total };
}

export async function getSavedAlbums(
  accessToken: string,
  limit = 50,
  offset = 0
): Promise<{
  items: { album: { id: string; name: string; images: { url: string }[]; artists: { name: string }[] }; added_at: string }[];
  total: number;
}> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/albums?${params}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  const data = await res.json();
  return { items: data.items, total: data.total };
}

export async function getFollowedArtists(
  accessToken: string,
  limit = 50
): Promise<SpotifyArtist[]> {
  const params = new URLSearchParams({
    type: "artist",
    limit: String(limit),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/following?${params}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  const data = await res.json();
  return data.artists?.items ?? [];
}

export async function getPlaylists(
  accessToken: string,
  limit = 50,
  offset = 0
): Promise<{ items: SpotifyPlaylist[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/me/playlists?${params}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  const data = await res.json();
  return { items: data.items, total: data.total };
}

export async function getPlaylist(
  accessToken: string,
  playlistId: string
): Promise<SpotifyPlaylist> {
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  return res.json();
}

/**
 * Get playlist tracks. Supports both /tracks (track) and /items (item) response formats.
 * Max 50 per request.
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit = 50,
  offset = 0
): Promise<{ items: { track?: SpotifyTrack | null; item?: SpotifyTrack | null }[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    offset: String(offset),
  });
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks?${params}`,
    accessToken
  );
  if (!res.ok) {
    const msg = await parseSpotifyError(res);
    if (res.status === 403) {
      throw new Error(
        `${msg} Playlist tracks are only accessible for playlists you own or collaborate on.`
      );
    }
    throw new Error(msg);
  }
  const data = await res.json();
  return { items: data.items ?? [], total: data.total ?? 0 };
}

export async function getArtist(
  accessToken: string,
  artistId: string
): Promise<SpotifyArtist> {
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/artists/${artistId}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  return res.json();
}

/** Fetch up to 50 artists in one request. Returns artists in same order; null for missing IDs. */
export async function getArtists(
  accessToken: string,
  artistIds: string[]
): Promise<(SpotifyArtist | null)[]> {
  if (artistIds.length === 0) return [];
  const ids = artistIds.slice(0, 50).filter(Boolean).join(",");
  if (!ids) return [];
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/artists?ids=${ids}`,
    accessToken
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  const data = await res.json();
  return data.artists ?? [];
}

export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<AudioFeatures[]> {
  if (trackIds.length === 0) return [];
  const ids = trackIds.slice(0, 100).join(",");
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/audio-features?ids=${ids}`,
    accessToken
  );
  if (!res.ok) {
    const msg = await parseSpotifyError(res);
    if (res.status === 403) {
      throw new Error("Audio features are restricted for this app. Request extended access in Spotify Developer Dashboard.");
    }
    throw new Error(msg);
  }
  const data = await res.json();
  return data.audio_features?.filter(Boolean) ?? [];
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description?: string,
  public_ = true
): Promise<SpotifyPlaylist> {
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/users/${userId}/playlists`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description ?? "",
        public: public_,
      }),
    }
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  return res.json();
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  uris: string[]
): Promise<{ snapshot_id: string }> {
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`,
    accessToken,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris }),
    }
  );
  if (!res.ok) throw new Error(await parseSpotifyError(res));
  return res.json();
}

export async function getRecommendations(
  accessToken: string,
  seedArtists?: string[],
  seedTracks?: string[],
  limit = 20
): Promise<{ tracks: SpotifyTrack[] }> {
  const params = new URLSearchParams();
  const hasSeeds = (seedArtists?.length ?? 0) > 0 || (seedTracks?.length ?? 0) > 0;
  if (hasSeeds) {
    const artists = seedArtists?.slice(0, 3) ?? [];
    const tracks = seedTracks?.slice(0, 5 - artists.length) ?? [];
    if (artists.length) params.set("seed_artists", artists.join(","));
    if (tracks.length) params.set("seed_tracks", tracks.join(","));
  } else {
    params.set("seed_genres", "pop");
  }
  params.set("limit", String(limit));
  const res = await fetchWithAuth(
    `${SPOTIFY_API_BASE}/recommendations?${params}`,
    accessToken
  );
  if (!res.ok) {
    const msg = await parseSpotifyError(res);
    if (res.status === 403) {
      throw new Error("Recommendations are restricted for this app. Request extended access in Spotify Developer Dashboard.");
    }
    throw new Error(msg);
  }
  return res.json();
}
