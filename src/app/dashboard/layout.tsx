"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/spotify";
import { useSpotify } from "@/context/SpotifyContext";
import type { SpotifyUser } from "@/lib/spotify";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { getValidToken, isAuthenticated } = useSpotify();
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    getValidToken()
      .then((token) => {
        if (!token) {
          router.replace("/login");
          return;
        }
        return getProfile(token);
      })
      .then((u) => u && setUser(u))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [getValidToken, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1db954] border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-8">
        <p className="mb-4 text-red-400">{error || "Failed to load profile"}</p>
        <a href="/login" className="text-[#1db954] hover:underline">
          Try again
        </a>
      </div>
    );
  }

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
