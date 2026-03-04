"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";

// ─── TMDB CONFIG ──────────────────────────────────────────────────────────────
const TMDB_KEY  = "296a29cf236f5335daaca27b4667b5cf";
const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_W500  = "https://image.tmdb.org/t/p/w500";
const IMG_W780  = "https://image.tmdb.org/t/p/w780";

const GENRE_MAP = {
  28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",
  99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",
  27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",
  53:"Thriller",10752:"War",37:"Western",10765:"Sci-Fi & Fantasy",
  10759:"Action & Adventure",10762:"Kids",10764:"Reality",
};
const PROVIDER_MAP = {
  8:"Netflix",337:"Disney+",350:"Apple TV+",1899:"Max",
  15:"Hulu",9:"Prime Video",386:"Peacock",531:"Paramount+",
};
const ALL_SERVICES = ["Netflix","Disney+","Apple TV+","Max","Prime Video","Hulu","Peacock","Paramount+"];
const SERVICE_COLORS = {
  "Netflix":"#E50914","Disney+":"#113CCF","Apple TV+":"#4a4a4a",
  "Max":"#002BE7","Prime Video":"#00A8E1","Hulu":"#1CE783",
  "Peacock":"#F037A5","Paramount+":"#0064FF",
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
    const test = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}&language=en-US&region=US&page=1`);
    if (!test.ok) return null;
    const testData = await test.json();
    if (!testData.results?.length) return null;

    const all = [], seen = new Set();

    for (let p = 1; p <= 50; p++) {
      try {
        const r = await fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}&language=en-US&region=US&page=${p}`);
        const d = await r.json();
        if (!d.results?.length) break;
        for (const m of (d.results||[])) {
          if (seen.has(`m${m.id}`)) continue;
          seen.add(`m${m.id}`);
          all.push({ id:`m${m.id}`,tmdbId:m.id,type:"movie",title:m.title,year:m.release_date?.slice(0,4)||"",genres:(m.genre_ids||[]).map(g=>GENRE_MAP[g]).filter(Boolean).slice(0,3),poster:m.poster_path?IMG_W500+m.poster_path:null,backdrop:m.backdrop_path?IMG_W780+m.backdrop_path:null,overview:m.overview||"",rating:m.vote_average?.toFixed(1)||"",popularity:m.popularity||0,language:m.original_language||"en",services:[] });
        }
        if (p%5===0) onProgress(Math.round((p/50)*50));
      } catch(e){}
    }
    for (let p = 1; p <= 10; p++) {
      try {
        const r = await fetch(`${TMDB_BASE}/trending/tv/week?api_key=${TMDB_KEY}&language=en-US&region=US&page=${p}`);
        const d = await r.json();
        if (!d.results?.length) break;
        for (const t of (d.results||[])) {
          if (seen.has(`t${t.id}`)) continue;
          seen.add(`t${t.id}`);
          all.push({ id:`t${t.id}`,tmdbId:t.id,type:"tv",title:t.name,year:t.first_air_date?.slice(0,4)||"",genres:(t.genre_ids||[]).map(g=>GENRE_MAP[g]).filter(Boolean).slice(0,3),poster:t.poster_path?IMG_W500+t.poster_path:null,backdrop:t.backdrop_path?IMG_W780+t.backdrop_path:null,overview:t.overview||"",rating:t.vote_average?.toFixed(1)||"",popularity:t.popularity||0,language:t.original_language||"en",services:[] });
        }
      } catch(e){}
    }

    // Fetch providers for ALL titles in batches of 40 with a small delay
    // to stay within TMDB's rate limit of ~40 requests/second
    // Keep only English language titles
    const englishOnly = all.filter(t => t.language === "en");
    all.length = 0;
    all.push(...englishOnly);

    onProgress(65);
    const BATCH_SIZE = 40;
    const delay = (ms) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < all.length; i += BATCH_SIZE) {
      const batch = all.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (t) => {
        try {
          const ep = t.type==="movie"
            ? `${TMDB_BASE}/movie/${t.tmdbId}/watch/providers?api_key=${TMDB_KEY}`
            : `${TMDB_BASE}/tv/${t.tmdbId}/watch/providers?api_key=${TMDB_KEY}`;
          const r = await fetch(ep);
          if (!r.ok) return;
          const d = await r.json();
          t.services = (d.results?.US?.flatrate||[])
            .map(p=>PROVIDER_MAP[p.provider_id])
            .filter(Boolean)
            .filter(s=>ALL_SERVICES.includes(s));
        } catch(e){}
      }));
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < all.length) await delay(250);
      // Update progress from 65% to 95% as providers load
      onProgress(Math.min(95, 65 + Math.round(((i + BATCH_SIZE) / all.length) * 30)));
    }

    // Only use fallback service for titles that truly have no provider data
    const cycle = ["Netflix","Disney+","Max","Prime Video","Hulu","Apple TV+"];
    let ci = 0;
    for (const t of all) {
      if (!t.services.length) { t.services=[cycle[ci%cycle.length]]; ci++; }
    }

    onProgress(100);
    return all;
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

// Save a single swipe to the swipes table
async function saveSwipeToDB(roomId, userId, titleId, direction) {
  try {
    await supabase.from("swipes").upsert({
      room_id: roomId,
      user_id: userId,
      title_id: titleId,
      direction,
    }, { onConflict: "room_id,user_id,title_id" });
  } catch(e) {}
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

    const rooms = await Promise.all(allRooms.map(async (r) => {
      const swipesByUser = await loadSwipesForRoom(r.id);
      const mySwipes = swipesByUser[userId] || {};

      // Partner is whoever is NOT the current user
      const partnerId = r.owner_id === userId ? r.partner_id : r.owner_id;
      const partnerSwipes = swipesByUser[partnerId] || {};

      const queue = (r.queue_ids||[]).map(id=>map[id]).filter(Boolean);

      // True matches: BOTH users swiped like
      const matches = queue.filter(t =>
        mySwipes[t.id]==="like" && partnerSwipes[t.id]==="like"
      );

      // Figure out who the partner is — handle both owner and partner perspective
      let partnerInfo;
      if (r.owner_id === userId) {
        // I am the owner, partner is the invited user
        partnerInfo = { id: r.partner_id, name: r.partner_name, avatar: r.partner_avatar, services: r.partner_services||[] };
      } else {
        // I am the partner, owner is the other person — load their profile
        const { data: ownerProfile } = await supabase.from("profiles").select("*").eq("id", r.owner_id).single();
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
    }));

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

  // 2. Load catalog in background
  useEffect(() => {
    tryFetchLiveCatalog(setLoadProgress).then(live => {
      setCatalog(live?.length ? live : FALLBACK_CATALOG);
      setUsingFallback(!live?.length);
      setLoadProgress(100);
      setCatalogReady(true);
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
    <MatchesScreen room={activeRoom} onBack={()=>setScreen("swipe")}
      onToggleWatched={async (titleId) => {
        const current = activeRoom.watchedIds || [];
        const updated = current.includes(titleId)
          ? current.filter(id=>id!==titleId)
          : [...current, titleId];
        const updatedRoom = {...activeRoom, watchedIds: updated};
        setActiveRoom(updatedRoom);
        // Save to DB
        await supabase.from("rooms").update({ watched_ids: updated }).eq("id", activeRoom.id);
        // Update rooms list too
        setRooms(prev => prev.map(r => r.id===activeRoom.id ? {...r, watchedIds: updated} : r));
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
function HomeScreen({ profile, rooms, notifications, onClearNotifications, onSearch, onOpenRoom, onSignOut, onEditProfile, onDeleteRooms, onRestartTutorial }) {
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
                <button style={S.menuItem} onClick={()=>{onEditProfile();setShowMenu(false);}}>✏️ Edit Profile</button>
                <button style={S.menuItem} onClick={()=>{onRestartTutorial();setShowMenu(false);}}>🍿 Tutorial</button>
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
          const swiped=Object.keys(r.userSwipes||{}).length;
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
function FindPartner({ currentUser, catalog, rooms, setRooms, onBack, onJoinRoom, persistRoom }) {
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
  const startIdx = Object.keys(room.userSwipes||{}).length;
  const [idx, setIdx]           = useState(startIdx);
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

  // Apply filters to queue
  const queue = fullQueue.filter(t => {
    if (contentType==="movie" && t.type!=="movie") return false;
    if (contentType==="tv" && t.type!=="tv") return false;
    if (selectedGenres.length>0 && !t.genres.some(g=>selectedGenres.includes(g))) return false;
    return true;
  });

  // Find current card index within filtered queue
  const filteredIdx = Math.max(0, queue.findIndex(t=>!swipes[t.id]));
  const current = queue[filteredIdx];
  const done    = !current;
  const matches = fullQueue.filter((t)=>swipes[t.id]==="like"&&room.partnerSwipes[t.id]==="like");
  const unswiped = queue.filter(t=>!swipes[t.id]).length;

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
    setTimeout(()=>{ setIdx(i=>i+1); setExiting(null); setDragX(0); exitingRef.current=false; },320);
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
function MatchesScreen({ room, onBack, onToggleWatched }) {
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
                    <button onClick={()=>onToggleWatched(t.id)}
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
                <div key={t.id} style={{...S.matchCard,opacity:0.5}}>
                  <div style={{position:"relative"}}>
                    {t.poster?<img src={t.poster} style={{width:"100%",height:165,objectFit:"cover",borderRadius:"10px 10px 0 0"}}/>:<div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎬</div>}
                    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>✅</div>
                  </div>
                  <div style={{padding:"8px 8px 10px"}}>
                    <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:6,lineHeight:1.3}}>{t.title}</div>
                    <button onClick={()=>onToggleWatched(t.id)}
                      style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,color:"rgba(255,255,255,0.4)",fontSize:11,padding:"5px",cursor:"pointer"}}>
                      ↩ Unmark
                    </button>
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
function Flixie({ size = 80, animate = false }) {
  return (
    <div style={{
      width: size, height: size,
      animation: animate ? "flixieBounce 0.6s ease infinite alternate" : "none",
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
        @keyframes flixieBounce {
          from { transform: translateY(0px) rotate(-3deg); }
          to   { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes flixiePop {
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
function FlixieBubble({ message, subtext, style = {} }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      animation: "slideUp 0.4s ease", ...style
    }}>
      <Flixie size={90} animate={true}/>
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
  { id: "demo1", title: "The Popcorn Chronicles", year: "2024", type: "movie",
    genres: ["Comedy", "Adventure"], rating: "9.9", services: ["Netflix"],
    overview: "A sentient bag of popcorn navigates the existential crisis of being delicious.",
    poster: null, backdrop: null },
  { id: "demo2", title: "Butter Me Up", year: "2024", type: "movie",
    genres: ["Romance", "Drama"], rating: "8.5", services: ["Disney+"],
    overview: "Two kernels fall in love inside a microwave. A tale of heat, pressure, and transformation.",
    poster: null, backdrop: null },
];

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

  const FLIXIE_USER = {
    id: "flixie-demo", name: "Flixie 🍿",
    services: ["Netflix","Disney+","Max","Prime Video","Hulu","Apple TV+","Peacock","Paramount+"]
  };

  // Steps: 0=intro, 1=home, 2=find partner, 3=room created, 4=swipe left, 5=swipe right, 6=match, 7=notifications, 8=watched, 9=done
  const steps = [
    { flixie: "Hey there, superstar! 🎉 I'm Flixie, your personal popcorn guide!", sub: "I'll walk you through DuoFlix in about 2 minutes. Try not to eat me." },
    { flixie: "This is your home screen! It's where all your watch rooms live.", sub: "Think of rooms like movie dates — one for each person you watch with. Fancy, right?" },
    { flixie: "First things first — tap 'Find a Watch Partner' down below!", sub: "Go on, I won't bite. I'm a bag of popcorn." },
    { flixie: "Ooh look, it's me! 👋 I've been waiting here for AGES.", sub: "Tap 'Invite' next to my name and let's create our room!" },
    { flixie: "Welcome to your swipe room! Now pay attention — this is important.", sub: "Swipe LEFT on anything you'd rather watch paint dry than sit through." },
    { flixie: "Now swipe RIGHT on something you actually want to watch!", sub: "Go on, I already liked it. We're basically soulmates now. 🎬" },
    { flixie: "IT'S A MATCH! 🎉 We both want to watch that!", sub: "See that ❤️ button in the top right? Tap it to see your matches!" },
    { flixie: "These are your matches! Only shows up when BOTH of you swipe right.", sub: "Tap the 🔔 bell on the home screen — that's where I'll ping you when new matches happen!" },
    { flixie: "Once you've watched something together, mark it watched!", sub: "Hit 'Mark Watched' so it moves out of your queue. No rewatching unless you really want to." },
    { flixie: "You're officially a DuoFlix pro! 🍿🎬", sub: "Now go find a real watch partner and start swiping. I'll be here if you need me!" },
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
    <div style={{...S.page, alignItems:"center", padding:"40px 28px 40px", boxSizing:"border-box", gap:28}}>
      <div style={S.bigLogo}>DuoFlix</div>
      <div style={{animation:"flixiePop 0.5s ease"}}>
        <Flixie size={130} animate={true}/>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{color:"#fff",fontSize:24,fontWeight:800,marginBottom:12}}>Meet Flixie! 🍿</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,lineHeight:1.7}}>{current.flixie}</div>
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
        <FlixieBubble message={current.flixie} subtext={current.sub}/>
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
        <FlixieBubble message={current.flixie} subtext={current.sub}/>
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
        <input style={S.input} placeholder="Search by name..." defaultValue="Flixie" readOnly/>
        <div style={{marginTop:16}}>
          <div style={{...S.userCard, border:"1px solid rgba(249,115,22,0.5)", background:"rgba(249,115,22,0.08)"}}>
            <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#ec4899)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🍿</div>
            <div style={{flex:1}}>
              <div style={{color:"#fff",fontWeight:600}}>Flixie 🍿</div>
              <div style={S.muted}>Netflix · Disney+ · Max · +5 more</div>
            </div>
            <button style={{...S.btnSm, animation:"pulse 1.2s ease infinite"}} onClick={next}>Invite</button>
          </div>
        </div>
      </div>
      <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <FlixieBubble message={current.flixie} subtext={current.sub}/>
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
            <div>Flixie 🍿</div>
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
              <div style={{width:158,height:237,borderRadius:12,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>🎬</div>
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
          {wrongSwipe&&<div style={{color:"#f97316",fontSize:12,textAlign:"center",marginTop:8,animation:"slideUp 0.3s ease"}}>👈 Nope! Flixie says swipe LEFT on this one!</div>}
        </div>
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
          <FlixieBubble message={wrongSwipe?"Psst! The ✕ button! LEFT! Do I need to draw you a map? 🗺️":current.flixie} subtext={wrongSwipe?"Swipe left = skip. Got it? Good.":current.sub}/>
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
            <div>Flixie 🍿</div>
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
              <div style={{width:158,height:237,borderRadius:12,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:60}}>🍿</div>
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
              <div style={{opacity:0.85,fontSize:13,textAlign:"center"}}>Butter Me Up</div>
            </div>
          )}
          <div style={{display:"flex",gap:40,marginTop:18}}>
            <button style={{...S.swipeBtn,borderColor:"rgba(239,68,68,0.5)",color:"#ef4444",background:"rgba(239,68,68,0.1)",opacity:0.3,cursor:"not-allowed"}} onClick={()=>setWrongSwipe(true)}>✕</button>
            <button style={{...S.swipeBtn,borderColor:"rgba(34,197,94,0.5)",color:"#22c55e",background:"rgba(34,197,94,0.1)",animation:"pulse 1.2s ease infinite"}} onClick={()=>handleSwipe("like")}>♥</button>
          </div>
          {wrongSwipe&&<div style={{color:"#f97316",fontSize:12,textAlign:"center",marginTop:8,animation:"slideUp 0.3s ease"}}>👉 Other way! Flixie believes in you. Mostly.</div>}
        </div>
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
          <FlixieBubble message={wrongSwipe?"Really?! The ♥ button! RIGHT! We just went over this! 🤦":current.flixie} subtext={wrongSwipe?"Swipe right = want to watch. You've got this!":current.sub}/>
        </div>
      </div></div>
    );
  }

  // ── STEP 6: Match! Tap the heart ──
  if (step === 6) return (
    <div style={S.page}><div style={S.shell}>
      <header style={S.hdr}>
        <div style={{color:"#fff",fontWeight:700,fontSize:14}}>Flixie 🍿</div>
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
        <FlixieBubble message={current.flixie} subtext={current.sub}/>
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
                      <div style={{color:"#fff",fontSize:13}}>🎉 You matched on "Butter Me Up"!</div>
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
                <div style={{color:"#fff",fontWeight:600}}>Flixie 🍿</div>
                <div style={S.muted}>❤️ 1 match · 100% swiped</div>
              </div>
            </div>
            <div style={{color:"rgba(255,255,255,0.25)",fontSize:20}}>→</div>
          </div>
        </div>
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,padding:"0 20px",zIndex:100,display:"flex",justifyContent:"center"}}>
          <FlixieBubble message={bellTapped?"Boom! 🔔 That's how you get notified!":current.flixie} subtext={bellTapped?"Now go check those matches!":current.sub}/>
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
              <div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>🍿</div>
              <div style={{padding:"8px 8px 10px"}}>
                <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:6}}>Butter Me Up</div>
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
                <div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:48}}>🍿</div>
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
        <FlixieBubble message={watchedIt ? "Look at you go! ✅ That's how it works!" : current.flixie} subtext={watchedIt ? "Both you and your partner see this update instantly." : current.sub}/>
      </div>
    </div></div>
  );

  // ── STEP 9: Done! ──
  return (
    <div style={{...S.page, alignItems:"center", padding:"40px 28px 40px", boxSizing:"border-box", gap:28}}>
      <div style={S.bigLogo}>DuoFlix</div>
      <div style={{animation:"flixiePop 0.5s ease"}}>
        <Flixie size={130} animate={true}/>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{color:"#fff",fontSize:26,fontWeight:800,marginBottom:12}}>You're ready! 🎉</div>
        <div style={{color:"rgba(255,255,255,0.6)",fontSize:15,lineHeight:1.7}}>{current.flixie}</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:13,lineHeight:1.6,marginTop:8}}>{current.sub}</div>
      </div>
      <button style={{...S.btn,width:"100%",fontSize:16,padding:"14px"}} onClick={onComplete}>
        Let's Start Swiping! 🍿
      </button>
    </div>
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function shuffle(arr){for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function genSwipes(titles){const s={};titles.forEach((t)=>{s[t.id]=Math.random()>0.42?"like":"pass";});return s;}

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
