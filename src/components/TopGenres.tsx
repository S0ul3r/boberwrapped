"use client";

import { useState } from "react";
import {
  getTopTracks,
  getArtists,
  type TimeRange,
} from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import { CHART_COLORS } from "@/lib/constants";
import TimeRangeSelector from "./TimeRangeSelector";
import SectionCard from "./ui/SectionCard";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorMessage from "./ui/ErrorMessage";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface GenreCount {
  name: string;
  value: number;
}

async function fetchGenreCounts(
  token: string,
  timeRange: TimeRange
): Promise<GenreCount[]> {
  const tracks = await getTopTracks(token, timeRange, 50);
  const artistIds = [...new Set(tracks.flatMap((t) => t.artists.map((a) => a.id).filter(Boolean)))];
  if (artistIds.length === 0) return [];

  const artists = await getArtists(token, artistIds);
  const genreMap: Record<string, number> = {};

  for (const artist of artists) {
    if (!artist?.genres?.length) continue;
    for (const g of artist.genres) {
      const normalized = g.charAt(0).toUpperCase() + g.slice(1);
      genreMap[normalized] = (genreMap[normalized] ?? 0) + 1;
    }
  }

  return Object.entries(genreMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
}

function renderGenreContent(
  loading: boolean,
  error: string | null,
  genreCounts: GenreCount[]
) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (error) {
    const isForbidden = /forbidden|403/i.test(error);
    return (
      <ErrorMessage
        message={error}
        hint={
          isForbidden
            ? "Your app may need extended access, or you may need to add yourself as a user in the Spotify Developer Dashboard (Settings → Users and Access)."
            : "Ensure you have listening history. Top tracks need data from the last 4+ weeks."
        }
        dashboardLink={isForbidden}
      />
    );
  }
  if (genreCounts.length === 0) {
    return (
      <p className="py-8 text-center text-zinc-500">
        No genre data available for your top artists.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="h-64 w-full lg:h-72 lg:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={genreCounts}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="80%"
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {genreCounts.map((g, i) => (
                <Cell key={g.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        {genreCounts.map((g, i) => (
          <div key={g.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-sm">{g.name}</span>
            <span className="text-zinc-500">({g.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TopGenres() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading, error } = useSpotifyFetch<GenreCount[]>(
    (token) => fetchGenreCounts(token, timeRange),
    [timeRange]
  );
  const genreCounts = data ?? [];

  return (
    <SectionCard
      title="Top Genres"
      headerAction={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {renderGenreContent(loading, error, genreCounts)}
    </SectionCard>
  );
}
