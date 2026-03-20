"use client";

import { useState } from "react";
import Image from "next/image";
import { getTopTracks, type SpotifyTrack, type TimeRange } from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import { formatDuration } from "@/utils/format";
import TimeRangeSelector from "./TimeRangeSelector";
import SectionCard from "./ui/SectionCard";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorMessage from "./ui/ErrorMessage";

function renderTracksContent(
  loading: boolean,
  error: string | null,
  tracks: SpotifyTrack[]
) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (error) {
    return <ErrorMessage message={error} />;
  }
  return (
    <div className="max-h-[1500px] overflow-y-auto">
          <div className="space-y-0.5">
            {tracks.map((track, i) => (
              <a
                key={track.id}
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded px-2 py-1.5 transition hover:bg-zinc-800/50"
              >
              <span className="w-5 shrink-0 text-right text-sm text-zinc-500">{i + 1}</span>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
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
                <p className="truncate font-medium">{track.name}</p>
                <p className="truncate text-sm text-zinc-400">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-sm text-zinc-500">
                {formatDuration(track.duration_ms)}
              </span>
            </a>
          ))}
          </div>
        </div>
  );
}

export default function TopTracks() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading, error } = useSpotifyFetch<SpotifyTrack[]>(
    (token) => getTopTracks(token, timeRange),
    [timeRange]
  );

  return (
    <SectionCard
      title="Top Tracks"
      headerAction={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {renderTracksContent(loading, error, data ?? [])}
    </SectionCard>
  );
}
