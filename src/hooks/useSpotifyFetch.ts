"use client";

import { useEffect, useState } from "react";
import { useSpotify } from "@/context/SpotifyContext";

interface UseSpotifyFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching Spotify API data with token handling.
 * Single Responsibility: encapsulates the fetch + token + loading/error pattern.
 * @param fetcher - Async function that receives token and returns data
 * @param deps - Dependencies that trigger refetch when changed (e.g. [timeRange])
 */
export function useSpotifyFetch<T>(
  fetcher: (token: string) => Promise<T>,
  deps: unknown[] = []
): UseSpotifyFetchState<T> {
  const { getValidToken } = useSpotify();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getValidToken()
      .then(async (token) => {
        if (!token || cancelled) return null;
        return fetcher(token);
      })
      .then((result) => {
        if (!cancelled && result !== null) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getValidToken, ...deps]);

  return { data, loading, error };
}
