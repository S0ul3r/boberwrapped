/**
 * Text search over indexed tracks with synonym expansion.
 */

import type { IndexedTrack } from "@/lib/playlistIndex";

export type MatchReason = "title" | "artist" | "album" | "playlist" | "lyrics";

export interface SearchResult {
  item: IndexedTrack;
  matchReason: MatchReason;
  score: number;
}

export interface LyricsCacheEntry {
  plainLyrics: string;
  fetchedAt: number;
}

export type LyricsCache = Record<string, LyricsCacheEntry>;

const REASON_SCORE: Record<MatchReason, number> = {
  title: 100,
  artist: 80,
  album: 60,
  playlist: 40,
  lyrics: 30,
};

/** Expandable synonym groups — query matches any term in the same group. */
const SYNONYM_GROUPS: string[][] = [
  ["rain", "rainy", "rains", "rainfall", "drizzle", "storm", "thunder", "lightning", "wet", "pouring"],
  ["deszcz", "deszczowy", "deszczu", "burza", "grzmot", "piorun", "mokry", "ulewa"],
  ["sun", "sunny", "sunshine", "sunlight"],
  ["słońce", "slonce", "słoneczny", "sloneczny", "słońca"],
  ["love", "loving", "loved", "heart", "hearts"],
  ["miłość", "milosc", "kocham", "serce"],
  ["night", "midnight", "darkness", "dark"],
  ["noc", "noca", "ciemność", "ciemnosc", "północ", "polnoc"],
  ["fire", "flame", "burn", "burning", "blaze"],
  ["ogień", "ogien", "płomień", "plomien", "pali"],
  ["water", "ocean", "sea", "river", "wave", "waves"],
  ["woda", "morze", "ocean", "rzeka", "fala"],
  ["snow", "snowy", "winter", "cold", "ice"],
  ["śnieg", "snieg", "zima", "zimowy", "lód", "lod"],
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

function expandQueryTerms(query: string): string[] {
  const normalized = normalize(query);
  if (!normalized) return [];

  const terms = new Set<string>([normalized]);

  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map(normalize);
    const hit = normalizedGroup.some(
      (term) => normalized.includes(term) || term.includes(normalized)
    );
    if (hit) {
      for (const term of normalizedGroup) terms.add(term);
    }
  }

  return Array.from(terms);
}

function textMatchesTerms(text: string, terms: string[]): boolean {
  const normalized = normalize(text);
  return terms.some((term) => normalized.includes(term));
}

function findMetadataMatch(
  item: IndexedTrack,
  terms: string[]
): MatchReason | null {
  if (textMatchesTerms(item.track.name, terms)) return "title";
  const artistNames = item.track.artists.map((a) => a.name).join(" ");
  if (textMatchesTerms(artistNames, terms)) return "artist";
  if (textMatchesTerms(item.track.album.name, terms)) return "album";
  for (const source of item.sources) {
    if (textMatchesTerms(source.name, terms)) return "playlist";
  }
  return null;
}

export function searchTracks(
  index: IndexedTrack[],
  query: string,
  options?: {
    lyricsCache?: LyricsCache;
    includeLyrics?: boolean;
  }
): SearchResult[] {
  const terms = expandQueryTerms(query);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const item of index) {
    const metaReason = findMetadataMatch(item, terms);
    if (metaReason) {
      results.push({
        item,
        matchReason: metaReason,
        score: REASON_SCORE[metaReason],
      });
      seen.add(item.track.id);
      continue;
    }

    if (options?.includeLyrics && options.lyricsCache) {
      const cached = options.lyricsCache[item.track.id];
      if (cached?.plainLyrics && textMatchesTerms(cached.plainLyrics, terms)) {
        results.push({
          item,
          matchReason: "lyrics",
          score: REASON_SCORE.lyrics,
        });
        seen.add(item.track.id);
      }
    }
  }

  results.sort((a, b) => b.score - a.score || a.item.track.name.localeCompare(b.item.track.name));
  return results;
}

export function getTracksWithoutMetadataMatch(
  index: IndexedTrack[],
  query: string
): IndexedTrack[] {
  const terms = expandQueryTerms(query);
  if (terms.length === 0) return [];
  return index.filter((item) => !findMetadataMatch(item, terms));
}

export const MATCH_REASON_LABELS: Record<MatchReason, string> = {
  title: "Matched in title",
  artist: "Matched in artist",
  album: "Matched in album",
  playlist: "Matched in playlist",
  lyrics: "Matched in lyrics",
};
