const TMDB_KEY = Deno.env.get("NEXT_PUBLIC_TMDB_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W500 = "https://image.tmdb.org/t/p/w500";
const IMG_W780 = "https://image.tmdb.org/t/p/w780";
const IMG_W185 = "https://image.tmdb.org/t/p/w185";

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

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const moviePages = Math.max(1, parseInt(url.searchParams.get("movie_pages") ?? "5"));
    const tvPages    = Math.max(0, parseInt(url.searchParams.get("tv_pages")    ?? "2"));
    const mode       = url.searchParams.get("mode") ?? "fetch_only"; // fetch_only | full

    const totalStart = Date.now();
    let errors = 0;

    // ── Phase 1: TMDB fetch ──────────────────────────────────────────────────
    const fetchStart = Date.now();
    const all: Array<{
      id: string; tmdb_id: number; type: string; title: string; year: string;
      overview: string; rating: string; poster: string | null; backdrop: string | null;
      genres: string[]; services: string[]; popularity: number;
      release_date: string;
      trailer_url: string | null;
      cast_members: Array<{ name: string; character: string; profile_path: string | null }>;
    }> = [];
    const seen = new Set<string>();

    for (let p = 1; p <= moviePages; p++) {
      try {
        const d = await tmdbGet(`/trending/movie/week?language=en-US&region=US&page=${p}`) as {
          results?: Array<{
            id: number; title?: string; release_date?: string; genre_ids?: number[];
            poster_path?: string; backdrop_path?: string; overview?: string;
            vote_average?: number; popularity?: number; original_language?: string;
          }>; total_pages?: number;
        };
        if (!d.results?.length || p > (d.total_pages ?? moviePages)) break;
        for (const m of d.results) {
          if (m.original_language !== "en") continue;
          const key = `m${m.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          all.push({
            id: key, tmdb_id: m.id, type: "movie",
            title: m.title ?? "", year: m.release_date ?? "",
            overview: m.overview ?? "",
            rating: m.vote_average?.toFixed(1) ?? "",
            poster: m.poster_path ? IMG_W500 + m.poster_path : null,
            backdrop: m.backdrop_path ? IMG_W780 + m.backdrop_path : null,
            genres: (m.genre_ids ?? []).map((g) => GENRE_MAP[g]).filter((x): x is string => !!x).slice(0, 3),
            services: [], popularity: m.popularity ?? 0,
            release_date: m.release_date ?? "",
            trailer_url: null,
            cast_members: [],
          });
        }
      } catch (_e) { errors++; }
    }

    for (let p = 1; p <= tvPages; p++) {
      try {
        const d = await tmdbGet(`/trending/tv/week?language=en-US&region=US&page=${p}`) as {
          results?: Array<{
            id: number; name?: string; first_air_date?: string; genre_ids?: number[];
            poster_path?: string; backdrop_path?: string; overview?: string;
            vote_average?: number; popularity?: number; original_language?: string;
          }>; total_pages?: number;
        };
        if (!d.results?.length || p > (d.total_pages ?? tvPages)) break;
        for (const t of d.results) {
          if (t.original_language !== "en") continue;
          const key = `t${t.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          all.push({
            id: key, tmdb_id: t.id, type: "tv",
            title: t.name ?? "", year: t.first_air_date ?? "",
            overview: t.overview ?? "",
            rating: t.vote_average?.toFixed(1) ?? "",
            poster: t.poster_path ? IMG_W500 + t.poster_path : null,
            backdrop: t.backdrop_path ? IMG_W780 + t.backdrop_path : null,
            genres: (t.genre_ids ?? []).map((g) => GENRE_MAP[g]).filter((x): x is string => !!x).slice(0, 3),
            services: [], popularity: t.popularity ?? 0,
            release_date: t.first_air_date ?? "",
            trailer_url: null,
            cast_members: [],
          });
        }
      } catch (_e) { errors++; }
    }

    const fetchDuration = Date.now() - fetchStart;

    // fetch_only mode — stop here
    if (mode === "fetch_only") {
      return new Response(JSON.stringify({
        mode,
        movie_pages: moviePages,
        tv_pages: tvPages,
        titles_fetched: all.length,
        fetch_duration_ms: fetchDuration,
        provider_duration_ms: null,
        trailer_duration_ms: null,
        cast_duration_ms: null,
        upsert_duration_ms: null,
        total_duration_ms: Date.now() - totalStart,
        errors,
      }), { headers: { "Content-Type": "application/json" } });
    }

    // ── Phase 2: Provider + Trailer + Cast (parallel per title) ─────────────
    const BATCH_SIZE = 20;
    let providerMs = 0, trailerMs = 0, castMs = 0;
    for (let i = 0; i < all.length; i += BATCH_SIZE) {
      const batch = all.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (item) => {
        await Promise.all([
          // Provider
          (async () => {
            const t0 = Date.now();
            try {
              const path = item.type === "movie"
                ? `/movie/${item.tmdb_id}/watch/providers`
                : `/tv/${item.tmdb_id}/watch/providers`;
              const d = await tmdbGet(path) as { results?: { US?: { flatrate?: Array<{ provider_id: number }> } } };
              item.services = (d.results?.US?.flatrate ?? [])
                .map((p) => PROVIDER_MAP[p.provider_id])
                .filter((x): x is string => !!x);
            } catch (_e) { errors++; }
            providerMs += Date.now() - t0;
          })(),
          // Trailer
          (async () => {
            const t0 = Date.now();
            try {
              const path = item.type === "movie"
                ? `/movie/${item.tmdb_id}/videos`
                : `/tv/${item.tmdb_id}/videos`;
              const d = await tmdbGet(path) as { results?: Array<{ type: string; site: string; key: string }> };
              const trailer = (d.results ?? []).find(v => v.type === "Trailer" && v.site === "YouTube");
              item.trailer_url = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
            } catch (_e) { errors++; }
            trailerMs += Date.now() - t0;
          })(),
          // Cast
          (async () => {
            const t0 = Date.now();
            try {
              const path = item.type === "movie"
                ? `/movie/${item.tmdb_id}/credits`
                : `/tv/${item.tmdb_id}/credits`;
              const d = await tmdbGet(path) as { cast?: Array<{ name: string; character: string; profile_path: string | null }> };
              item.cast_members = (d.cast ?? []).slice(0, 5).map(c => ({
                name: c.name,
                character: c.character,
                profile_path: c.profile_path ? IMG_W185 + c.profile_path : null,
              }));
            } catch (_e) { errors++; }
            castMs += Date.now() - t0;
          })(),
        ]);
      }));
      if (i + BATCH_SIZE < all.length) await delay(500);
    }
    const providerDuration = providerMs;
    const trailerDuration = trailerMs;
    const castDuration = castMs;

    // ── Phase 5: Upsert ──────────────────────────────────────────────────────
    const upsertStart = Date.now();
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
    const upsertDuration = Date.now() - upsertStart;

    return new Response(JSON.stringify({
      mode,
      movie_pages: moviePages,
      tv_pages: tvPages,
      titles_fetched: all.length,
      inserted,
      fetch_duration_ms: fetchDuration,
      provider_duration_ms: providerDuration,
      trailer_duration_ms: trailerDuration,
      cast_duration_ms: castDuration,
      upsert_duration_ms: upsertDuration,
      total_duration_ms: Date.now() - totalStart,
      errors,
    }), { headers: { "Content-Type": "application/json" } });

  } catch (e) {
    console.error("Handler error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
