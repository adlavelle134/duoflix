import { NextRequest } from "next/server";

const TMDB_KEY  = process.env.TMDB_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  if (!TMDB_KEY) {
    return Response.json({ error: "TMDB_KEY not configured" }, { status: 500 });
  }

  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return Response.json({ error: "Missing path parameter" }, { status: 400 });
  }

  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.delete("path");
  params.set("api_key", TMDB_KEY);

  try {
    const res = await fetch(`${TMDB_BASE}${path}?${params.toString()}`);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ error: "Failed to fetch from TMDB" }, { status: 502 });
  }
}
