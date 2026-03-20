"use client";

import { useState } from "react";
import Image from "next/image";
import { getTopArtists, type SpotifyArtist, type TimeRange } from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import TimeRangeSelector from "./TimeRangeSelector";
import SectionCard from "./ui/SectionCard";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorMessage from "./ui/ErrorMessage";

export default function TopArtists() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading, error } = useSpotifyFetch<SpotifyArtist[]>(
    (token) => getTopArtists(token, timeRange),
    [timeRange]
  );

  return (
    <SectionCard
      title="Top Artists"
      headerAction={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(data ?? []).map((artist, i) => (
            <a
              key={artist.id}
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center rounded-xl bg-zinc-800/50 p-4 transition hover:bg-zinc-800"
            >
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-full">
                {artist.images[0] ? (
                  <Image
                    src={artist.images[0].url}
                    alt={artist.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-2xl font-bold text-zinc-500">
                    {i + 1}
                  </div>
                )}
              </div>
              <span className="text-center text-sm font-medium line-clamp-1">
                {artist.name}
              </span>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
