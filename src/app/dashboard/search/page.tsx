"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSpotify } from "@/context/SpotifyContext";
import {
  buildTrackIndex,
  loadTrackIndex,
  saveTrackIndex,
  clearTrackIndex,
  type TrackIndex,
  type IndexProgress,
} from "@/lib/playlistIndex";
import {
  searchTracks,
  getTracksWithoutMetadataMatch,
  MATCH_REASON_LABELS,
  type SearchResult,
  type LyricsCache,
} from "@/lib/trackSearch";
import {
  loadLyricsCache,
  countLyricsCacheEntries,
  fetchLyricsForTracks,
} from "@/lib/lyricsCache";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SearchPage() {
  const { getValidToken } = useSpotify();
  const [index, setIndex] = useState<TrackIndex | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState<IndexProgress | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);
  const [skippedPlaylists, setSkippedPlaylists] = useState<string[]>([]);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [includeLyrics, setIncludeLyrics] = useState(false);
  const [lyricsCache, setLyricsCache] = useState<LyricsCache>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [lyricsSearching, setLyricsSearching] = useState(false);
  const [lyricsProgress, setLyricsProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const lyricsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const cached = loadTrackIndex();
    if (cached) setIndex(cached);
    setLyricsCache(loadLyricsCache());
  }, []);

  const handleBuildIndex = useCallback(
    async (force = false) => {
      if (force) clearTrackIndex();
      setIndexing(true);
      setIndexError(null);
      setSkippedPlaylists([]);
      setIndexProgress(null);
      try {
        const token = await getValidToken();
        if (!token) throw new Error("Not authenticated");
        const { index: built, skippedPlaylists: skipped } = await buildTrackIndex(
          token,
          setIndexProgress
        );
        saveTrackIndex(built);
        setIndex(built);
        setSkippedPlaylists(skipped);
      } catch (e) {
        setIndexError(e instanceof Error ? e.message : "Failed to build index");
      } finally {
        setIndexing(false);
        setIndexProgress(null);
      }
    },
    [getValidToken]
  );

  useEffect(() => {
    if (!index || !debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    const metaResults = searchTracks(index.tracks, debouncedQuery, {
      lyricsCache,
      includeLyrics,
    });
    setResults(metaResults);

    if (!includeLyrics) return;

    lyricsAbortRef.current?.abort();
    const controller = new AbortController();
    lyricsAbortRef.current = controller;

    const runLyricsSearch = async () => {
      const withoutMeta = getTracksWithoutMetadataMatch(index.tracks, debouncedQuery);
      if (withoutMeta.length === 0) return;

      setLyricsSearching(true);
      setLyricsProgress({ current: 0, total: withoutMeta.length });

      try {
        const updatedCache = await fetchLyricsForTracks(
          withoutMeta.map((item) => ({ id: item.track.id, track: item.track })),
          lyricsCache,
          (current, total) => setLyricsProgress({ current, total }),
          controller.signal
        );

        if (controller.signal.aborted) return;

        setLyricsCache(updatedCache);
        const allResults = searchTracks(index.tracks, debouncedQuery, {
          lyricsCache: updatedCache,
          includeLyrics: true,
        });
        setResults(allResults);
      } finally {
        if (!controller.signal.aborted) {
          setLyricsSearching(false);
          setLyricsProgress(null);
        }
      }
    };

    runLyricsSearch();

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lyricsCache updated inside effect
  }, [debouncedQuery, index, includeLyrics]);

  const cachedLyricsCount = countLyricsCacheEntries(lyricsCache);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Search Your Library</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Search across all tracks from your playlists and liked songs.
          </p>
        </div>
        {index && (
          <button
            type="button"
            onClick={() => handleBuildIndex(true)}
            disabled={indexing}
            className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            Refresh index
          </button>
        )}
      </div>

      {!index && !indexing && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="mb-4 text-zinc-400">
            Build an index of all tracks from your playlists and liked songs to enable search.
          </p>
          <button
            type="button"
            onClick={() => handleBuildIndex()}
            className="rounded-full bg-[#1db954] px-6 py-2.5 text-sm font-medium text-black hover:bg-[#1ed760]"
          >
            Build library index
          </button>
        </div>
      )}

      {indexing && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
          <LoadingSpinner />
          <p className="text-sm text-zinc-400">
            {indexProgress?.message ?? "Indexing…"}
          </p>
          {indexProgress?.total != null && indexProgress.current != null && (
            <div className="w-full max-w-md">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-[#1db954] transition-all"
                  style={{
                    width: `${(indexProgress.current / indexProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {indexError && <ErrorMessage message={indexError} />}

      {skippedPlaylists.length > 0 && (
        <p className="text-sm text-amber-500/90">
          Skipped {skippedPlaylists.length} playlist(s) you follow but do not own (Spotify API
          limit): {skippedPlaylists.slice(0, 3).join(", ")}
          {skippedPlaylists.length > 3 ? "…" : ""}
        </p>
      )}

      {index && !indexing && (
        <>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
            <span>{index.stats.uniqueTracks.toLocaleString()} unique tracks indexed</span>
            <span>{index.stats.playlistCount} playlists</span>
            <span>{cachedLyricsCount} lyrics cached</span>
            <span>
              Indexed {new Date(index.indexedAt).toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search e.g. "rain" or "deszcz"…'
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#1db954] focus:outline-none"
            />
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={includeLyrics}
                onChange={(e) => setIncludeLyrics(e.target.checked)}
                className="rounded border-zinc-600"
              />
              Also search in song lyrics (slower)
            </label>
          </div>

          {lyricsSearching && lyricsProgress && (
            <p className="text-sm text-zinc-400">
              Searching lyrics… {lyricsProgress.current}/{lyricsProgress.total}
            </p>
          )}

          {debouncedQuery.trim() && !lyricsSearching && results.length === 0 && (
            <p className="text-zinc-500">No matches for &ldquo;{debouncedQuery}&rdquo;</p>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-500">
                {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map(({ item, matchReason }) => (
                <SearchResultRow key={item.track.id} item={item} matchReason={matchReason} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SearchResultRow({
  item,
  matchReason,
}: {
  item: SearchResult["item"];
  matchReason: SearchResult["matchReason"];
}) {
  const { track, sources } = item;
  const playlistSources = sources.filter((s) => s.type === "playlist");
  const hasLiked = sources.some((s) => s.type === "liked");

  return (
    <div className="flex items-center gap-4 rounded-lg p-3 transition hover:bg-zinc-800/50">
      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded">
        {track.album.images[0] && (
          <Image src={track.album.images[0].url} alt="" fill className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:underline"
        >
          <p className="font-medium">{track.name}</p>
          <p className="text-sm text-zinc-400">
            {track.artists.map((a) => a.name).join(", ")}
          </p>
        </a>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#1db954]/20 px-2 py-0.5 text-xs text-[#1db954]">
            {MATCH_REASON_LABELS[matchReason]}
          </span>
          {hasLiked && (
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
              Liked Songs
            </span>
          )}
          {playlistSources.slice(0, 3).map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/playlists/${s.id}`}
              className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-600"
            >
              {s.name}
            </Link>
          ))}
          {playlistSources.length > 3 && (
            <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
              +{playlistSources.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
