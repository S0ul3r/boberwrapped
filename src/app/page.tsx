"use client";

import Link from "next/link";
import { useSpotify } from "@/context/SpotifyContext";

export default function Home() {
  const { isAuthenticated } = useSpotify();

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-8">
        <h1 className="mb-6 text-4xl font-bold text-white">Boberwrapped</h1>
        <p className="mb-8 text-zinc-400">
          Your Spotify listening stats, wrapped.
        </p>
        <Link
          href="/dashboard"
          className="rounded-full bg-[#1db954] px-8 py-3 font-semibold text-black transition hover:bg-[#1ed760]"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-8">
      <h1 className="mb-6 text-4xl font-bold text-white">Boberwrapped</h1>
      <p className="mb-8 max-w-md text-center text-zinc-400">
        Discover your listening habits. Top artists, tracks, genres, and more —
        all from your Spotify account.
      </p>
      <Link
        href="/login"
        className="rounded-full bg-[#1db954] px-8 py-3 font-semibold text-black transition hover:bg-[#1ed760]"
      >
        Log in with Spotify
      </Link>
    </div>
  );
}
