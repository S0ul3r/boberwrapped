"use client";

import TopArtists from "@/components/TopArtists";
import TopTracks from "@/components/TopTracks";
import TopGenres from "@/components/TopGenres";
import AudioFeaturesChart from "@/components/AudioFeaturesChart";
import RecentlyPlayed from "@/components/RecentlyPlayed";
import CurrentlyPlaying from "@/components/CurrentlyPlaying";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <CurrentlyPlaying />
      <div className="grid gap-8 lg:grid-cols-2">
        <TopArtists />
        <TopTracks />
      </div>
      <TopGenres />
      <AudioFeaturesChart />
      <RecentlyPlayed />
    </div>
  );
}
