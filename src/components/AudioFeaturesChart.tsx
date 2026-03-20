"use client";

import { useState } from "react";
import {
  getTopTracks,
  getAudioFeatures,
  type TimeRange,
  type AudioFeatures,
} from "@/lib/spotify";
import { useSpotifyFetch } from "@/hooks/useSpotifyFetch";
import TimeRangeSelector from "./TimeRangeSelector";
import SectionCard from "./ui/SectionCard";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorMessage from "./ui/ErrorMessage";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const FEATURE_KEYS: (keyof AudioFeatures)[] = [
  "danceability",
  "energy",
  "valence",
  "acousticness",
  "instrumentalness",
];

const FEATURE_LABELS: Record<string, string> = {
  danceability: "Danceability",
  energy: "Energy",
  valence: "Valence",
  acousticness: "Acousticness",
  instrumentalness: "Instrumental",
};

interface ChartDataPoint {
  subject: string;
  value: number;
  fullMark: number;
}

async function fetchAudioFeaturesData(
  token: string,
  timeRange: TimeRange
): Promise<ChartDataPoint[]> {
  const tracks = await getTopTracks(token, timeRange, 50);
  const ids = tracks.map((t) => t.id).filter(Boolean);
  const features = await getAudioFeatures(token, ids);

  if (features.length === 0) return [];

  const sums: Record<string, number> = {};
  for (const k of FEATURE_KEYS) sums[k] = 0;
  for (const f of features) {
    for (const k of FEATURE_KEYS) {
      const v = (f as AudioFeatures)[k];
      if (typeof v === "number") sums[k] += v;
    }
  }
  const count = features.length;
  return FEATURE_KEYS.map((k) => ({
    subject: FEATURE_LABELS[k] ?? k,
    value: Math.round((sums[k] / count) * 100) / 100,
    fullMark: 1,
  }));
}

export default function AudioFeaturesChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
  const { data, loading, error } = useSpotifyFetch<ChartDataPoint[]>(
    (token) => fetchAudioFeaturesData(token, timeRange),
    [timeRange]
  );

  return (
    <SectionCard
      title="Audio Features (Mood Profile)"
      headerAction={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage
          message={error}
          hint="Audio features are restricted for new Spotify apps (since Nov 2024)."
          dashboardLink
        />
      ) : (data ?? []).length === 0 ? (
        <p className="py-8 text-center text-zinc-500">
          No audio features available.
        </p>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data ?? []}>
              <PolarGrid stroke="#404040" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#a3a3a3", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 1]}
                tick={{ fill: "#737373" }}
              />
              <Radar
                name="Avg"
                dataKey="value"
                stroke="#1db954"
                fill="#1db954"
                fillOpacity={0.4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#171717",
                  border: "1px solid #404040",
                  borderRadius: "8px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}
