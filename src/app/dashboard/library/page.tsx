"use client";

import { useState } from "react";
import Image from "next/image";
import {
  getSavedTracks,
  getSavedAlbums,
  getFollowedArtists,
  type SpotifyTrack,
  type SpotifyArtist,
} from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

type Tab = "tracks" | "albums" | "artists";

interface SavedAlbumItem {
  id: string;
  name: string;
  images: { url: string }[];
  artists: { name: string }[];
}

type LibraryData =
  | { type: "tracks"; items: { track: SpotifyTrack; added_at: string }[] }
  | { type: "albums"; items: { album: SavedAlbumItem; added_at: string }[] }
  | { type: "artists"; items: SpotifyArtist[] };

async function fetchLibraryData(
  token: string,
  tab: Tab
): Promise<LibraryData> {
  if (tab === "tracks") {
    const r = await getSavedTracks(token, 50);
    return { type: "tracks", items: r.items };
  }
  if (tab === "albums") {
    const r = await getSavedAlbums(token, 50);
    return { type: "albums", items: r.items };
  }
  const r = await getFollowedArtists(token, 50);
  return { type: "artists", items: r };
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>("tracks");
  const { data, loading, error } = useSpotifyFetch<LibraryData>(
    (token) => fetchLibraryData(token, tab),
    [tab]
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["tracks", "albums", "artists"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? "bg-[#1db954] text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <ErrorMessage message={error} />}
      {!error && loading && (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      {!error && !loading && data?.type === "tracks" && (
        <div className="space-y-2">
          {data.items.map(({ track, added_at }) => (
            <a
              key={track.id}
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-zinc-800/50"
            >
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
                {track.album.images[0] && (
                  <Image src={track.album.images[0].url} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{track.name}</p>
                <p className="text-sm text-zinc-400">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-sm text-zinc-500">
                Added {new Date(added_at).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      )}
      {!error && !loading && data?.type === "albums" && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map(({ album, added_at }) => (
            <a
              key={album.id}
              href={`https://open.spotify.com/album/${album.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-zinc-800/50 p-4 transition hover:bg-zinc-800"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
                {album.images[0] && (
                  <Image src={album.images[0].url} alt="" fill className="object-cover" />
                )}
              </div>
              <p className="font-medium">{album.name}</p>
              <p className="text-sm text-zinc-400">
                {album.artists.map((a) => a.name).join(", ")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Saved {new Date(added_at).toLocaleDateString()}
              </p>
            </a>
          ))}
        </div>
      )}
      {!error && !loading && data?.type === "artists" && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.items.map((artist) => (
            <a
              key={artist.id}
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center rounded-xl bg-zinc-800/50 p-4 transition hover:bg-zinc-800"
            >
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full">
                {artist.images[0] ? (
                  <Image src={artist.images[0].url} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-2xl font-bold text-zinc-500">
                    ?
                  </div>
                )}
              </div>
              <p className="text-center font-medium">{artist.name}</p>
              {artist.genres?.length ? (
                <p className="mt-1 truncate text-center text-xs text-zinc-500">
                  {artist.genres.slice(0, 2).join(", ")}
                </p>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

