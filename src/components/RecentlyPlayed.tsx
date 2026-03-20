"use client";

import Image from "next/image";
import { getRecentlyPlayed, type PlayHistoryItem } from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import { formatRelativeTime } from "@/utils/format";
import SectionCard from "./ui/SectionCard";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorMessage from "./ui/ErrorMessage";

export default function RecentlyPlayed() {
  const { data, loading, error } = useSpotifyFetch<PlayHistoryItem[]>(
    (token) => getRecentlyPlayed(token, 20)
  );

  return (
    <SectionCard title="Recently Played">
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (data ?? []).length === 0 ? (
        <p className="py-8 text-center text-zinc-500">
          No recently played tracks. Start listening on Spotify to see your history here.
        </p>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((item) => (
            <a
              key={`${item.track.id}-${item.played_at}`}
              href={item.track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-lg p-2 transition hover:bg-zinc-800/50"
            >
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                {item.track.album.images[0] && (
                  <Image
                    src={item.track.album.images[0].url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.track.name}</p>
                <p className="truncate text-xs text-zinc-500">
                  {item.track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {formatRelativeTime(item.played_at)}
              </span>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
