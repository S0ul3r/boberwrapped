"use client";

import { useState } from "react";
import Image from "next/image";
import {
  getTopArtists,
  getTopTracks,
  getRecommendations,
  type SpotifyTrack,
  type TimeRange,
} from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

async function fetchRecommendations(
  token: string,
  timeRange: TimeRange
): Promise<SpotifyTrack[]> {
  const [artists, topTracks] = await Promise.all([
    getTopArtists(token, timeRange, 5),
    getTopTracks(token, timeRange, 5),
  ]);
  const seedArtists = artists.map((a) => a.id);
  const seedTracks = topTracks.map((t) => t.id);
  const { tracks } = await getRecommendations(token, seedArtists, seedTracks, 20);
  return tracks;
}

export default function DiscoverPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading, error } = useSpotifyFetch<SpotifyTrack[]>(
    (token) => fetchRecommendations(token, timeRange),
    [timeRange]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discover</h1>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      <p className="text-zinc-400">
        Recommendations based on your top artists and tracks.
      </p>
      {error ? (
        <ErrorMessage
          message={error}
          hint="Recommendations are restricted for new Spotify apps (since Nov 2024)."
          dashboardLink
        />
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-2">
          {(data ?? []).map((track) => (
            <a
              key={track.id}
              href={track.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-zinc-800/50"
            >
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
              <a
                href={track.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#1db954] px-4 py-2 text-sm font-medium text-black hover:bg-[#1ed760]"
              >
                Play on Spotify
              </a>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
