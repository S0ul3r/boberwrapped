"use client";

import Image from "next/image";
import Link from "next/link";
import { getPlaylists, type SpotifyPlaylist } from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

async function fetchPlaylists(token: string): Promise<{ items: SpotifyPlaylist[] }> {
  const r = await getPlaylists(token, 50);
  return { items: r.items };
}

export default function PlaylistsPage() {
  const { data, loading, error } = useSpotifyFetch<{ items: SpotifyPlaylist[] }>(
    fetchPlaylists
  );

  const playlists = data?.items ?? [];

  const renderContent = () => {
    if (error) return <ErrorMessage message={error} />;
    if (loading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }
    return (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {playlists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/dashboard/playlists/${playlist.id}`}
              className="rounded-xl bg-zinc-800/50 p-4 transition hover:bg-zinc-800"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
                {playlist.images[0] ? (
                  <Image
                    src={playlist.images[0].url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-4xl">
                    🎵
                  </div>
                )}
              </div>
              <p className="font-medium line-clamp-1">{playlist.name}</p>
              <p className="text-sm text-zinc-500">
                {(playlist.tracks?.total ?? playlist.items?.total ?? 0)} tracks
              </p>
            </Link>
          ))}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Playlists</h1>
      {renderContent()}
    </div>
  );
}
