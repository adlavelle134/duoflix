"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

// ─── TMDB CONFIG ──────────────────────────────────────────────────────────────
const IMG_W500  = "https://image.tmdb.org/t/p/w500";
const IMG_W300  = "https://image.tmdb.org/t/p/w300";

const GENRE_MAP = {
  28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",
  99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",
  27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",
  53:"Thriller",10752:"War",37:"Western",10765:"Sci-Fi & Fantasy",
  10759:"Action & Adventure",10762:"Kids",10764:"Reality",
};
const PROVIDER_MAP = {
  8:"Netflix",337:"Disney+",350:"Apple TV+",1899:"Max",
  15:"Hulu",9:"Prime Video",386:"Peacock",531:"Paramount+",283:"Crunchyroll",
};
const ALL_SERVICES = ["Netflix","Disney+","Apple TV+","Max","Prime Video","Hulu","Peacock","Paramount+","Crunchyroll"];
const SERVICE_COLORS = {
  "Netflix":"#E50914","Disney+":"#113CCF","Apple TV+":"#4a4a4a",
  "Max":"#002BE7","Prime Video":"#00A8E1","Hulu":"#1CE783",
  "Peacock":"#F037A5","Paramount+":"#0064FF","Crunchyroll":"#F47521",
};
// No mock users — real users loaded from Supabase

const FALLBACK_CATALOG = [
  {id:"m872585",tmdbId:872585,type:"movie",title:"Oppenheimer",year:"2023",genres:["Drama","History"],poster:"https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",backdrop:"https://image.tmdb.org/t/p/w780/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",overview:"The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.",rating:"8.1",services:["Netflix"]},
  {id:"m346698",tmdbId:346698,type:"movie",title:"Barbie",year:"2023",genres:["Comedy","Fantasy"],poster:"https://image.tmdb.org/t/p/w500/iuFNMS8vlbzFAqarika1a1Sb1OC.jpg",backdrop:"https://image.tmdb.org/t/p/w780/nHf61UzkfFno5X1ofIhugCPus2R.jpg",overview:"Barbie and Ken are having the time of their lives in the colorful world of Barbie Land.",rating:"7.0",services:["Netflix","Max"]},
  {id:"m693134",tmdbId:693134,type:"movie",title:"Dune: Part Two",year:"2024",genres:["Sci-Fi","Action"],poster:"https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",backdrop:"https://image.tmdb.org/t/p/w780/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",overview:"Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen.",rating:"8.5",services:["Max"]},
  {id:"m792307",tmdbId:792307,type:"movie",title:"Poor Things",year:"2023",genres:["Drama","Fantasy"],poster:"https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXs0OSwzUzPJAFf.jpg",backdrop:"https://image.tmdb.org/t/p/w780/bQXAqRx2Fgc46uCVWgoPz5L5Dtr.jpg",overview:"The incredible tale of Bella Baxter, a young woman brought back to life by the brilliant Dr. Baxter.",rating:"8.0",services:["Disney+"]},
  {id:"t136315",tmdbId:136315,type:"tv",title:"The Bear",year:"2022",genres:["Drama","Comedy"],poster:"https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg",backdrop:"https://image.tmdb.org/t/p/w780/qJeU7KM4nT2C1WpOrwPcSDGFUWE.jpg",overview:"A young chef from the fine dining world returns to Chicago to run his family sandwich shop.",rating:"8.6",services:["Disney+","Hulu"]},
  {id:"t79680",tmdbId:79680,type:"tv",title:"Succession",year:"2018",genres:["Drama","Thriller"],poster:"https://image.tmdb.org/t/p/w500/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg",backdrop:"https://image.tmdb.org/t/p/w780/kqPhPDekMFAvFCYRJAqWkxgqtKQ.jpg",overview:"The Roy family controls one of the biggest media and entertainment conglomerates in the world.",rating:"8.8",services:["Max"]},
  {id:"t100088",tmdbId:100088,type:"tv",title:"The Last of Us",year:"2023",genres:["Drama","Action"],poster:"https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",backdrop:"https://image.tmdb.org/t/p/w780/uDgy6hyPd82kOHh6I95iiG9BGDB.jpg",overview:"Joel is hired to smuggle Ellie out of an oppressive quarantine zone.",rating:"8.8",services:["Max"]},
  {id:"m677179",tmdbId:677179,type:"movie",title:"Killers of the Flower Moon",year:"2023",genres:["Crime","History"],poster:"https://image.tmdb.org/t/p/w500/dB6jVMOgAFiH0tPlUJC9b8gWEMc.jpg",backdrop:"https://image.tmdb.org/t/p/w780/1X7vow16X7CnCoexXh4H4F2yDJv.jpg",overview:"Members of the Osage tribe are murdered under mysterious circumstances in 1920s Oklahoma.",rating:"7.7",services:["Apple TV+"]},
  {id:"t99966",tmdbId:99966,type:"tv",title:"Severance",year:"2022",genres:["Thriller","Sci-Fi"],poster:"https://image.tmdb.org/t/p/w500/lT8mz3LpI7Lv5xrpQT8ib2OOQhJ.jpg",backdrop:"https://image.tmdb.org/t/p/w780/3GfDNQBwHbGkTnPVNVB4D2cL1WT.jpg",overview:"Office workers whose memories have been surgically divided between work and personal lives.",rating:"8.7",services:["Apple TV+"]},
  {id:"t97546",tmdbId:97546,type:"tv",title:"Ted Lasso",year:"2020",genres:["Comedy","Drama"],poster:"https://image.tmdb.org/t/p/w500/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg",backdrop:"https://image.tmdb.org/t/p/w780/gBHarBFNryHJbCXLHOQ7JVGfyRO.jpg",overview:"An American college football coach is hired to manage an English soccer team.",rating:"8.8",services:["Apple TV+"]},
  {id:"t119051",tmdbId:119051,type:"tv",title:"Wednesday",year:"2022",genres:["Comedy","Horror"],poster:"https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",backdrop:"https://image.tmdb.org/t/p/w780/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg",overview:"Wednesday Addams investigates a murder spree while at Nevermore Academy.",rating:"8.1",services:["Netflix"]},
  {id:"t93405",tmdbId:93405,type:"tv",title:"Squid Game",year:"2021",genres:["Thriller","Drama"],poster:"https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",backdrop:"https://image.tmdb.org/t/p/w780/oaGvjB0DvdhXhOAuADfHb261ZHa.jpg",overview:"Cash-strapped players compete in children's games for a massive prize.",rating:"8.0",services:["Netflix"]},
  {id:"t66732",tmdbId:66732,type:"tv",title:"Stranger Things",year:"2016",genres:["Sci-Fi","Horror"],poster:"https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",backdrop:"https://image.tmdb.org/t/p/w780/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",overview:"A young boy vanishes and a small town uncovers a mystery involving secret experiments.",rating:"8.7",services:["Netflix"]},
  {id:"t94997",tmdbId:94997,type:"tv",title:"House of the Dragon",year:"2022",genres:["Fantasy","Drama"],poster:"https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",backdrop:"https://image.tmdb.org/t/p/w780/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg",overview:"The story of House Targaryen set 200 years before the events of Game of Thrones.",rating:"8.4",services:["Max"]},
  {id:"t82856",tmdbId:82856,type:"tv",title:"The Mandalorian",year:"2019",genres:["Sci-Fi","Action"],poster:"https://image.tmdb.org/t/p/w500/sWgBv7LV2PRoQgkxwlibdGXKz1S.jpg",backdrop:"https://image.tmdb.org/t/p/w780/9ijMGlJKqcslswWUzTEwTy2By9w.jpg",overview:"A lone gunfighter makes his way through the lawless galaxy after the fall of the Empire.",rating:"8.6",services:["Disney+"]},
  {id:"t76479",tmdbId:76479,type:"tv",title:"The Boys",year:"2019",genres:["Action","Comedy"],poster:"https://image.tmdb.org/t/p/w500/stTEycfG9928HYGEISBFaG1ngjM.jpg",backdrop:"https://image.tmdb.org/t/p/w780/mGVrXeIjyecj6TKmwPVpHlscEmw.jpg",overview:"Vigilantes set out to take down corrupt superheroes who abuse their powers.",rating:"8.7",services:["Prime Video"]},
  {id:"t116954",tmdbId:116954,type:"tv",title:"Fallout",year:"2024",genres:["Sci-Fi","Action"],poster:"https://image.tmdb.org/t/p/w500/AnsSKR4fvKGGqT79oAJihhEi1tq.jpg",backdrop:"https://image.tmdb.org/t/p/w780/oizNPTT8BZHToRRoAWFBuHKKRDA.jpg",overview:"Survivors emerge from underground vaults in a post-nuclear-war future.",rating:"8.5",services:["Prime Video"]},
  {id:"m545611",tmdbId:545611,type:"movie",title:"Everything Everywhere All at Once",year:"2022",genres:["Sci-Fi","Comedy"],poster:"https://image.tmdb.org/t/p/w500/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",backdrop:"https://image.tmdb.org/t/p/w780/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg",overview:"An aging Chinese immigrant is swept up in an insane adventure in which she alone can save the world.",rating:"7.9",services:["Netflix"]},
  {id:"m795306",tmdbId:795306,type:"movie",title:"Saltburn",year:"2023",genres:["Drama","Thriller"],poster:"https://image.tmdb.org/t/p/w500/qjhahNLSZ705B5JP92YMEYPocPz.jpg",backdrop:"https://image.tmdb.org/t/p/w780/fKFGLvTHRNOCT1e2bEDSAMrr9oQ.jpg",overview:"A student at Oxford is drawn into the world of a charming aristocratic classmate.",rating:"7.3",services:["Prime Video"]},
  {id:"m940721",tmdbId:940721,type:"movie",title:"Godzilla Minus One",year:"2023",genres:["Action","Sci-Fi"],poster:"https://image.tmdb.org/t/p/w500/hkxxMIGaiCTmrEArK7J56iorjQi.jpg",backdrop:"https://image.tmdb.org/t/p/w780/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",overview:"Postwar Japan is at its lowest when a new crisis emerges in the form of a giant monster.",rating:"7.9",services:["Netflix"]},
  {id:"m361743",tmdbId:361743,type:"movie",title:"Top Gun: Maverick",year:"2022",genres:["Action","Drama"],poster:"https://image.tmdb.org/t/p/w500/62HCnUTHOSF3AdrB9GH0Mp5t1K6.jpg",backdrop:"https://image.tmdb.org/t/p/w780/AkB4w9DyBs4Msc8DMaFGPYYp8RT.jpg",overview:"After 30 years, Maverick is called to train a group of Top Gun graduates for a special mission.",rating:"8.3",services:["Netflix","Paramount+"]},
  {id:"m447365",tmdbId:447365,type:"movie",title:"Guardians of the Galaxy Vol. 3",year:"2023",genres:["Action","Comedy"],poster:"https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",backdrop:"https://image.tmdb.org/t/p/w780/5YZbUmjbMa3ClvSW1Wj3D6XGkVA.jpg",overview:"The Guardians set out on a mission to protect one of their own.",rating:"8.0",services:["Disney+"]},
  {id:"m315162",tmdbId:315162,type:"movie",title:"Puss in Boots: The Last Wish",year:"2022",genres:["Animation","Comedy"],poster:"https://image.tmdb.org/t/p/w500/kuf6dutpsT0vSVehic3EZIqkOBt.jpg",backdrop:"https://image.tmdb.org/t/p/w780/1hLULrDOGDnIKyDxaLCkiHEbKFE.jpg",overview:"Puss in Boots discovers he has burned through eight of his nine lives.",rating:"8.3",services:["Netflix"]},
  {id:"t105971",tmdbId:105971,type:"tv",title:"The White Lotus",year:"2021",genres:["Drama","Mystery"],poster:"https://image.tmdb.org/t/p/w500/lO4nFZ5zXRrEJLrgjfxFf83vTF1.jpg",backdrop:"https://image.tmdb.org/t/p/w780/q0gFHHQgXKo5G8UFbHBKUGQmMo7.jpg",overview:"A social satire set at an exclusive Hawaiian resort over the course of a week.",rating:"7.9",services:["Max"]},
  {id:"t114461",tmdbId:114461,type:"tv",title:"Hacks",year:"2021",genres:["Comedy","Drama"],poster:"https://image.tmdb.org/t/p/w500/3O4TcHjGqDIGMPcLhFMSFgGM2IV.jpg",backdrop:"https://image.tmdb.org/t/p/w780/eJ4O6RFlRwf8HEatLhDHjDlAOhN.jpg",overview:"An aging comedian and a young comedy writer form an unlikely bond.",rating:"8.2",services:["Max"]},
];

// ─── TMDB CATALOG FETCHER ────────────────────────────────────────────────────
async function tryFetchLiveCatalog(onProgress) {
  try {
    const test = await fetch(`/api/tmdb?path=/trending/movie/week&language=en-US&region=US&page=1`);
    if (!test.ok) return null;
    const testData = await test.json();
    if (!testData.results?.length) return null;

    const all = [], seen = new Set();

    for (let p = 1; p <= 50; p++) {
      try {
        const r = await fetch(`/api/tmdb?path=/trending/movie/week&language=en-US&region=US&page=${p}`);
        const d = await r.json();
        if (!d.results?.length) break;
        for (const m of (d.results||[])) {
          if (seen.has(`m${m.id}`)) continue;
          seen.add(`m${m.id}`);
          all.push({ id:`m${m.id}`,tmdbId:m.id,type:"movie",title:m.title,year:m.release_date?.slice(0,4)||"",genres:(m.genre_ids||[]).map(g=>GENRE_MAP[g]).filter(Boolean).slice(0,3),poster:m.poster_path?IMG_W500+m.poster_path:null,backdrop:m.backdrop_path?IMG_W300+m.backdrop_path:null,overview:m.overview||"",rating:m.vote_average?.toFixed(1)||"",popularity:m.popularity||0,language:m.original_language||"en",services:[] });
        }
        if (p%5===0) onProgress(Math.round((p/50)*50));
      } catch(e){}
    }
    for (let p = 1; p <= 10; p++) {
      try {
        const r = await fetch(`/api/tmdb?path=/trending/tv/week&language=en-US&region=US&page=${p}`);
        const d = await r.json();
        if (!d.results?.length) break;
        for (const t of (d.results||[])) {
          if (seen.has(`t${t.id}`)) continue;
          seen.add(`t${t.id}`);
          all.push({ id:`t${t.id}`,tmdbId:t.id,type:"tv",title:t.name,year:t.first_air_date?.slice(0,4)||"",genres:(t.genre_ids||[]).map(g=>GENRE_MAP[g]).filter(Boolean).slice(0,3),poster:t.poster_path?IMG_W500+t.poster_path:null,backdrop:t.backdrop_path?IMG_W300+t.backdrop_path:null,overview:t.overview||"",rating:t.vote_average?.toFixed(1)||"",popularity:t.popularity||0,language:t.original_language||"en",services:[] });
        }
      } catch(e){}
    }

    // Keep only English language titles
    const titles = all.filter(t => t.language === "en");

    onProgress(65);
    const BATCH_SIZE = 40;
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < titles.length; i += BATCH_SIZE) {
      const batch = titles.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (t) => {
        try {
          const path = t.type === "movie"
            ? `/movie/${t.tmdbId}/watch/providers`
            : `/tv/${t.tmdbId}/watch/providers`;
          const r = await fetch(`/api/tmdb?path=${path}`);
          if (!r.ok) return;
          const d = await r.json();
          t.services = (d.results?.US?.flatrate||[])
            .map(p=>PROVIDER_MAP[p.provider_id])
            .filter(Boolean)
            .filter(s=>ALL_SERVICES.includes(s));
        } catch(e){}
      }));
      if (i + BATCH_SIZE < titles.length) await delay(250);
      onProgress(Math.min(95, 65 + Math.round(((i + BATCH_SIZE) / titles.length) * 30)));
    }

    // Assign a fallback service to titles with no provider data
    const cycle = ["Netflix","Disney+","Max","Prime Video","Hulu","Apple TV+","Crunchyroll"];
    let ci = 0;
    for (const t of titles) {
      if (!t.services.length) { t.services=[cycle[ci%cycle.length]]; ci++; }
    }

    onProgress(100);
    return titles;
  } catch(e) { return null; }
}

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

async function upsertProfile(userId, name, services) {
  const { error } = await supabase.from("profiles").upsert({ id: userId, name, services });
  return error;
}

async function saveRoomToDB(room, userId) {
  const { error } = await supabase.from("rooms").upsert({
    id: room.id,
    owner_id: userId,
    partner_id: room.partner.id,
    partner_name: room.partner.name,
    partner_avatar: room.partner.avatar || "😊",
    partner_services: room.partner.services,
    shared_services: room.sharedServices,
    queue_ids: room.queue.slice(0,200).map((t)=>t.id),
    content_type: room.contentType || "both",
    genres: room.genres || [],
    watched_ids: room.watchedIds || [],
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("saveRoomToDB error:", error);
  return !error;
}

// Load all swipes for a room — returns { [userId]: { [titleId]: direction } }
async function loadSwipesForRoom(roomId) {
  try {
    const { data } = await supabase.from("swipes").select("*").eq("room_id", roomId);
    const byUser = {};
    for (const s of (data||[])) {
      if (!byUser[s.user_id]) byUser[s.user_id] = {};
      byUser[s.user_id][s.title_id] = s.direction;
    }
    return byUser;
  } catch(e) { return {}; }
}

async function loadRoomsFromDB(userId, catalog) {
  try {
    const map = Object.fromEntries(catalog.map((t)=>[t.id,t]));

    // Load rooms where user is owner OR partner
    const { data: owned } = await supabase.from("rooms").select("*").eq("owner_id", userId);
    const { data: partnered } = await supabase.from("rooms").select("*").eq("partner_id", userId);

    // Merge and deduplicate
    const seen = new Set();
    const allRooms = [...(owned||[]), ...(partnered||[])].filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    if (!allRooms.length) return [];

    // Batch load all swipes for all rooms in a single query
    const roomIds = allRooms.map(r => r.id);
    const { data: allSwipesData } = await supabase.from("swipes").select("*").in("room_id", roomIds);
    const swipesByRoom = {};
    for (const s of (allSwipesData || [])) {
      if (!swipesByRoom[s.room_id]) swipesByRoom[s.room_id] = {};
      if (!swipesByRoom[s.room_id][s.user_id]) swipesByRoom[s.room_id][s.user_id] = {};
      swipesByRoom[s.room_id][s.user_id][s.title_id] = s.direction;
    }

    // Batch load owner profiles for rooms where the current user is the partner
    const ownerIds = [...new Set(allRooms.filter(r => r.owner_id !== userId).map(r => r.owner_id))];
    let ownerProfiles = {};
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", ownerIds);
      ownerProfiles = Object.fromEntries((profiles||[]).map(p => [p.id, p]));
    }

    const rooms = allRooms.map((r) => {
      const swipesByUser = swipesByRoom[r.id] || {};
      const mySwipes = swipesByUser[userId] || {};
      const partnerId = r.owner_id === userId ? r.partner_id : r.owner_id;
      const partnerSwipes = swipesByUser[partnerId] || {};

      const queue = (r.queue_ids||[]).map(id=>map[id]).filter(Boolean);
      const matches = queue.filter(t => mySwipes[t.id]==="like" && partnerSwipes[t.id]==="like");

      let partnerInfo;
      if (r.owner_id === userId) {
        partnerInfo = { id: r.partner_id, name: r.partner_name, avatar: r.partner_avatar, services: r.partner_services||[] };
      } else {
        const ownerProfile = ownerProfiles[r.owner_id];
        partnerInfo = { id: r.owner_id, name: ownerProfile?.name||"Unknown", avatar: "😊", services: ownerProfile?.services||[] };
      }

      return {
        id: r.id,
        partner: partnerInfo,
        sharedServices: r.shared_services||[],
        queue,
        userSwipes: mySwipes,
        partnerSwipes,
        matches,
        contentType: r.content_type || "both",
        genres: r.genres || [],
        watchedIds: r.watched_ids || [],
      };
    });

    return rooms;
  } catch(e) {
    console.error("loadRoomsFromDB error:", e);
    return [];
  }
}

// ─── NOTIFICATION HELPERS ────────────────────────────────────────────────────
async function sendNotification(userId, type, message, roomId) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      message,
      room_id: roomId,
      read: false,
    });
  } catch(e) { console.error("sendNotification error:", e); }
}

async function loadNotifications(userId) {
  try {
    const { data } = await supabase.from("notifications")
      .select("*").eq("user_id", userId).eq("read", false)
      .order("created_at", { ascending: false }).limit(20);
    return data || [];
  } catch(e) { return []; }
}

async function markNotificationsRead(userId) {
  try {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
  } catch(e) {}
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function DuoFlix() {
  const [screen, setScreen]       = useState("loading");
  const [authUser, setAuthUser]   = useState(null);
  const [profile, setProfile]     = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms]         = useState([]);
  const [catalog, setCatalog]     = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [catalogReady, setCatalogReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // 1. Check Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setScreen(session?.user ? "loadingProfile" : "auth");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      if (!session?.user) { setProfile(null); setScreen("auth"); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // 2. Load catalog — use localStorage cache if fresh (6h TTL), otherwise fetch
  useEffect(() => {
    const CACHE_KEY = "duoflix_catalog_v1";
    const CACHE_TTL = 6 * 60 * 60 * 1000;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL && data?.length) {
          setCatalog(data);
          setLoadProgress(100);
          setCatalogReady(true);
          return;
        }
      }
    } catch(e) {}

    tryFetchLiveCatalog(setLoadProgress).then(live => {
      const catalog = live?.length ? live : FALLBACK_CATALOG;
      setCatalog(catalog);
      setUsingFallback(!live?.length);
      setLoadProgress(100);
      setCatalogReady(true);
      if (live?.length) {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: live, timestamp: Date.now() }));
        } catch(e) {}
      }
    });
  }, []);

  // 3. Once we have auth user, load their profile
  useEffect(() => {
    if (!authUser || screen !== "loadingProfile") return;
    getProfile(authUser.id).then(p => {
      if (p) {
        setProfile(p);
        // Show tutorial if not completed yet
        if (!p.tutorial_complete) setScreen("tutorial");
        else setScreen("home");
      }
      else setScreen("setup");
    });
  }, [authUser, screen]);

  // 4. Load rooms once catalog + profile ready
  useEffect(() => {
    if (!authUser || !catalogReady || !profile) return;
    loadRoomsFromDB(authUser.id, catalog).then(saved => {
      setRooms(saved || []);
    });
    // Load notifications
    loadNotifications(authUser.id).then(setNotifications);
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadNotifications(authUser.id).then(setNotifications);
    }, 30000);
    return () => clearInterval(interval);
  }, [authUser, catalogReady, profile]);

  const persistRoom = async (room, swipedTitleId, swipeDir) => {
    if (!authUser) return;
    await saveRoomToDB(room, authUser.id);
    if (swipedTitleId && swipeDir) {
      const { error } = await supabase.from("swipes").upsert({
        room_id: room.id,
        user_id: authUser.id,
        title_id: swipedTitleId,
        direction: swipeDir,
      }, { onConflict: "room_id,user_id,title_id" });
      if (error) console.error("saveSwipe error:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setRooms([]); setProfile(null); setActiveRoom(null);
  };

  // ── Screen routing ──
  if (screen === "loading" || screen === "loadingProfile") return <Spinner />;
  if (screen === "auth")    return <AuthScreen onAuth={(u) => { setAuthUser(u); setScreen("loadingProfile"); }} />;
  if (screen === "setup" && !profile) return (
    <ProfileSetup
      email={authUser?.email}
      catalogReady={catalogReady} loadProgress={loadProgress} usingFallback={usingFallback}
      onComplete={async (name, services) => {
        await upsertProfile(authUser.id, name, services);
        setProfile({ name, services });
        setScreen("tutorial");
      }}
    />
  );
  if (screen === "setup" && profile) return (
    <ProfilePage
      profile={profile} email={authUser?.email}
      onSave={async (name, services) => {
        await upsertProfile(authUser.id, name, services);
        setProfile({ name, services });
        setScreen("home");
      }}
      onBack={()=>setScreen("home")}
    />
  );
  if (screen === "stats") return (
    <StatsScreen
      authUser={authUser}
      profile={profile}
      rooms={rooms}
      catalog={catalog}
      onBack={()=>setScreen("home")}
      onMyMovies={()=>setScreen("mymovies")}
    />
  );
  if (screen === "mymovies") return (
    <MyMoviesScreen
      authUser={authUser}
      catalog={catalog}
      onBack={()=>setScreen("stats")}
    />
  );
  if (screen === "about") return (
    <AboutScreen onBack={()=>setScreen("home")}/>
  );
  if (screen === "feedback") return (
    <FeedbackScreen
      authUser={authUser}
      profile={profile}
      onBack={()=>setScreen("home")}
    />
  );
  if (screen === "tutorial") return (
    <TutorialScreen
      profile={profile}
      catalog={catalog}
      onComplete={async () => {
        await supabase.from("profiles").update({ tutorial_complete: true }).eq("id", authUser.id);
        setProfile(p => ({...p, tutorial_complete: true}));
        setScreen("home");
      }}
    />
  );
  if (screen === "search") return (
    <FindPartner currentUser={{ id:authUser.id, ...profile }} catalog={catalog}
      rooms={rooms} setRooms={setRooms}
      onBack={()=>setScreen("home")}
      onJoinRoom={(r)=>{ setActiveRoom(r); setScreen("swipe"); }}
      persistRoom={persistRoom} />
  );
  if (screen === "swipe" && activeRoom) return (
    <SwipeScreen room={activeRoom}
      onBack={()=>setScreen("home")}
      onViewMatches={()=>setScreen("matches")}
      onMatch={(r)=>{ setActiveRoom({...r}); persistRoom(r); }}
      persistRoom={persistRoom} />
  );
  if (screen === "matches" && activeRoom) return (
    <MatchesScreen room={activeRoom} authUser={authUser} onBack={()=>setScreen("swipe")}
      onToggleWatched={async (titleId, isCurrentlyWatched) => {
        const current = activeRoom.watchedIds || [];
        const updated = isCurrentlyWatched
          ? current.filter(id=>id!==titleId)
          : [...current, titleId];
        const updatedRoom = {...activeRoom, watchedIds: updated};
        setActiveRoom(updatedRoom);
        // Save to rooms DB
        await supabase.from("rooms").update({ watched_ids: updated }).eq("id", activeRoom.id);
        // Update rooms list too
        setRooms(prev => prev.map(r => r.id===activeRoom.id ? {...r, watchedIds: updated} : r));
        // Sync to user_watched for personal ratings
        if (isCurrentlyWatched) {
          await supabase.from("user_watched").delete().eq("user_id", authUser.id).eq("title_id", titleId);
        } else {
          await supabase.from("user_watched").upsert({ user_id: authUser.id, title_id: titleId });
        }
      }}
    />
  );
  return (
    <HomeScreen
      profile={profile} rooms={rooms}
      notifications={notifications}
      onClearNotifications={async () => {
        await markNotificationsRead(authUser.id);
        setNotifications([]);
      }}
      onSearch={()=>setScreen("search")}
      onOpenRoom={async (r)=>{
    // Reload fresh swipes before entering room
    const swipesByUser = await loadSwipesForRoom(r.id);
    const mySwipes = swipesByUser[authUser.id] || {};
    const partnerId = r.partner?.id;
    const partnerSwipes = swipesByUser[partnerId] || {};
    const matches = (r.queue||[]).filter(t => mySwipes[t.id]==="like" && partnerSwipes[t.id]==="like");
    // Also fetch latest filters from DB
    const { data: freshRoom } = await supabase.from("rooms").select("content_type,genres").eq("id", r.id).single();
    setActiveRoom({...r, userSwipes: mySwipes, partnerSwipes, matches, contentType: freshRoom?.content_type||r.contentType||"both", genres: freshRoom?.genres||r.genres||[]});
    setScreen("swipe");
  }}
      onSignOut={handleSignOut}
      onEditProfile={()=>setScreen("setup")}
      onRestartTutorial={()=>setScreen("tutorial")}
      onViewStats={()=>setScreen("stats")}
      onAbout={()=>setScreen("about")}
      onFeedback={()=>setScreen("feedback")}
      onDeleteRooms={async (ids) => {
        try {
          await supabase.from("swipes").delete().in("room_id", ids);
          await supabase.from("rooms").delete().in("id", ids);
          setRooms(prev => prev.filter(r => !ids.includes(r.id)));
        } catch(e) { console.error("Delete rooms error:", e); }
      }}
    />
  );
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{...S.page,flexDirection:"column",gap:16}}>
      <div style={S.bigLogo}>DuoFlix</div>
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>Loading...</div>
    </div>
  );
}

// ─── AUTH SCREEN (Sign Up / Sign In) ─────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]     = useState("signin"); // signin | signup
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const submit = async () => {
    setError(""); setSuccess(""); setLoading(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else if (data.user && !data.session) setSuccess("Check your email to confirm your account, then sign in.");
      else if (data.user) onAuth(data.user);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onAuth(data.user);
    }
    setLoading(false);
  };

  return (
    <div style={S.page}><div style={S.onWrap}>
      <div style={S.bigLogo}>DuoFlix</div>
      <p style={{color:"rgba(255,255,255,0.5)",fontSize:13,textAlign:"center",marginBottom:28,marginTop:0,fontStyle:"italic",lineHeight:1.6}}>Swipe together. Match together. Watch together.</p>

      <input style={{...S.input,marginBottom:10}} type="email" placeholder="Email address"
        value={email} onChange={e=>setEmail(e.target.value)} />
      <input style={{...S.input,marginBottom:6}} type="password" placeholder="Password"
        value={password} onChange={e=>setPassword(e.target.value)}
        onKeyDown={e=>e.key==="Enter"&&submit()} />

      {error  && <div style={S.errorMsg}>{error}</div>}
      {success && <div style={S.successMsg}>{success}</div>}

      <button style={{...S.btn,width:"100%",marginTop:14,opacity:email&&password?1:0.4}} onClick={submit} disabled={loading||!email||!password}>
        {loading ? "Please wait..." : mode==="signin" ? "Sign In →" : "Create Account →"}
      </button>

      <div style={{marginTop:20,color:"rgba(255,255,255,0.4)",fontSize:13}}>
        {mode==="signin" ? "Don't have an account? " : "Already have an account? "}
        <button style={{background:"none",border:"none",color:"#f97316",cursor:"pointer",fontSize:13,fontWeight:600,padding:0}}
          onClick={()=>{ setMode(mode==="signin"?"signup":"signin"); setError(""); setSuccess(""); }}>
          {mode==="signin" ? "Sign Up" : "Sign In"}
        </button>
      </div>
    </div></div>
  );
}

// ─── PROFILE SETUP (first time only) ─────────────────────────────────────────
function ProfileSetup({ email, catalogReady, loadProgress, usingFallback, onComplete }) {
  const [step, setStep]     = useState(0);
  const [name, setName]     = useState("");
  const [services, setServices] = useState([]);
  const toggle = (s) => setServices(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  return (
    <div style={S.page}><div style={S.onWrap}>
      {step===0&&<>
        <div style={S.bigLogo}>DuoFlix</div>
        <div style={{color:"#fff",fontSize:16,fontWeight:600,marginBottom:4}}>Welcome! Let's set up your profile</div>
        <p style={{...S.muted,marginBottom:20}}>{email}</p>
        <div style={{width:"100%",marginBottom:8}}>
          <span style={{...S.muted,fontSize:11}}>
            {catalogReady
              ? usingFallback ? `✅ ${FALLBACK_CATALOG.length} curated titles ready` : "✅ 1,000+ trending titles loaded"
              : `⏳ Loading catalog... ${loadProgress}%`}
          </span>
          <div style={{height:3,background:"rgba(255,255,255,0.08)",borderRadius:4,marginTop:6}}>
            <div style={{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#f97316,#ec4899)",width:`${loadProgress}%`,transition:"width 0.4s"}}/>
          </div>
        </div>
        <button style={{...S.btn,marginTop:12,opacity:catalogReady?1:0.4}} onClick={()=>catalogReady&&setStep(1)}>
          {catalogReady?"Get Started →":"Loading..."}
        </button>
      </>}
      {step===1&&<>
        <div style={S.badge}>1 / 2</div>
        <h2 style={S.h2}>What's your name?</h2>
        <input style={S.input} placeholder="Display name..." value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name&&setStep(2)} autoFocus/>
        <button style={{...S.btn,marginTop:16,opacity:name?1:0.35}} onClick={()=>name&&setStep(2)}>Continue</button>
      </>}
      {step===2&&<>
        <div style={S.badge}>2 / 2</div>
        <h2 style={S.h2}>Your streaming services</h2>
        <p style={S.muted}>Select what you're subscribed to</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"20px 0",justifyContent:"center"}}>
          {ALL_SERVICES.map(s=>(
            <button key={s} onClick={()=>toggle(s)} style={{...S.chip,
              background:services.includes(s)?SERVICE_COLORS[s]:"rgba(255,255,255,0.07)",
              borderColor:services.includes(s)?SERVICE_COLORS[s]:"rgba(255,255,255,0.15)",
              color:services.includes(s)?"#fff":"#999"
            }}>{s}</button>
          ))}
        </div>
        <button style={{...S.btn,opacity:services.length?1:0.35}} onClick={()=>services.length&&onComplete(name,services)}>
          Save & Continue 🎬
        </button>
      </>}
    </div></div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ profile, rooms, notifications, onClearNotifications, onSearch, onOpenRoom, onSignOut, onEditProfile, onDeleteRooms, onRestartTutorial, onViewStats, onAbout, onFeedback }) {
  const [showMenu, setShowMenu]   = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [selected, setSelected]   = useState(new Set());
  const [confirming, setConfirming] = useState(false);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cancelEdit = () => { setEditMode(false); setSelected(new Set()); setConfirming(false); };

  const handleDelete = async () => {
    await onDeleteRooms([...selected]);
    cancelEdit();
  };

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <div style={S.logo}>DuoFlix</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {rooms.length>0&&!editMode&&(
            <button onClick={()=>setEditMode(true)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:13,padding:"6px 12px",cursor:"pointer"}}>
              Edit
            </button>
          )}
          <div style={{position:"relative"}}>
            <button onClick={()=>{ setShowNotifs(p=>!p); if(!showNotifs&&notifications.length>0) onClearNotifications(); }}
              style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:16,padding:"6px 10px",cursor:"pointer",position:"relative"}}>
              🔔
              {notifications.length>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#ef4444",borderRadius:"50%",width:16,height:16,fontSize:10,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{notifications.length}</span>}
            </button>
            {showNotifs&&(
              <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"rgba(24,24,36,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,zIndex:50,minWidth:260,maxWidth:300,overflow:"hidden"}}>
                <div style={{padding:"12px 16px 8px",color:"#fff",fontWeight:700,fontSize:13,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Notifications</div>
                {notifications.length===0
                  ?<div style={{padding:"16px",color:"rgba(255,255,255,0.4)",fontSize:13,textAlign:"center"}}>No new notifications</div>
                  :notifications.map(n=>(
                    <div key={n.id} style={{padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <div style={{color:"#fff",fontSize:13}}>{n.message}</div>
                      <div style={{color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:2}}>{new Date(n.created_at).toLocaleDateString()}</div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          {editMode&&(
            <button onClick={cancelEdit} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:13,padding:"6px 12px",cursor:"pointer"}}>
              Cancel
            </button>
          )}
          <div style={{position:"relative"}}>
            <button onClick={()=>setShowMenu(p=>!p)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:20,color:"#fff",fontSize:13,fontWeight:600,padding:"6px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
              {profile?.name?.split(" ")[0]} ▾
            </button>
            {showMenu&&(
              <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"rgba(24,24,36,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,overflow:"hidden",zIndex:50,minWidth:160}}>
                <button style={S.menuItem} onClick={()=>{onAbout();setShowMenu(false);}}>🎬 About DuoFlix</button>
                <button style={S.menuItem} onClick={()=>{onEditProfile();setShowMenu(false);}}>✏️ Edit Profile</button>
                <button style={S.menuItem} onClick={()=>{onViewStats();setShowMenu(false);}}>📊 My Stats</button>
                <button style={S.menuItem} onClick={()=>{onRestartTutorial();setShowMenu(false);}}>🍿 Kernel's Tutorial</button>
                <button style={S.menuItem} onClick={()=>{onFeedback();setShowMenu(false);}}>💬 Submit Feedback</button>
                <button style={{...S.menuItem,color:"#ef4444"}} onClick={onSignOut}>🚪 Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{color:"#fff",fontSize:22,fontWeight:700}}>Hey, {profile?.name?.split(" ")[0]} 👋</div>
      <div style={{...S.muted,marginBottom:20}}>
        {editMode ? `Select rooms to delete` : "Your watch rooms"}
      </div>

      {rooms.length===0
        ?<div style={S.empty}><div style={{fontSize:52}}>🎬</div><p>No rooms yet — find a partner to start swiping!</p></div>
        :rooms.map((r)=>{
          const swiped=(r.queue||[]).filter(t=>r.userSwipes?.[t.id]).length;
          const pct=Math.round((swiped/Math.max(r.queue?.length||1,1))*100);
          const isSelected = selected.has(r.id);
          return(
            <div key={r.id}
              style={{...S.roomCard,
                border: editMode
                  ? isSelected ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.15)"
                  : "1px solid rgba(255,255,255,0.07)",
                background: isSelected ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
                transition:"all 0.15s"
              }}
              onClick={()=> editMode ? toggleSelect(r.id) : onOpenRoom(r)}
            >
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                {editMode&&(
                  <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${isSelected?"#ef4444":"rgba(255,255,255,0.3)"}`,background:isSelected?"#ef4444":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,color:"#fff"}}>
                    {isSelected?"✓":""}
                  </div>
                )}
                {r.matches?.[0]?.poster
                  ?<img src={r.matches[0].poster} style={{width:40,height:56,objectFit:"cover",borderRadius:6}}/>
                  :<div style={{width:40,height:56,background:"rgba(255,255,255,0.07)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎬</div>
                }
                <div>
                  <div style={{color:"#fff",fontWeight:600}}>{r.partner.name}</div>
                  <div style={S.muted}>❤️ {r.matches?.length||0} matches · {pct}% swiped</div>
                  <div style={{marginTop:4,height:2,width:110,background:"rgba(255,255,255,0.08)",borderRadius:2}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#f97316,#ec4899)",borderRadius:2}}/>
                  </div>
                </div>
              </div>
              {!editMode&&<div style={{color:"rgba(255,255,255,0.25)",fontSize:20}}>→</div>}
            </div>
          );
        })
      }

      {/* Delete bar — appears when rooms are selected */}
      {editMode&&(
        <div style={{marginTop:"auto"}}>
          {!confirming ? (
            <button
              style={{...S.btn,width:"100%",background:selected.size>0?"linear-gradient(135deg,#ef4444,#dc2626)":"rgba(255,255,255,0.07)",opacity:selected.size>0?1:0.4}}
              onClick={()=>selected.size>0&&setConfirming(true)}
            >
              🗑️ Delete {selected.size>0?`${selected.size} Room${selected.size>1?"s":""}`:""} 
            </button>
          ):(
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:14,padding:"16px",textAlign:"center"}}>
              <div style={{color:"#fff",fontWeight:600,marginBottom:8}}>Delete {selected.size} room{selected.size>1?"s":""}?</div>
              <div style={{...S.muted,fontSize:12,marginBottom:14}}>This can't be undone. All swipes and matches will be lost.</div>
              <div style={{display:"flex",gap:10}}>
                <button style={{flex:1,background:"rgba(255,255,255,0.07)",border:"none",borderRadius:10,color:"#fff",padding:"10px",cursor:"pointer",fontSize:14}} onClick={()=>setConfirming(false)}>Cancel</button>
                <button style={{flex:1,background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:10,color:"#fff",padding:"10px",cursor:"pointer",fontSize:14,fontWeight:700}} onClick={handleDelete}>Delete</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!editMode&&(
        <button style={{...S.btn,marginTop:"auto",width:"100%"}} onClick={onSearch}>+ Find a Watch Partner</button>
      )}
    </div></div>
  );
}

// ─── FIND PARTNER ─────────────────────────────────────────────────────────────
function FindPartner({ currentUser, catalog, setRooms, onBack, onJoinRoom, persistRoom }) {
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUser.id)
      .then(({ data }) => {
        setAllUsers(data || []);
        setLoading(false);
      });
  }, []);

  const results = allUsers.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase())
  );

  const createRoom = (partner) => {
    const shared = (currentUser.services||[]).filter(s=>(partner.services||[]).includes(s));
    let titles = catalog.filter((t)=>t.services.some(s=>shared.includes(s)));
    if (titles.length<20) titles=[...catalog];
    const room={
      id:`room-${Date.now()}`, partner, sharedServices:shared,
      queue:[...titles].sort((a,b)=>(b.popularity||0)-(a.popularity||0)),
      userSwipes:{},
      partnerSwipes:{},
      matches:[],
    };
    setRooms(p=>[...p,room]);
    persistRoom(room);
    // Notify partner that a room was created
    sendNotification(partner.id, "new_room", `${currentUser.name} invited you to a watch room!`, room.id);
    onJoinRoom(room);
  };

  const getInitial = (name) => name?.charAt(0).toUpperCase() || "?";

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>Find Partner</div>
        <div style={{width:40}}/>
      </header>
      <input style={S.input} placeholder="Search by name..." value={query} onChange={e=>setQuery(e.target.value)} autoFocus/>
      <div style={{marginTop:16}}>
        {loading && <p style={S.muted}>Loading users...</p>}
        {!loading && allUsers.length === 0 && (
          <div style={S.empty}>
            <div style={{fontSize:48}}>👥</div>
            <p>No other users yet — share the app and invite friends to sign up!</p>
          </div>
        )}
        {!loading && allUsers.length > 0 && results.length === 0 && query && (
          <p style={S.muted}>No users found matching "{query}"</p>
        )}
        {results.map((u)=>(
          <div key={u.id} style={S.userCard}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:18,flexShrink:0}}>
              {getInitial(u.name)}
            </div>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:600}}>{u.name}</div>
              <div style={S.muted}>{(u.services||[]).slice(0,3).join(", ")}{(u.services||[]).length>3 ? " +more" : ""}</div>
            </div>
            <button style={S.btnSm} onClick={()=>createRoom(u)}>Invite</button>
          </div>
        ))}
      </div>
    </div></div>
  );
}

// ─── SWIPE SCREEN ─────────────────────────────────────────────────────────────
const ALL_GENRES = ["Action","Adventure","Animation","Comedy","Crime","Documentary","Drama","Family","Fantasy","History","Horror","Music","Mystery","Romance","Sci-Fi","Thriller","War","Western","Sci-Fi & Fantasy","Action & Adventure","Kids","Reality"];

function SwipeScreen({ room, onBack, onMatch, onViewMatches, persistRoom }) {
  const [swipes, setSwipes]     = useState({...room.userSwipes});
  const [newMatch, setNewMatch] = useState(null);
  const [dragX, setDragX]       = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting]   = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [contentType, setContentType] = useState(room.contentType||"both");
  const [selectedGenres, setSelectedGenres] = useState(room.genres||[]);
  const [filterSaving, setFilterSaving] = useState(false);
  const dragStart = useRef(null);
  const exitingRef = useRef(false);

  const saveFilters = async (newContentType, newGenres) => {
    setFilterSaving(true);
    room.contentType = newContentType;
    room.genres = newGenres;
    await persistRoom(room);
    setFilterSaving(false);
  };

  const handleContentType = (val) => {
    setContentType(val);
    saveFilters(val, selectedGenres);
  };

  const toggleGenre = (g) => {
    const next = selectedGenres.includes(g)
      ? selectedGenres.filter(x=>x!==g)
      : [...selectedGenres, g];
    setSelectedGenres(next);
    saveFilters(contentType, next);
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setContentType("both");
    saveFilters("both", []);
  };

  const fullQueue = room.queue||[];

  // Apply filters to queue — memoized to avoid recomputing on every drag event
  const queue = useMemo(() => fullQueue.filter(t => {
    if (contentType==="movie" && t.type!=="movie") return false;
    if (contentType==="tv" && t.type!=="tv") return false;
    if (selectedGenres.length>0 && !t.genres.some(g=>selectedGenres.includes(g))) return false;
    return true;
  }), [fullQueue, contentType, selectedGenres]);

  const filteredIdx = useMemo(() => queue.findIndex(t=>!swipes[t.id]), [queue, swipes]);
  const current  = filteredIdx >= 0 ? queue[filteredIdx] : undefined;
  const done     = !current;
  const matches  = useMemo(() => fullQueue.filter(t=>swipes[t.id]==="like"&&room.partnerSwipes[t.id]==="like"), [fullQueue, swipes, room.partnerSwipes]);
  const unswiped = useMemo(() => queue.filter(t=>!swipes[t.id]).length, [queue, swipes]);

  const swipe = (dir) => {
    if (!current||exitingRef.current||done) return;
    exitingRef.current=true;
    setExiting(dir);
    const ns={...swipes,[current.id]:dir};
    setSwipes(ns); room.userSwipes=ns;
    if (dir==="like") {
      // Check if partner has already swiped like on this title
      if (room.partnerSwipes[current.id]==="like") {
        if (!(room.matches||[]).some(m=>m.id===current.id)) {
          room.matches=[...(room.matches||[]),current];
          onMatch(room);
          // Notify partner about the match
          sendNotification(room.partner.id, "match", `🎉 You matched on "${current.title}"!`, room.id);
          setTimeout(()=>setNewMatch(current),150);
          setTimeout(()=>setNewMatch(null),2700);
        }
      }
    }
    persistRoom(room, current.id, dir);
    setTimeout(()=>{ setExiting(null); setDragX(0); exitingRef.current=false; },320);
  };

  const onDown=(e)=>{ if(exitingRef.current)return; dragStart.current=e.touches?.[0]?.clientX??e.clientX; setDragging(true); };
  const onMove=(e)=>{ if(!dragging||dragStart.current==null||exitingRef.current)return; setDragX((e.touches?.[0]?.clientX??e.clientX)-dragStart.current); };
  const onUp=()=>{ if(!dragging)return; setDragging(false); dragStart.current=null; if(Math.abs(dragX)>90)swipe(dragX>0?"like":"pass"); else setDragX(0); };

  const rot=dragX*0.07, likeOp=Math.max(0,Math.min(dragX/80,1)), passOp=Math.max(0,Math.min(-dragX/80,1));

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={{color:"#fff",fontWeight:700,fontSize:14,textAlign:"center"}}>
          <div>{room.partner.name}</div>
          <div style={{...S.muted,fontSize:10}}>{room.sharedServices.join(" · ")||"All services"}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button style={{...S.matchBadge,background:"rgba(255,255,255,0.08)",borderColor:"rgba(255,255,255,0.15)",color:"#fff"}} onClick={()=>setShowFilters(p=>!p)}>⚙️</button>
          <button style={S.matchBadge} onClick={onViewMatches}>❤️ {matches.length}</button>
        </div>
      </header>

      {/* Filter Panel */}
      {showFilters&&(
        <div style={{background:"rgba(20,20,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"16px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{color:"#fff",fontWeight:700,fontSize:14}}>Filter Titles</div>
            <div style={{...S.muted,fontSize:11}}>{filterSaving ? "Saving..." : "Synced for both users ✓"}</div>
          </div>

          {/* Content type */}
          <div style={{marginBottom:12}}>
            <div style={{...S.muted,fontSize:11,marginBottom:6}}>CONTENT TYPE</div>
            <div style={{display:"flex",gap:6}}>
              {[["both","🎬 Both"],["movie","🎥 Movies"],["tv","📺 TV Shows"]].map(([val,label])=>(
                <button key={val} onClick={()=>handleContentType(val)}
                  style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1px solid ${contentType===val?"#f97316":"rgba(255,255,255,0.12)"}`,background:contentType===val?"rgba(249,115,22,0.15)":"rgba(255,255,255,0.04)",color:contentType===val?"#f97316":"#999",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre filter */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{...S.muted,fontSize:11}}>GENRES {selectedGenres.length>0&&<span style={{color:"#f97316"}}>({selectedGenres.length} selected)</span>}</div>
              {selectedGenres.length>0&&<button onClick={()=>{ setSelectedGenres([]); saveFilters(contentType, []); }} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:11,cursor:"pointer"}}>Clear</button>}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {ALL_GENRES.map(g=>(
                <button key={g} onClick={()=>toggleGenre(g)}
                  style={{padding:"4px 10px",borderRadius:20,border:`1px solid ${selectedGenres.includes(g)?"#f97316":"rgba(255,255,255,0.12)"}`,background:selectedGenres.includes(g)?"rgba(249,115,22,0.15)":"rgba(255,255,255,0.04)",color:selectedGenres.includes(g)?"#f97316":"#999",fontSize:11,cursor:"pointer"}}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{...S.muted,fontSize:11,marginTop:10,textAlign:"center"}}>
            {unswiped} titles match your filters
          </div>
        </div>
      )}

      <div style={S.progBar}><div style={{...S.progFill,width:`${(Object.keys(swipes).length/Math.max(fullQueue.length,1))*100}%`}}/></div>

      {done?(
        <div style={S.empty}>
          <div style={{fontSize:56}}>{selectedGenres.length>0||contentType!=="both"?"🔍":"🎉"}</div>
          <h3 style={{color:"#fff",margin:0}}>{selectedGenres.length>0||contentType!=="both"?"No titles match":"All done!"}</h3>
          <p style={S.muted}>{selectedGenres.length>0||contentType!=="both"?"Try adjusting your filters":"You've swiped everything."}</p>
          {(selectedGenres.length>0||contentType!=="both")&&<button style={{...S.btn,background:"rgba(255,255,255,0.08)"}} onClick={clearFilters}>Clear Filters</button>}
          <button style={S.btn} onClick={onViewMatches}>See {matches.length} Matches →</button>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8}}>
          <div
            style={{...S.card,
              transform:exiting?`translateX(${exiting==="like"?450:-450}px) rotate(${exiting==="like"?25:-25}deg)`:`translateX(${dragX}px) rotate(${rot}deg)`,
              transition:exiting?"transform 0.32s ease":dragging?"none":"transform 0.2s ease",
              cursor:dragging?"grabbing":"grab",
            }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            {current.backdrop
              ?<div style={{position:"absolute",inset:0,backgroundImage:`url(${current.backdrop})`,backgroundSize:"cover",backgroundPosition:"center",filter:"blur(22px) brightness(0.28)",transform:"scale(1.1)",borderRadius:20}}/>
              :<div style={{position:"absolute",inset:0,background:"rgba(14,14,26,1)",borderRadius:20}}/>
            }
            <div style={{...S.likeStamp,opacity:likeOp}}>WATCH</div>
            <div style={{...S.nopeStamp,opacity:passOp}}>SKIP</div>
            <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 20px 18px",gap:9,width:"100%",boxSizing:"border-box"}}>
              {current.poster
                ?<img src={current.poster} alt={current.title} style={{width:158,height:237,objectFit:"cover",borderRadius:12,boxShadow:"0 12px 48px rgba(0,0,0,0.8)"}} draggable={false}/>
                :<div style={{width:158,height:237,borderRadius:12,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>🎬</div>
              }
              <div style={{color:"#fff",fontSize:17,fontWeight:700,textAlign:"center",lineHeight:1.25,maxWidth:280}}>{current.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {current.year&&<span style={S.muted}>{current.year} · {current.type==="tv"?"Series":"Film"}</span>}
                {current.rating&&current.rating!=="0.0"&&<span style={{background:"rgba(249,115,22,0.2)",color:"#f97316",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>⭐ {current.rating}</span>}
              </div>
              {current.overview&&<p style={{color:"rgba(255,255,255,0.48)",fontSize:11,textAlign:"center",lineHeight:1.55,margin:0,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{current.overview}</p>}
              <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
                {current.genres.map(g=><span key={g} style={S.genre}>{g}</span>)}
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center"}}>
                {current.services.map(s=><span key={s} style={{background:SERVICE_COLORS[s]||"#444",borderRadius:4,padding:"2px 7px",fontSize:9,color:"#fff",fontWeight:600}}>{s}</span>)}
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:40,marginTop:18}}>
            <button style={{...S.swipeBtn,borderColor:"rgba(239,68,68,0.5)",color:"#ef4444",background:"rgba(239,68,68,0.1)"}} onClick={()=>swipe("pass")}>✕</button>
            <button style={{...S.swipeBtn,borderColor:"rgba(34,197,94,0.5)",color:"#22c55e",background:"rgba(34,197,94,0.1)"}} onClick={()=>swipe("like")}>♥</button>
          </div>
        </div>
      )}

      {newMatch&&(
        <div style={S.toast}>
          {newMatch.poster?<img src={newMatch.poster} style={{width:65,height:97,objectFit:"cover",borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}/>:<div style={{fontSize:40}}>🎉</div>}
          <div style={{fontWeight:800,fontSize:20}}>It's a Match!</div>
          <div style={{opacity:0.85,fontSize:13,textAlign:"center",maxWidth:180}}>{newMatch.title}</div>
        </div>
      )}
    </div></div>
  );
}

// ─── MATCHES ──────────────────────────────────────────────────────────────────
function MatchesScreen({ room, authUser, onBack, onToggleWatched }) {
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    if (!authUser) return;
    supabase.from("user_watched").select("title_id,rating").eq("user_id", authUser.id)
      .then(({ data }) => {
        const map = {};
        (data||[]).forEach(r => { if (r.rating) map[r.title_id] = r.rating; });
        setRatings(map);
      });
  }, []);

  const rateTitle = async (titleId, star) => {
    setRatings(prev => ({...prev, [titleId]: star}));
    await supabase.from("user_watched").upsert({ user_id: authUser.id, title_id: titleId, rating: star });
  };

  const matches=(room.queue||[]).filter(t=>room.userSwipes[t.id]==="like"&&room.partnerSwipes[t.id]==="like");
  const watchedIds = room.watchedIds || [];
  const unwatched = matches.filter(t=>!watchedIds.includes(t.id));
  const watched   = matches.filter(t=>watchedIds.includes(t.id));

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>Matches ❤️</div>
        <div style={{width:40}}/>
      </header>
      <p style={{...S.muted,marginBottom:12}}>You & {room.partner.name} both want to watch:</p>
      {matches.length===0
        ?<div style={S.empty}><div style={{fontSize:48}}>😅</div><p>No matches yet — keep swiping!</p></div>
        :<div style={{overflowY:"auto"}}>
          {/* Unwatched */}
          {unwatched.length>0&&<>
            <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Up Next ({unwatched.length})</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {unwatched.map(t=>(
                <div key={t.id} style={S.matchCard}>
                  {t.poster?<img src={t.poster} style={{width:"100%",height:165,objectFit:"cover",borderRadius:"10px 10px 0 0"}}/>:<div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎬</div>}
                  <div style={{padding:"8px 8px 10px"}}>
                    <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:6,lineHeight:1.3}}>{t.title}</div>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"center",marginBottom:6}}>
                      {t.services.map(s=><span key={s} style={{background:SERVICE_COLORS[s]||"#444",borderRadius:3,padding:"1px 5px",fontSize:9,color:"#fff"}}>{s}</span>)}
                    </div>
                    <button onClick={()=>onToggleWatched(t.id, false)}
                      style={{width:"100%",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:6,color:"#22c55e",fontSize:11,fontWeight:600,padding:"5px",cursor:"pointer"}}>
                      ✓ Mark Watched
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>}
          {/* Watched */}
          {watched.length>0&&<>
            <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Watched ({watched.length})</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {watched.map(t=>(
                <div key={t.id} style={{...S.matchCard,opacity:0.7}}>
                  <div style={{position:"relative"}}>
                    {t.poster?<img src={t.poster} style={{width:"100%",height:165,objectFit:"cover",borderRadius:"10px 10px 0 0"}}/>:<div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎬</div>}
                    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>✅</div>
                  </div>
                  <div style={{padding:"8px 8px 10px"}}>
                    <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:6,lineHeight:1.3}}>{t.title}</div>
                    <button onClick={()=>onToggleWatched(t.id, true)}
                      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"rgba(255,255,255,0.4)",fontSize:11,padding:"5px",cursor:"pointer",marginBottom:6}}>
                      ↩ Unmark
                    </button>
                    <div style={{display:"flex",justifyContent:"center",gap:3}}>
                      {[1,2,3,4,5].map(star=>(
                        <button key={star} onClick={()=>rateTitle(t.id, star)}
                          style={{background:"none",border:"none",padding:"2px",cursor:"pointer",fontSize:16,color:star<=(ratings[t.id]||0)?"#f97316":"rgba(255,255,255,0.2)"}}>
                          {star<=(ratings[t.id]||0)?"★":"☆"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>}
        </div>
      }
    </div></div>
  );
}


// ─── FLIXIE TUTORIAL ─────────────────────────────────────────────────────────

// Flixie SVG mascot — popcorn bucket with eyes and mouth
function Kernel({ size = 80, animate = false }) {
  return (
    <div style={{
      width: size, height: size,
      animation: animate ? "kernelBounce 0.6s ease infinite alternate" : "none",
      display: "inline-block",
      filter: "drop-shadow(0 8px 24px rgba(249,115,22,0.4))"
    }}>
      <svg viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        {/* Popcorn kernels */}
        <circle cx="50" cy="13" r="10" fill="#FFF176"/>
        <circle cx="36" cy="18" r="9" fill="#FFF9C4"/>
        <circle cx="64" cy="18" r="9" fill="#FFF176"/>
        <circle cx="26" cy="28" r="8" fill="#FFF9C4"/>
        <circle cx="74" cy="28" r="8" fill="#FFF176"/>
        <circle cx="43" cy="10" r="8" fill="#FFF176"/>
        <circle cx="57" cy="10" r="8" fill="#FFF9C4"/>
        <circle cx="50" cy="26" r="9" fill="#FFF9C4"/>
        <circle cx="31" cy="34" r="7" fill="#FFF176"/>
        <circle cx="69" cy="34" r="7" fill="#FFF9C4"/>
        <circle cx="20" cy="38" r="6" fill="#FFF176"/>
        <circle cx="80" cy="38" r="6" fill="#FFF9C4"/>
        {/* Bucket body */}
        <path d="M22 44 L28 95 L72 95 L78 44 Z" fill="#ffffff"/>
        {/* Red stripes */}
        <path d="M22 44 L28 95 L34 95 L28 44 Z" fill="#E53935"/>
        <path d="M40 44 L46 95 L52 95 L46 44 Z" fill="#E53935"/>
        <path d="M58 44 L64 95 L70 95 L64 44 Z" fill="#E53935"/>
        <path d="M74 44 L72 95 L78 95 L78 44 Z" fill="#E53935"/>
        {/* Bucket rim */}
        <rect x="19" y="40" width="62" height="8" rx="4" fill="#E53935"/>
        {/* Eyes */}
        <ellipse cx="39" cy="65" rx="7" ry="7" fill="#1a1a2e"/>
        <ellipse cx="61" cy="65" rx="7" ry="7" fill="#1a1a2e"/>
        <circle cx="41" cy="63" r="2.5" fill="white"/>
        <circle cx="63" cy="63" r="2.5" fill="white"/>
        {/* Smile */}
        <path d="M38 78 Q50 88 62 78" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" fill="none"/>
        {/* Rosy cheeks */}
        <circle cx="32" cy="72" r="5" fill="#ffb3ba" opacity="0.6"/>
        <circle cx="68" cy="72" r="5" fill="#ffb3ba" opacity="0.6"/>
      </svg>
      <style>{`
        @keyframes kernelBounce {
          from { transform: translateY(0px) rotate(-3deg); }
          to   { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes kernelPop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Speech bubble with Flixie
function KernelBubble({ message, subtext, style = {} }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      animation: "slideUp 0.4s ease", ...style
    }}>
      <Kernel size={90} animate={true}/>
      <div style={{
        background: "rgba(255,255,255,0.96)", borderRadius: 18, padding: "14px 20px",
        maxWidth: 280, textAlign: "center", position: "relative",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
      }}>
        {/* Speech bubble pointer */}
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderBottom: "10px solid rgba(255,255,255,0.96)"
        }}/>
        <div style={{ color: "#1a1a2e", fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{message}</div>
        {subtext && <div style={{ color: "#666", fontSize: 12, marginTop: 6, lineHeight: 1.4 }}>{subtext}</div>}
      </div>
    </div>
  );
}

// Demo movie cards for swipe tutorial
const DEMO_MOVIES = [
  { id: "demo2", title: "Butter Me Up", year: "2024", type: "movie",
    genres: ["Romance", "Drama"], rating: "8.5", services: ["Disney+"],
    overview: "Two kernels fall in love inside a microwave. A tale of heat, pressure, and transformation.",
    poster: null, backdrop: null },
  { id: "demo1", title: "The Popcorn Chronicles", year: "2024", type: "movie",
    genres: ["Comedy", "Adventure"], rating: "9.9", services: ["Netflix"],
    overview: "A sentient bag of popcorn navigates the existential crisis of being delicious.",
    poster: null, backdrop: null },
];


// ─── DEMO MOVIE POSTERS ───────────────────────────────────────────────────────

// Poster 1: "The Popcorn Chronicles"
function PosterPopcornChronicles() {
  return <img src="data:image/jpeg;base64,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" alt="The Popcorn Chronicles" style={{width:158,height:237,borderRadius:12,objectFit:"cover",display:"block"}}/>;
}


// Poster 2: "Butter Me Up"
function PosterButterMeUp() {
  return <img src="data:image/jpeg;base64,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" alt="Butter Me Up" style={{width:158,height:237,borderRadius:12,objectFit:"cover",display:"block"}}/>;
}



function TutorialScreen({ profile, catalog, onComplete }) {
  const [step, setStep]             = useState(0);
  const [swipeDir, setSwipeDir]     = useState(null);
  const [matched, setMatched]       = useState(false);
  const [showMatch, setShowMatch]   = useState(false);
  const [showNotif, setShowNotif]   = useState(false);
  const [showWatched, setShowWatched] = useState(false);
  const [watchedIt, setWatchedIt]   = useState(false);
  const [dragX, setDragX]           = useState(0);
  const [dragging, setDragging]     = useState(false);
  const [exiting, setExiting]       = useState(null);
  const [wrongSwipe, setWrongSwipe] = useState(false);
  const [bellTapped, setBellTapped] = useState(false);
  const dragStart = useRef(null);
  const exitingRef = useRef(false);

  const KERNEL_USER = {
    id: "kernel-demo", name: "Kernel 🍿",
    services: ["Netflix","Disney+","Max","Prime Video","Hulu","Apple TV+","Peacock","Paramount+","Crunchyroll"]
  };

  // Steps: 0=intro, 1=home, 2=find partner, 3=room created, 4=swipe left, 5=swipe right, 6=match, 7=notifications, 8=watched, 9=done
  const steps = [
    { kernel: "Hey! I'm Kernel. Part popcorn, part genius, full-time movie enthusiast. 🍿", sub: "I'll be your guide today. Try not to spill me." },
    { kernel: "Welcome to your home screen! This is where the magic happens.", sub: "Or where nothing happens if you don't find a partner. No pressure." },
    { kernel: "First things first — tap 'Find a Watch Partner' down below!", sub: "It's big, orange, and very enthusiastic. Hard to miss." },
    { kernel: "Ohh look, it's me! I get to be your first friend (not like you actually have a choice muhahaha) 🍿", sub: "Tap 'Invite' next to my name and let's get the magic started!" },
    { kernel: "Welcome to your swipe room! Now pay attention — this is important.", sub: "Swipe LEFT on anything you'd rather watch paint dry than sit through." },
    { kernel: "Now swipe RIGHT on something you actually want to watch!", sub: "Go on, I already liked it. We're basically soulmates now. ❤️❤️" },
    { kernel: "BOOM — a match! 🎉 You have great taste. Kernel approves.", sub: "Tap that ❤️ button up top to see all your matches!" },
    { kernel: "These are your matches! They only show up here when BOTH of you swipe right.", sub: "Tap the 🔔 bell on the home screen — that's where I'll ping you when new matches happen!" },
    { kernel: "Once you've actually watched something — mark it! ✅", sub: "Hit 'Mark Watched' and it'll move to your watched pile. Kernel keeps track of everything." },
    { kernel: "Look at you! All grown up and ready to swipe! 🎬", sub: "Captain Kernel believes in you. Now go find something great to watch." },
  ];

  const current = steps[step];

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));

  const handleSwipe = (dir) => {
    if (exitingRef.current) return;
    // Step 4: must swipe pass (left)
    if (step === 4 && dir === "like") { setWrongSwipe(true); setDragX(0); return; }
    // Step 5: must swipe like (right)
    if (step === 5 && dir === "pass") { setWrongSwipe(true); setDragX(0); return; }
    setWrongSwipe(false);
    exitingRef.current = true;
    setExiting(dir);
    setSwipeDir(dir);
    if (dir === "like") {
      setTimeout(() => { setMatched(true); setShowMatch(true); setTimeout(() => setShowMatch(false), 2500); }, 350);
    }
    setTimeout(() => { setExiting(null); setDragX(0); exitingRef.current = false; next(); }, 350);
  };

  const onDown = (e) => { dragStart.current = e.touches?.[0]?.clientX ?? e.clientX; setDragging(true); };
  const onMove = (e) => { if (!dragging || exitingRef.current) return; setDragX((e.touches?.[0]?.clientX ?? e.clientX) - dragStart.current); };
  const onUp   = () => { if (!dragging) return; setDragging(false); dragStart.current = null; if (Math.abs(dragX) > 80) handleSwipe(dragX > 0 ? "like" : "pass"); else setDragX(0); };

  const rot = dragX * 0.07;
  const likeOp = Math.max(0, Math.min(dragX / 80, 1));
  const passOp = Math.max(0, Math.min(-dragX / 80, 1));

  // ── STEP 0: Intro ──
  if (step === 0) return (
    <div style={{...S.page, flexDirection:"column", justifyContent:"flex-start", alignItems:"center", padding:"40px 28px 40px", boxSizing:"border-box", gap:28, overflowY:"auto"}}>
      <div style={S.bigLogo}>DuoFlix</div>
      <div style={{animation:"kernelPop 0.5s ease"}}>
        <Kernel size={130} animate={true}/>
      </div>
      <div style={{textAlign:"center", width:"100%"}}>
        <div style={{color:"#fff",fontSize:24,fontWeight:800,marginBottom:12}}>Meet Kernel. 🍿</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,lineHeight:1.7}}>{current.kernel}</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:13,lineHeight:1.6,marginTop:8}}>{current.sub}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,width:"100%"}}>
        <button style={{...S.btn,width:"100%",fontSize:16,padding:"14px"}} onClick={next}>Let's Go! →</button>
        <button onClick={onComplete} style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:12,cursor:"pointer"}}>Skip tutorial</button>
      </div>
    </div>
  );

  // ── STEP 1: Home screen overview ──
  if (step === 1) return (
    <div style={S.page}>
      <div style={S.shell}>
        {/* Fake home screen */}
        <header style={S.hdr}>
          <div style={S.logo}>DuoFlix</div>
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:20,color:"#fff",fontSize:13,fontWeight:600,padding:"6px 14px"}}>
            {profile?.name?.split(" ")[0] || "You"} ▾
          </div>
        </header>
        <div style={{color:"#fff",fontSize:22,fontWeight:700}}>Hey, {profile?.name?.split(" ")[0] || "there"} 👋</div>
        <div style={{...S.muted,marginBottom:20}}>Your watch rooms</div>
        <div style={S.empty}><div style={{fontSize:52}}>🎬</div><p>No rooms yet — find a partner to start swiping!</p></div>
        <button style={{...S.btn,marginTop:"auto",width:"100%",opacity:0.4}} disabled>+ Find a Watch Partner</button>
      </div>
      {/* Flixie overlay */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px 32px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",gap:12,background:"linear-gradient(to top, rgba(14,14,26,0.98) 60%, transparent)"}}>
        <KernelBubble message={current.kernel} subtext={current.sub}/>
        <button style={{...S.btn,width:"100%"}} onClick={next}>Got it! →</button>
      </div>
    </div>
  );

  // ── STEP 2: Find partner prompt ──
  if (step === 2) return (
    <div style={S.page}>
      <div style={S.shell}>
        <header style={S.hdr}>
          <div style={S.logo}>DuoFlix</div>
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:20,color:"#fff",fontSize:13,fontWeight:600,padding:"6px 14px"}}>
            {profile?.name?.split(" ")[0] || "You"} ▾
          </div>
        </header>
        <div style={{color:"#fff",fontSize:22,fontWeight:700}}>Hey, {profile?.name?.split(" ")[0] || "there"} 👋</div>
        <div style={{...S.muted,marginBottom:20}}>Your watch rooms</div>
        <div style={S.empty}><div style={{fontSize:52}}>🎬</div><p>No rooms yet — find a partner to start swiping!</p></div>
        {/* Pulsing button */}
        <button style={{...S.btn,marginTop:"auto",width:"100%",animation:"pulse 1.2s ease infinite",boxShadow:"0 0 0 0 rgba(249,115,22,0.7)"}} onClick={next}>+ Find a Watch Partner</button>
        <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.5)} 50%{box-shadow:0 0 0 12px rgba(249,115,22,0)} }`}</style>
      </div>
      <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <KernelBubble message={current.kernel} subtext={current.sub}/>
      </div>
    </div>
  );

  // ── STEP 3: Find partner screen with Flixie user ──
  if (step === 3) return (
    <div style={S.page}>
      <div style={S.shell}>
        <header style={S.hdr}>
          <button style={S.back} onClick={()=>setStep(2)}>←</button>
          <div style={S.logo}>Find Partner</div>
          <div style={{width:40}}/>
        </header>
        <input style={S.input} placeholder="Search by name..." defaultValue="Kernel" readOnly/>
        <div style={{marginTop:16}}>
          <div style={{...S.userCard, border:"1px solid rgba(249,115,22,0.5)", background:"rgba(249,115,22,0.08)"}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🍿</div>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:600}}>Kernel 🍿</div>
              <div style={S.muted}>Netflix · Disney+ · Max · +5 more</div>
            </div>
            <button style={{...S.btnSm, animation:"pulse 1.2s ease infinite"}} onClick={next}>Invite</button>
          </div>
        </div>
      </div>
      <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <KernelBubble message={current.kernel} subtext={current.sub}/>
      </div>
    </div>
  );

  // ── STEP 4: Swipe LEFT tutorial ──
  if (step === 4) {
    const movie = DEMO_MOVIES[0];
    return (
      <div style={S.page}><div style={S.shell}>
        <header style={S.hdr}>
          <div style={{color:"#fff",fontWeight:700,fontSize:14,textAlign:"center"}}>
            <div>Kernel 🍿</div>
            <div style={{...S.muted,fontSize:10}}>Netflix · Disney+</div>
          </div>
          <button style={S.matchBadge}>❤️ 0</button>
        </header>
        <div style={S.progBar}><div style={{...S.progFill,width:"0%"}}/></div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8}}>
          <div style={{...S.card,
            transform: exiting ? `translateX(${exiting==="like"?450:-450}px) rotate(${exiting==="like"?25:-25}deg)` : `translateX(${dragX}px) rotate(${rot}deg)`,
            transition: exiting?"transform 0.32s ease":dragging?"none":"transform 0.2s ease",
            cursor:"grab"
          }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            <div style={{position:"absolute",inset:0,background:"rgba(14,14,26,1)",borderRadius:20}}/>
            <div style={{...S.likeStamp,opacity:likeOp}}>WATCH</div>
            <div style={{...S.nopeStamp,opacity:passOp}}>SKIP</div>
            <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 20px 18px",gap:9,width:"100%",boxSizing:"border-box"}}>
              <PosterButterMeUp/>
              <div style={{color:"#fff",fontSize:17,fontWeight:700,textAlign:"center"}}>{movie.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={S.muted}>{movie.year} · Film</span>
                <span style={{background:"rgba(249,115,22,0.2)",color:"#f97316",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>⭐ {movie.rating}</span>
              </div>
              <p style={{color:"rgba(255,255,255,0.48)",fontSize:11,textAlign:"center",lineHeight:1.55,margin:0}}>{movie.overview}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:40,marginTop:18}}>
            <button style={{...S.swipeBtn,borderColor:"rgba(239,68,68,0.5)",color:"#ef4444",background:"rgba(239,68,68,0.1)",animation:"pulse 1.2s ease infinite"}} onClick={()=>handleSwipe("pass")}>✕</button>
            <button style={{...S.swipeBtn,borderColor:"rgba(34,197,94,0.5)",color:"#22c55e",background:"rgba(34,197,94,0.1)",opacity:0.3,cursor:"not-allowed"}} onClick={()=>setWrongSwipe(true)}>♥</button>
          </div>
          {wrongSwipe&&<div style={{color:"#f97316",fontSize:12,textAlign:"center",marginTop:8,animation:"slideUp 0.3s ease"}}>👈 Wrong way! Kernel points LEFT — hit that ✕!</div>}
        </div>
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
          <KernelBubble message={wrongSwipe?"Wrong way, superstar! Kernel points left! ← That one!":current.kernel} subtext={wrongSwipe?"Swipe left = skip. You've got this!":current.sub}/>
        </div>
      </div></div>
    );
  }

  // ── STEP 5: Swipe RIGHT tutorial ──
  if (step === 5) {
    const movie = DEMO_MOVIES[1];
    return (
      <div style={S.page}><div style={S.shell}>
        <header style={S.hdr}>
          <div style={{color:"#fff",fontWeight:700,fontSize:14,textAlign:"center"}}>
            <div>Kernel 🍿</div>
            <div style={{...S.muted,fontSize:10}}>Netflix · Disney+</div>
          </div>
          <button style={S.matchBadge}>❤️ 0</button>
        </header>
        <div style={S.progBar}><div style={{...S.progFill,width:"50%"}}/></div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8}}>
          <div style={{...S.card,
            transform: exiting ? `translateX(${exiting==="like"?450:-450}px) rotate(${exiting==="like"?25:-25}deg)` : `translateX(${dragX}px) rotate(${rot}deg)`,
            transition: exiting?"transform 0.32s ease":dragging?"none":"transform 0.2s ease",
            cursor:"grab"
          }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
          >
            <div style={{position:"absolute",inset:0,background:"rgba(14,14,26,1)",borderRadius:20}}/>
            <div style={{...S.likeStamp,opacity:likeOp}}>WATCH</div>
            <div style={{...S.nopeStamp,opacity:passOp}}>SKIP</div>
            <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 20px 18px",gap:9,width:"100%",boxSizing:"border-box"}}>
              <PosterPopcornChronicles/>
              <div style={{color:"#fff",fontSize:17,fontWeight:700,textAlign:"center"}}>{movie.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={S.muted}>{movie.year} · Film</span>
                <span style={{background:"rgba(249,115,22,0.2)",color:"#f97316",borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>⭐ {movie.rating}</span>
              </div>
              <p style={{color:"rgba(255,255,255,0.48)",fontSize:11,textAlign:"center",lineHeight:1.55,margin:0}}>{movie.overview}</p>
            </div>
          </div>
          {/* Match toast */}
          {showMatch&&(
            <div style={S.toast}>
              <div style={{fontSize:40}}>🎉</div>
              <div style={{fontWeight:800,fontSize:20}}>It's a Match!</div>
              <div style={{opacity:0.85,fontSize:13,textAlign:"center"}}>The Popcorn Chronicles</div>
            </div>
          )}
          <div style={{display:"flex",gap:40,marginTop:18}}>
            <button style={{...S.swipeBtn,borderColor:"rgba(239,68,68,0.5)",color:"#ef4444",background:"rgba(239,68,68,0.1)",opacity:0.3,cursor:"not-allowed"}} onClick={()=>setWrongSwipe(true)}>✕</button>
            <button style={{...S.swipeBtn,borderColor:"rgba(34,197,94,0.5)",color:"#22c55e",background:"rgba(34,197,94,0.1)",animation:"pulse 1.2s ease infinite"}} onClick={()=>handleSwipe("like")}>♥</button>
          </div>
          {wrongSwipe&&<div style={{color:"#f97316",fontSize:12,textAlign:"center",marginTop:8,animation:"slideUp 0.3s ease"}}>👉 Other way! Flixie believes in you. Mostly.</div>}
        </div>
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
          <KernelBubble message={wrongSwipe?"Wrong button, champ! Tap the ♥ — Kernel's rooting for you! 💪":current.kernel} subtext={wrongSwipe?"Swipe right = want to watch. Almost there!":current.sub}/>
        </div>
      </div></div>
    );
  }

  // ── STEP 6: Match! Tap the heart ──
  if (step === 6) return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <div style={{color:"#fff",fontWeight:700,fontSize:14}}>Kernel 🍿</div>
        <button style={{...S.matchBadge, animation:"pulse 1.2s ease infinite"}} onClick={next}>❤️ 1</button>
      </header>
      <div style={S.progBar}><div style={{...S.progFill,width:"100%"}}/></div>
      <div style={S.empty}>
        <div style={{fontSize:56}}>🎉</div>
        <h3 style={{color:"#fff",margin:0}}>All done!</h3>
        <p style={S.muted}>You've swiped everything in this demo.</p>
        <button style={S.btn} onClick={next}>See 1 Match →</button>
      </div>
      <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
        <KernelBubble message={current.kernel} subtext={current.sub}/>
      </div>
    </div></div>
  );

  // ── STEP 7: Notifications — fake home screen with bell ──
  if (step === 7) {
    return (
      <div style={S.page}>
        <div style={S.shell}>
          <header style={S.hdr}>
            <div style={S.logo}>DuoFlix</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Pulsing bell with notification badge */}
              <div style={{position:"relative"}}>
                <button
                  onClick={()=>{ setBellTapped(true); setTimeout(next, 1200); }}
                  style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"rgba(255,255,255,0.8)",fontSize:16,padding:"6px 10px",cursor:"pointer",animation:bellTapped?"none":"pulse 1.2s ease infinite"}}>
                  🔔
                  {!bellTapped&&<span style={{position:"absolute",top:-4,right:-4,background:"#ef4444",borderRadius:"50%",width:16,height:16,fontSize:10,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>1</span>}
                </button>
                {bellTapped&&(
                  <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:"rgba(24,24,36,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,zIndex:50,minWidth:240,overflow:"hidden",animation:"slideUp 0.3s ease"}}>
                    <div style={{padding:"12px 16px 8px",color:"#fff",fontWeight:700,fontSize:13,borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Notifications</div>
                    <div style={{padding:"10px 16px"}}>
                      <div style={{color:"#fff",fontSize:13}}>🎉 You matched on "The Popcorn Chronicles"!</div>
                      <div style={{color:"rgba(255,255,255,0.3)",fontSize:11,marginTop:2}}>Just now</div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{background:"rgba(255,255,255,0.08)",borderRadius:20,color:"#fff",fontSize:13,fontWeight:600,padding:"6px 14px"}}>
                {profile?.name?.split(" ")[0]||"You"} ▾
              </div>
            </div>
          </header>
          <div style={{color:"#fff",fontSize:22,fontWeight:700}}>Hey, {profile?.name?.split(" ")[0]||"there"} 👋</div>
          <div style={{...S.muted,marginBottom:20}}>Your watch rooms</div>
          <div style={{...S.roomCard}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:56,background:"rgba(255,255,255,0.07)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍿</div>
              <div>
                <div style={{color:"#fff",fontWeight:600}}>Kernel 🍿</div>
                <div style={S.muted}>❤️ 1 match · 100% swiped</div>
              </div>
            </div>
            <div style={{color:"rgba(255,255,255,0.25)",fontSize:20}}>→</div>
          </div>
        </div>
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
          <KernelBubble message={bellTapped?"There it is! 🔔 That's how Kernel gets your attention when something exciting happens!":current.kernel} subtext={bellTapped?"Now go check those matches!":current.sub}/>
        </div>
      </div>
    );
  }

  // ── STEP 8: Watched ──
  if (step === 8) return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back}>←</button>
        <div style={S.logo}>Matches ❤️</div>
        <div style={{width:40}}/>
      </header>
      <p style={{...S.muted,marginBottom:12}}>You & Flixie both want to watch:</p>
      {!watchedIt ? (
        <div style={{overflowY:"auto"}}>
          <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Up Next (1)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.matchCard}>
              <div style={{borderRadius:"10px 10px 0 0",overflow:"hidden"}}><PosterPopcornChronicles/></div>
              <div style={{padding:"8px 8px 10px"}}>
                <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:6}}>The Popcorn Chronicles</div>
                <button onClick={()=>setWatchedIt(true)} style={{width:"100%",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:6,color:"#22c55e",fontSize:11,fontWeight:600,padding:"5px",cursor:"pointer",animation:"pulse 1.2s ease infinite"}}>
                  ✓ Mark Watched
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{overflowY:"auto"}}>
          <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Watched (1)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={{...S.matchCard,opacity:0.5}}>
              <div style={{position:"relative"}}>
                <div style={{borderRadius:"10px 10px 0 0",overflow:"hidden"}}><PosterPopcornChronicles/></div>
                <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>✅</div>
              </div>
              <div style={{padding:"8px 8px 10px"}}>
                <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:6}}>Butter Me Up</div>
              </div>
            </div>
          </div>
          <div style={{marginTop:20}}>
            <button style={{...S.btn,width:"100%"}} onClick={next}>Nice! What's next? →</button>
          </div>
        </div>
      )}
      <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
        <KernelBubble message={watchedIt ? "Look at you, a person who finishes things! ✅" : current.kernel} subtext={watchedIt ? "Your partner sees it too. The watched list is sacred ground." : current.sub}/>
      </div>
    </div></div>
  );

  // ── STEP 9: Done! ──
  return (
    <div style={{...S.page, flexDirection:"column", justifyContent:"flex-start", alignItems:"center", padding:"40px 28px 40px", boxSizing:"border-box", gap:28, overflowY:"auto"}}>
      <div style={S.bigLogo}>DuoFlix</div>
      <div style={{animation:"kernelPop 0.5s ease"}}>
        <Kernel size={130} animate={true}/>
      </div>
      <div style={{textAlign:"center", width:"100%"}}>
        <div style={{color:"#fff",fontSize:26,fontWeight:800,marginBottom:12}}>Look at you! 🎉</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,lineHeight:1.7}}>{current.kernel}</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:13,lineHeight:1.6,marginTop:8}}>{current.sub}</div>
      </div>
      <button style={{...S.btn,width:"100%",fontSize:16,padding:"14px"}} onClick={onComplete}>
        Let's Start Swiping! 🍿
      </button>
    </div>
  );
}



// ─── ABOUT SCREEN ─────────────────────────────────────────────────────────────
function AboutScreen({ onBack }) {
  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>About DuoFlix</div>
        <div style={{width:40}}/>
      </header>
      <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:20,paddingBottom:20}}>
        <div style={{textAlign:"center",padding:"8px 0"}}>
          <div style={S.bigLogo}>DuoFlix</div>
          <div style={{...S.muted,fontStyle:"italic",marginTop:4}}>Swipe together. Match together. Watch together.</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"20px 18px",display:"flex",flexDirection:"column",gap:16}}>
          {[
            {text:"Choosing a movie shouldn't take longer than watching one.", bold:true},
            {text:"DuoFlix helps friends, couples, and families quickly find something everyone wants to watch. Instead of scrolling endlessly across streaming apps, DuoFlix lets you swipe through movies and shows available on your streaming services.", bold:false},
            {text:'When two people swipe "yes" on the same title, it\'s a match.', bold:false, italic:true},
            {text:"No debates. No endless browsing. Just press play.", bold:false, italic:true},
            {text:"DuoFlix aggregates streaming availability across major platforms so you always know where something is actually available to watch.", bold:false},
            {text:"Because the hardest part of movie night shouldn't be choosing the movie.", bold:true},
          ].map((para,i)=>(
            <p key={i} style={{color:para.bold?"#fff":"rgba(255,255,255,0.65)",fontSize:para.bold?15:14,fontWeight:para.bold?700:400,lineHeight:1.7,margin:0,fontStyle:para.italic?"italic":"normal"}}>{para.text}</p>
          ))}
        </div>
        <div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:12}}>Made with 🍿 by DuoFlix</div>
      </div>
    </div></div>
  );
}

// ─── FEEDBACK SCREEN ──────────────────────────────────────────────────────────
function FeedbackScreen({ authUser, profile, onBack }) {
  const [msg, setMsg]       = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async () => {
    if (!msg.trim()) return;
    setStatus("sending");
    try {
      await supabase.from("feedback").insert({
        user_id: authUser.id,
        user_name: profile?.name || "Unknown",
        message: msg.trim(),
      });
      setMsg("");
      setStatus("sent");
      setTimeout(() => setStatus(null), 3000);
    } catch(e) {
      console.error("Feedback error:", e);
      setStatus("error");
    }
  };

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>Submit Feedback</div>
        <div style={{width:40}}/>
      </header>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px 18px",marginBottom:20}}>
        <div style={{color:"#fff",fontSize:14,fontWeight:600,marginBottom:6}}>We want to hear from you! 🍿</div>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,lineHeight:1.6}}>
          Got an idea for a new feature? Found a bug? Something not working the way you expected? Drop it here and we'll review it. Every piece of feedback helps make DuoFlix better.
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{...S.muted,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Your Feedback</div>
        <textarea
          value={msg}
          onChange={e=>setMsg(e.target.value)}
          placeholder="Tell us what's on your mind..."
          rows={7}
          style={{...S.input,resize:"vertical",minHeight:140,fontFamily:"inherit",lineHeight:1.6}}
        />
        <div style={{...S.muted,fontSize:11,textAlign:"right",marginTop:4}}>{msg.length} characters</div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!msg.trim()||status==="sending"}
        style={{...S.btn,width:"100%",
          opacity:msg.trim()&&status!=="sending"?1:0.4,
          background:status==="sent"?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#f97316,#ec4899)"
        }}>
        {status==="sending"?"Sending...":status==="sent"?"✓ Feedback Sent!":status==="error"?"Failed — try again":"Send Feedback"}
      </button>
      {status==="error"&&<div style={{color:"#ef4444",fontSize:12,textAlign:"center",marginTop:8}}>Something went wrong. Please try again.</div>}
    </div></div>
  );
}

// ─── MY MOVIES SCREEN ─────────────────────────────────────────────────────────
function MyMoviesScreen({ authUser, catalog, onBack }) {
  const [likedTitles, setLikedTitles] = useState([]);
  const [watched, setWatched]         = useState(new Set());
  const [ratings, setRatings]         = useState({});
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState("all");

  useEffect(() => {
    async function load() {
      const { data: swipes } = await supabase
        .from("swipes").select("title_id")
        .eq("user_id", authUser.id).eq("direction", "like");
      const { data: watchedData } = await supabase
        .from("user_watched").select("title_id,rating")
        .eq("user_id", authUser.id);
      const watchedSet = new Set((watchedData||[]).map(w => w.title_id));
      const ratingsMap = {};
      (watchedData||[]).forEach(w => { if (w.rating) ratingsMap[w.title_id] = w.rating; });
      const likedIds   = new Set((swipes||[]).map(s => s.title_id));
      const titleMap   = Object.fromEntries(catalog.map(t => [String(t.id), t]));
      const titles     = [...likedIds].map(id => titleMap[String(id)]).filter(Boolean);
      titles.sort((a,b) => a.title.localeCompare(b.title));
      setLikedTitles(titles);
      setWatched(watchedSet);
      setRatings(ratingsMap);
      setLoading(false);
    }
    load();
  }, []);

  const toggleWatched = async (titleId) => {
    const isWatched = watched.has(titleId);
    const updated = new Set(watched);
    if (isWatched) {
      updated.delete(titleId);
      setRatings(prev => { const r = {...prev}; delete r[titleId]; return r; });
      await supabase.from("user_watched").delete().eq("user_id", authUser.id).eq("title_id", titleId);
    } else {
      updated.add(titleId);
      await supabase.from("user_watched").upsert({ user_id: authUser.id, title_id: titleId });
    }
    setWatched(updated);
  };

  const rateTitle = async (titleId, star) => {
    setRatings(prev => ({...prev, [titleId]: star}));
    await supabase.from("user_watched").upsert({ user_id: authUser.id, title_id: titleId, rating: star });
  };

  const filtered = filter==="unwatched" ? likedTitles.filter(t=>!watched.has(t.id))
                 : filter==="watched"   ? likedTitles.filter(t=> watched.has(t.id))
                 : likedTitles;

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>My Movies</div>
        <div style={{width:40}}/>
      </header>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["all","All"],["unwatched","Unwatched"],["watched","Watched ✅"]].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)} style={{
            flex:1,padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
            background:filter===val?"linear-gradient(135deg,#f97316,#ec4899)":"rgba(255,255,255,0.07)",
            color:filter===val?"#fff":"rgba(255,255,255,0.5)"
          }}>{label}</button>
        ))}
      </div>
      {loading ? (
        <div style={S.empty}><div style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>Loading your movies...</div></div>
      ) : likedTitles.length===0 ? (
        <div style={S.empty}><div style={{fontSize:48}}>🎬</div><p>No liked movies yet — start swiping to build your list!</p></div>
      ) : filtered.length===0 ? (
        <div style={S.empty}><div style={{fontSize:48}}>🍿</div><p>Nothing in this category yet.</p></div>
      ) : (
        <div style={{overflowY:"auto",paddingBottom:20}}>
          <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>
            {filtered.length} title{filtered.length!==1?"s":""}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {filtered.map(t=>(
              <div key={t.id} style={{...S.matchCard,opacity:watched.has(t.id)?0.55:1}}>
                <div style={{position:"relative"}}>
                  {t.poster
                    ? <img src={t.poster} style={{width:"100%",height:165,objectFit:"cover",borderRadius:"10px 10px 0 0"}}/>
                    : <div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎬</div>
                  }
                  {watched.has(t.id)&&(
                    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>✅</div>
                  )}
                </div>
                <div style={{padding:"8px 8px 10px"}}>
                  <div style={{color:"#fff",fontWeight:600,fontSize:11,textAlign:"center",marginBottom:5,lineHeight:1.3}}>{t.title}</div>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"center",marginBottom:6}}>
                    {(t.services||[]).map(s=>(
                      <span key={s} style={{background:SERVICE_COLORS[s]||"#444",borderRadius:3,padding:"1px 5px",fontSize:9,color:"#fff"}}>{s}</span>
                    ))}
                  </div>
                  <button onClick={()=>toggleWatched(t.id)} style={{
                    width:"100%",borderRadius:6,fontSize:11,fontWeight:600,padding:"5px",cursor:"pointer",
                    background:watched.has(t.id)?"rgba(255,255,255,0.06)":"rgba(34,197,94,0.12)",
                    color:watched.has(t.id)?"rgba(255,255,255,0.35)":"#22c55e",
                    border:watched.has(t.id)?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(34,197,94,0.3)"
                  }}>
                    {watched.has(t.id)?"↩ Unmark":"✓ Mark Watched"}
                  </button>
                  {watched.has(t.id)&&(
                    <div style={{display:"flex",justifyContent:"center",gap:3,marginTop:5}}>
                      {[1,2,3,4,5].map(star=>(
                        <button key={star} onClick={()=>rateTitle(t.id, star)}
                          style={{background:"none",border:"none",padding:"2px",cursor:"pointer",fontSize:16,color:star<=(ratings[t.id]||0)?"#f97316":"rgba(255,255,255,0.2)"}}>
                          {star<=(ratings[t.id]||0)?"★":"☆"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div></div>
  );
}

// ─── STATS SCREEN ────────────────────────────────────────────────────────────
function StatsScreen({ authUser, profile, rooms, catalog, onBack, onMyMovies }) {
  const [swipeStats, setSwipeStats] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    async function loadStats() {
      // Load all swipes for this user across all rooms
      const { data: swipes } = await supabase
        .from("swipes")
        .select("*")
        .eq("user_id", authUser.id);

      const allSwipes = swipes || [];
      const likes     = allSwipes.filter(s => s.direction === "like");
      const passes    = allSwipes.filter(s => s.direction === "pass");

      // Total watched across all rooms
      const totalWatched = rooms.reduce((sum, r) => sum + (r.watchedIds||[]).length, 0);

      // Total matches across all rooms
      const totalMatches = rooms.reduce((sum, r) => sum + (r.matches||[]).length, 0);

      // Most active partner — room with most matches
      const partnerMatchMap = {};
      rooms.forEach(r => {
        const name = r.partner?.name || "Unknown";
        partnerMatchMap[name] = (partnerMatchMap[name] || 0) + (r.matches||[]).length;
      });
      const mostActivePartner = Object.entries(partnerMatchMap)
        .sort((a,b) => b[1] - a[1])[0] || null;

      // Genre stats — look up liked/passed title IDs against room queues
      const titleMap = {};
      rooms.forEach(r => (r.queue||[]).forEach(t => { titleMap[t.id] = t; }));

      const genreLikes  = {};
      const genrePasses = {};
      likes.forEach(s => {
        const t = titleMap[s.title_id];
        (t?.genres||[]).forEach(g => { genreLikes[g]  = (genreLikes[g]  || 0) + 1; });
      });
      passes.forEach(s => {
        const t = titleMap[s.title_id];
        (t?.genres||[]).forEach(g => { genrePasses[g] = (genrePasses[g] || 0) + 1; });
      });

      const topLikedGenres  = Object.entries(genreLikes).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const topSkippedGenres = Object.entries(genrePasses).sort((a,b)=>b[1]-a[1]).slice(0,5);

      const likeRatio = allSwipes.length > 0
        ? Math.round((likes.length / allSwipes.length) * 100)
        : 0;

      setSwipeStats({
        totalSwipes: allSwipes.length,
        totalLikes: likes.length,
        totalPasses: passes.length,
        likeRatio,
        totalMatches,
        totalWatched,
        mostActivePartner,
        topLikedGenres,
        topSkippedGenres,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const StatCard = ({ emoji, label, value, sub, color="#f97316" }) => (
    <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
      <div style={{fontSize:32,flexShrink:0}}>{emoji}</div>
      <div style={{flex:1}}>
        <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{label}</div>
        <div style={{color,fontSize:22,fontWeight:800,lineHeight:1}}>{value}</div>
        {sub&&<div style={{color:"rgba(255,255,255,0.35)",fontSize:11,marginTop:3}}>{sub}</div>}
      </div>
    </div>
  );

  const GenreBar = ({ genre, count, max, color }) => (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{color:"#fff",fontSize:13}}>{genre}</span>
        <span style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{count} swipes</span>
      </div>
      <div style={{height:6,background:"rgba(255,255,255,0.07)",borderRadius:3}}>
        <div style={{height:"100%",width:`${Math.round((count/max)*100)}%`,background:color,borderRadius:3,transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>My Stats</div>
        <div style={{width:40}}/>
      </header>
      <button onClick={onMyMovies} style={{...S.btn,width:"100%",marginBottom:16,background:"linear-gradient(135deg,rgba(249,115,22,0.15),rgba(236,72,153,0.15))",border:"1px solid rgba(249,115,22,0.3)",fontSize:14}}>
        🎬 My Movies →
      </button>

      {loading ? (
        <div style={S.empty}>
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>Loading your stats...</div>
        </div>
      ) : swipeStats?.totalSwipes === 0 ? (
        <div style={S.empty}>
          <div style={{fontSize:48}}>🍿</div>
          <p>No stats yet — start swiping to see your data here!</p>
        </div>
      ) : (
        <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:12,paddingBottom:20}}>

          {/* Overview cards */}
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Overview</div>
          <StatCard emoji="👆" label="Total Swipes" value={swipeStats.totalSwipes.toLocaleString()} sub="across all rooms"/>
          <StatCard emoji="❤️" label="Total Matches" value={swipeStats.totalMatches.toLocaleString()} sub="titles you both liked" color="#ec4899"/>
          <StatCard emoji="✅" label="Titles Watched" value={swipeStats.totalWatched.toLocaleString()} sub="marked as watched" color="#22c55e"/>

          {/* Most active partner */}
          {swipeStats.mostActivePartner && (
            <StatCard
              emoji="🤝"
              label="Most Active Partner"
              value={swipeStats.mostActivePartner[0]}
              sub={`${swipeStats.mostActivePartner[1]} matches together`}
              color="#a78bfa"
            />
          )}

          {/* Like vs pass ratio */}
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px 18px"}}>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Are You Picky? 🤔</div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{color:"#22c55e",fontSize:22,fontWeight:800}}>{swipeStats.likeRatio}%</span>
              <span style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>like rate</span>
              <span style={{marginLeft:"auto",color:"rgba(255,255,255,0.3)",fontSize:12}}>
                {swipeStats.likeRatio >= 70 ? "Easy to please 😄" :
                 swipeStats.likeRatio >= 40 ? "Balanced taste 🎯" :
                 "Very selective 🧐"}
              </span>
            </div>
            {/* Like/pass bar */}
            <div style={{height:10,background:"rgba(239,68,68,0.3)",borderRadius:5,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${swipeStats.likeRatio}%`,background:"linear-gradient(90deg,#22c55e,#16a34a)",borderRadius:5,transition:"width 0.6s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <span style={{color:"#22c55e",fontSize:11}}>👍 {swipeStats.totalLikes} likes</span>
              <span style={{color:"#ef4444",fontSize:11}}>{swipeStats.totalPasses} passes 👎</span>
            </div>
          </div>

          {/* Top liked genres */}
          {swipeStats.topLikedGenres.length > 0 && (
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px 18px"}}>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Most Liked Genres ❤️</div>
              {swipeStats.topLikedGenres.map(([g,n]) => (
                <GenreBar key={g} genre={g} count={n} max={swipeStats.topLikedGenres[0][1]} color="linear-gradient(90deg,#f97316,#ec4899)"/>
              ))}
            </div>
          )}

          {/* Top skipped genres */}
          {swipeStats.topSkippedGenres.length > 0 && (
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"16px 18px"}}>
              <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Most Skipped Genres 👎</div>
              {swipeStats.topSkippedGenres.map(([g,n]) => (
                <GenreBar key={g} genre={g} count={n} max={swipeStats.topSkippedGenres[0][1]} color="rgba(239,68,68,0.7)"/>
              ))}
            </div>
          )}

        </div>
      )}
    </div></div>
  );
}

// ─── PROFILE PAGE ────────────────────────────────────────────────────────────
function ProfilePage({ profile, email, onSave, onBack }) {
  const [name, setName]       = useState(profile.name || "");
  const [services, setServices] = useState(profile.services || []);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const toggle = (s) => setServices(p=>p.includes(s)?p.filter(x=>x!==s):[...p,s]);

  const handleSave = async () => {
    if (!name || !services.length) return;
    setSaving(true);
    await onSave(name, services);
    setSaving(false);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };

  return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <button style={S.back} onClick={onBack}>←</button>
        <div style={S.logo}>DuoFlix</div>
        <div style={{width:40}}/>
      </header>

      <div style={{color:"#fff",fontSize:20,fontWeight:700,marginBottom:4}}>Your Profile</div>
      <div style={{...S.muted,marginBottom:24}}>{email}</div>

      {/* Name */}
      <div style={{marginBottom:20}}>
        <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Display Name</div>
        <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name..."/>
      </div>

      {/* Streaming services */}
      <div style={{marginBottom:28}}>
        <div style={{...S.muted,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Streaming Services</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {ALL_SERVICES.map(s=>(
            <button key={s} onClick={()=>toggle(s)} style={{...S.chip,
              background:services.includes(s)?SERVICE_COLORS[s]:"rgba(255,255,255,0.07)",
              borderColor:services.includes(s)?SERVICE_COLORS[s]:"rgba(255,255,255,0.15)",
              color:services.includes(s)?"#fff":"#999"
            }}>{s}</button>
          ))}
        </div>
      </div>

      <button
        style={{...S.btn,width:"100%",marginTop:"auto",opacity:name&&services.length?1:0.4,
          background:saved?"linear-gradient(135deg,#22c55e,#16a34a)":"linear-gradient(135deg,#f97316,#ec4899)"}}
        onClick={handleSave} disabled={saving||!name||!services.length}>
        {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Changes"}
      </button>
    </div></div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S={
  page:{minHeight:"100vh",background:"#08080f",display:"flex",alignItems:"center",justifyContent:"center",backgroundImage:"radial-gradient(ellipse at 20% 50%,rgba(99,37,240,0.07) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(239,68,68,0.05) 0%,transparent 50%)",fontFamily:"'Georgia',serif"},
  shell:{width:"100%",maxWidth:420,minHeight:"100vh",background:"rgba(12,12,20,0.98)",display:"flex",flexDirection:"column",padding:"20px 20px 32px",position:"relative",overflow:"hidden"},
  onWrap:{width:"100%",maxWidth:380,display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 28px",textAlign:"center"},
  bigLogo:{fontSize:42,fontWeight:800,letterSpacing:-2,background:"linear-gradient(135deg,#f97316,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8},
  logo:{fontSize:22,fontWeight:700,letterSpacing:-0.5,background:"linear-gradient(135deg,#f97316,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"},
  muted:{color:"rgba(255,255,255,0.4)",fontSize:13},
  badge:{color:"#f97316",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10},
  h2:{color:"#fff",fontSize:22,fontWeight:700,margin:"0 0 16px"},
  input:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,color:"#fff",fontSize:15,padding:"12px 16px",outline:"none",boxSizing:"border-box"},
  btn:{background:"linear-gradient(135deg,#f97316,#ec4899)",border:"none",borderRadius:14,color:"#fff",fontWeight:700,fontSize:15,padding:"14px 28px",cursor:"pointer"},
  btnSm:{background:"linear-gradient(135deg,#f97316,#ec4899)",border:"none",borderRadius:8,color:"#fff",fontWeight:600,fontSize:13,padding:"8px 16px",cursor:"pointer"},
  chip:{border:"1px solid",borderRadius:20,fontSize:13,padding:"5px 14px",cursor:"pointer",fontWeight:500,transition:"all 0.2s"},
  hdr:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16},
  back:{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,color:"#fff",fontSize:18,padding:"6px 12px",cursor:"pointer"},
  matchBadge:{background:"rgba(239,68,68,0.18)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:20,color:"#ef4444",fontSize:13,fontWeight:700,padding:"4px 12px",cursor:"pointer"},
  empty:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",color:"rgba(255,255,255,0.45)",gap:12,padding:"40px 0"},
  roomCard:{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"12px 16px",marginBottom:10,cursor:"pointer",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"},
  userCard:{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.04)",borderRadius:14,padding:"14px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,0.07)"},
  progBar:{height:3,background:"rgba(255,255,255,0.07)",borderRadius:4,marginBottom:12},
  progFill:{height:"100%",borderRadius:4,background:"linear-gradient(90deg,#f97316,#ec4899)",transition:"width 0.3s ease"},
  card:{width:"100%",maxWidth:320,borderRadius:20,position:"relative",boxShadow:"0 24px 80px rgba(0,0,0,0.7)",userSelect:"none",minHeight:430,display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"},
  likeStamp:{position:"absolute",top:16,left:16,transform:"rotate(-15deg)",border:"3px solid #22c55e",borderRadius:8,color:"#22c55e",fontWeight:900,fontSize:20,padding:"3px 10px",letterSpacing:2,pointerEvents:"none",zIndex:10},
  nopeStamp:{position:"absolute",top:16,right:16,transform:"rotate(15deg)",border:"3px solid #ef4444",borderRadius:8,color:"#ef4444",fontWeight:900,fontSize:20,padding:"3px 10px",letterSpacing:2,pointerEvents:"none",zIndex:10},
  swipeBtn:{width:64,height:64,borderRadius:"50%",border:"2px solid",fontSize:24,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  toast:{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"linear-gradient(135deg,#f97316,#ec4899)",borderRadius:20,padding:"24px 36px",textAlign:"center",color:"#fff",boxShadow:"0 20px 60px rgba(249,115,22,0.5)",zIndex:100,display:"flex",flexDirection:"column",gap:8,alignItems:"center"},
  matchCard:{background:"rgba(255,255,255,0.04)",borderRadius:12,overflow:"hidden",border:"1px solid rgba(255,255,255,0.07)"},
  genre:{background:"rgba(255,255,255,0.07)",borderRadius:20,padding:"3px 10px",color:"rgba(255,255,255,0.55)",fontSize:11},
  errorMsg:{color:"#ef4444",fontSize:12,marginTop:4,textAlign:"center",width:"100%"},
  successMsg:{color:"#22c55e",fontSize:12,marginTop:4,textAlign:"center",width:"100%"},
  menuItem:{display:"block",width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,padding:"12px 16px",cursor:"pointer",textAlign:"left"},
};
