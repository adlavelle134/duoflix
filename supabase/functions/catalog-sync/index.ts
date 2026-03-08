const TMDB_KEY = Deno.env.get("NEXT_PUBLIC_TMDB_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W500 = "https://image.tmdb.org/t/p/w500";
const IMG_W780 = "https://image.tmdb.org/t/p/w780";

const PROVIDER_MAP: Record<number, string> = {
  8: "Netflix", 337: "Disney+", 350: "Apple TV+", 1899: "Max",
  15: "Hulu", 9: "Prime Video", 386: "Peacock", 531: "Paramount+", 283: "Crunchyroll",
};

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  53: "Thriller", 10752: "War", 37: "Western", 10765: "Sci-Fi & Fantasy",
  10759: "Action & Adventure", 10762: "Kids", 10764: "Reality",
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function tmdbGet(path: string): Promise<unknown> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${TMDB_KEY}`);
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

// PostgREST upsert — bypasses supabase-js entirely to avoid library issues in Deno
const REST_URL = `${SUPABASE_URL}/rest/v1/catalog?on_conflict=id`;
const REST_HEADERS = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  "apikey": SUPABASE_SERVICE_ROLE_KEY,
  "Prefer": "resolution=merge-duplicates,return=minimal",
};

async function upsertBatch(batch: unknown[]): Promise<string | null> {
  const res = await fetch(REST_URL, {
    method: "POST",
    headers: REST_HEADERS,
    body: JSON.stringify(batch),
  });
  if (!res.ok) return await res.text();
  return null;
}

Deno.serve(async (_req) => {
  try {

  const all: Array<{
    id: string; tmdb_id: number; type: string; title: string; year: string;
    overview: string; rating: string; poster: string | null; backdrop: string | null;
    genres: string[]; services: string[]; popularity: number;
  }> = [];
  const seen = new Set<string>();
  let errors = 0;

  // ── Fetch movies (500 pages × 20 = up to 10,000) ──
  for (let p = 1; p <= 500; p++) {
    try {
      const d = await tmdbGet(`/trending/movie/week?language=en-US&region=US&page=${p}`) as { results?: Array<{
        id: number; title?: string; release_date?: string; genre_ids?: number[];
        poster_path?: string; backdrop_path?: string; overview?: string;
        vote_average?: number; popularity?: number; original_language?: string;
      }>; total_pages?: number };
      if (!d.results?.length || p > (d.total_pages ?? 500)) break;
      for (const m of d.results) {
        if (m.original_language !== "en") continue;
        const key = `m${m.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push({
          id: key, tmdb_id: m.id, type: "movie",
          title: m.title ?? "", year: m.release_date?.slice(0, 4) ?? "",
          overview: m.overview ?? "",
          rating: m.vote_average?.toFixed(1) ?? "",
          poster: m.poster_path ? IMG_W500 + m.poster_path : null,
          backdrop: m.backdrop_path ? IMG_W780 + m.backdrop_path : null,
          genres: (m.genre_ids ?? []).map((g) => GENRE_MAP[g]).filter((x): x is string => !!x).slice(0, 3),
          services: [], popularity: m.popularity ?? 0,
        });
      }
    } catch (_e) { errors++; }
  }

  // ── Fetch TV shows (100 pages × 20 = up to 2,000) ──
  for (let p = 1; p <= 100; p++) {
    try {
      const d = await tmdbGet(`/trending/tv/week?language=en-US&region=US&page=${p}`) as { results?: Array<{
        id: number; name?: string; first_air_date?: string; genre_ids?: number[];
        poster_path?: string; backdrop_path?: string; overview?: string;
        vote_average?: number; popularity?: number; original_language?: string;
      }>; total_pages?: number };
      if (!d.results?.length || p > (d.total_pages ?? 100)) break;
      for (const t of d.results) {
        if (t.original_language !== "en") continue;
        const key = `t${t.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        all.push({
          id: key, tmdb_id: t.id, type: "tv",
          title: t.name ?? "", year: t.first_air_date?.slice(0, 4) ?? "",
          overview: t.overview ?? "",
          rating: t.vote_average?.toFixed(1) ?? "",
          poster: t.poster_path ? IMG_W500 + t.poster_path : null,
          backdrop: t.backdrop_path ? IMG_W780 + t.backdrop_path : null,
          genres: (t.genre_ids ?? []).map((g) => GENRE_MAP[g]).filter((x): x is string => !!x).slice(0, 3),
          services: [], popularity: t.popularity ?? 0,
        });
      }
    } catch (_e) { errors++; }
  }

  // ── Fetch watch providers in batches of 40 ──
  const BATCH_SIZE = 40;
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (item) => {
      try {
        const path = item.type === "movie"
          ? `/movie/${item.tmdb_id}/watch/providers`
          : `/tv/${item.tmdb_id}/watch/providers`;
        const d = await tmdbGet(path) as { results?: { US?: { flatrate?: Array<{ provider_id: number }> } } };
        item.services = (d.results?.US?.flatrate ?? [])
          .map((p) => PROVIDER_MAP[p.provider_id])
          .filter((x): x is string => !!x);
      } catch (_e) { errors++; }
    }));
    if (i + BATCH_SIZE < all.length) await delay(250);
  }

  // ── Upsert to Supabase via PostgREST in batches of 100 ──
  let inserted = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < all.length; i += 100) {
    const batch = all.slice(i, i + 100).map((item) => ({ ...item, last_updated: now }));
    try {
      const err = await upsertBatch(batch);
      if (err) { errors++; console.error("Upsert error:", err); }
      else { inserted += batch.length; }
    } catch (e) {
      errors++;
      console.error("Upsert exception:", e);
    }
  }

  return new Response(
    JSON.stringify({ inserted, total: all.length, errors }),
    { headers: { "Content-Type": "application/json" } },
  );
  } catch (e) {
    console.error("Handler error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
