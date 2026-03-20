/**
 * Spotify Web API types
 * https://developer.spotify.com/documentation/web-api
 */

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  images: SpotifyImage[];
  external_urls: { spotify: string };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images: SpotifyImage[];
  genres?: string[];
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: SpotifyImage[];
  };
  duration_ms: number;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: { url: string }[];
  /** Track count - API may return as `tracks` or `items` */
  tracks?: { total: number };
  items?: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
}

export interface PlayHistoryItem {
  track: SpotifyTrack;
  played_at: string;
  context?: { type: string; uri: string };
}

export interface SavedAlbum {
  id: string;
  name: string;
  images: { url: string }[];
  artists: { name: string }[];
}
