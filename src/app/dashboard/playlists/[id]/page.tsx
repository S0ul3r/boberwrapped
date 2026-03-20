"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getPlaylist,
  getPlaylistTracks,
  getProfile,
  createPlaylist,
  addTracksToPlaylist,
  getTopTracks,
  type SpotifyPlaylist,
  type SpotifyTrack,
  type TimeRange,
} from "@/lib/spotify";
import { useSpotify } from "@/context/SpotifyContext";
import { formatDuration } from "@/utils/format";
import { TIME_RANGE_LABELS, PLAYLIST_ADD_BATCH_SIZE } from "@/lib/constants";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getValidToken } = useSpotify();
  const id = params.id as string;
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getValidToken()
      .then(async (token) => {
        if (!token) return;
        const p = await getPlaylist(token, id);
        setPlaylist(p);
        const allTracks: SpotifyTrack[] = [];
        let offset = 0;
        let hasMore = true;
        while (hasMore) {
          const r = await getPlaylistTracks(token, id, 50, offset);
          const tracks = r.items
            .map((i) => i.track ?? i.item)
            .filter((t): t is SpotifyTrack => t != null && typeof t === "object")
            .filter((t) => t.id);
          allTracks.push(...tracks);
          offset += r.items.length;
          hasMore = r.items.length === 50 && allTracks.length < r.total;
        }
        return allTracks;
      })
      .then((data) => data && setTracks(data))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setPlaylist(null);
      })
      .finally(() => setLoading(false));
  }, [getValidToken, id]);

  const handleCreateTopPlaylist = async (timeRange: TimeRange) => {
    const token = await getValidToken();
    if (!token) return;
    setCreating(true);
    setCreateError(null);
    try {
      const profile = await getProfile(token);
      const topTracks = await getTopTracks(token, timeRange, 50);
      const label = TIME_RANGE_LABELS[timeRange];
      const newPlaylist = await createPlaylist(
        token,
        profile.id,
        `Boberwrapped Top 50 - ${label}`,
        `Your top 50 tracks from the last ${label}`,
        true
      );
      const uris = topTracks.map((t) => `spotify:track:${t.id}`);
      for (let i = 0; i < uris.length; i += PLAYLIST_ADD_BATCH_SIZE) {
        await addTracksToPlaylist(
          token,
          newPlaylist.id,
          uris.slice(i, i + PLAYLIST_ADD_BATCH_SIZE)
        );
      }
      router.push(`/dashboard/playlists/${newPlaylist.id}`);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  if (error && !playlist) {
    const isForbidden = /forbidden|403/i.test(error);
    return (
      <div className="space-y-4">
        <Link href="/dashboard/playlists" className="text-[#1db954] hover:underline">
          ← Back to playlists
        </Link>
        <ErrorMessage
          message={error}
          hint={
            isForbidden
              ? "Playlist tracks are only available for playlists you own or collaborate on. Followed playlists from other users cannot be accessed."
              : undefined
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/playlists" className="text-[#1db954] hover:underline">
          ← Back to playlists
        </Link>
        <p className="text-red-400">Playlist not found.</p>
      </div>
    );
  }

  const timeRanges: TimeRange[] = ["short_term", "medium_term", "long_term"];

  return (
    <div className="space-y-6">
      <Link href="/dashboard/playlists" className="text-[#1db954] hover:underline">
        ← Back to playlists
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-end">
        <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl">
          {playlist.images[0] ? (
            <Image src={playlist.images[0].url} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-6xl">
              🎵
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{playlist.name}</h1>
          {playlist.description && (
            <p className="mt-1 text-zinc-400">{playlist.description}</p>
          )}
          <p className="mt-2 text-sm text-zinc-500">
            {playlist.tracks?.total ?? tracks.length} tracks
          </p>
          <a
            href={playlist.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full bg-[#1db954] px-6 py-2 font-medium text-black hover:bg-[#1ed760]"
          >
            Open in Spotify
          </a>
        </div>
      </div>

      <section className="rounded-2xl bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-xl font-bold">Create from Top Tracks</h2>
        {createError && (
          <p className="mb-4 text-amber-400">{createError}</p>
        )}
        <p className="mb-4 text-sm text-zinc-400">
          Create a new playlist with your top 50 tracks for a given time range.
        </p>
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((tr) => (
            <button
              key={tr}
              onClick={() => handleCreateTopPlaylist(tr)}
              disabled={creating}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : `Top 50 - ${TIME_RANGE_LABELS[tr]}`}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-xl font-bold">Tracks</h2>
        <div className="space-y-2">
          {tracks.map((track, i) => (
            <a
              key={track.id}
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-zinc-800/50"
            >
              <span className="w-6 text-right text-sm text-zinc-500">{i + 1}</span>
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                {track.album.images[0] && (
                  <Image
                    src={track.album.images[0].url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{track.name}</p>
                <p className="text-sm text-zinc-400">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-sm text-zinc-500">
                {formatDuration(track.duration_ms)}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
