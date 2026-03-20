"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getCurrentlyPlaying, type SpotifyTrack } from "@/lib/spotify";
import { useSpotify } from "@/context/SpotifyContext";

export default function CurrentlyPlaying() {
  const { getValidToken } = useSpotify();
  const [current, setCurrent] = useState<{
    item: SpotifyTrack;
    is_playing: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchCurrent = () => {
      getValidToken().then((token) => {
        if (token) getCurrentlyPlaying(token).then(setCurrent);
      });
    };
    fetchCurrent();
    const interval = setInterval(fetchCurrent, 10_000);
    return () => clearInterval(interval);
  }, [getValidToken]);

  if (!current?.item) return null;

  return (
    <section className="rounded-2xl border border-[#1db954]/30 bg-zinc-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded">
          {current.item.album.images[0] && (
            <Image
              src={current.item.album.images[0].url}
              alt=""
              fill
              className="object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-500">
            {current.is_playing ? "Now playing" : "Paused"}
          </p>
          <p className="truncate font-medium">{current.item.name}</p>
          <p className="truncate text-sm text-zinc-400">
            {current.item.artists.map((a) => a.name).join(", ")}
          </p>
        </div>
        <a
          href={current.item.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#1db954] px-4 py-2 text-sm font-medium text-black hover:bg-[#1ed760]"
        >
          Open in Spotify
        </a>
      </div>
    </section>
  );
}
