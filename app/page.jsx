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
    partner_avatar: room.partner.avatar,
    partner_services: room.partner.services,
    shared_services: room.sharedServices,
    queue_ids: room.queue.map((t)=>t.id),
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
      };
    }));

    return rooms;
  } catch(e) {
    console.error("loadRoomsFromDB error:", e);
    return [];
  }
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function DuoFlix() {
  const [screen, setScreen]       = useState("loading"); // loading | auth | setup | home | search | swipe | matches
  const [authUser, setAuthUser]   = useState(null);      // Supabase auth user
  const [profile, setProfile]     = useState(null);      // { name, services }
  const [activeRoom, setActiveRoom] = useState(null);
  const [rooms, setRooms]         = useState([]);
  const [catalog, setCatalog]     = useState([]);
  const [loadProgress, setLoadProgress] = useState(0);
  const [catalogReady, setCatalogReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

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
      if (p) { setProfile(p); setScreen("home"); }
      else setScreen("setup");
    });
  }, [authUser, screen]);

  // 4. Load rooms once catalog + profile ready
  useEffect(() => {
    if (!authUser || !catalogReady || !profile) return;
    loadRoomsFromDB(authUser.id, catalog).then(saved => {
      setRooms(saved || []);
    });
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
  if (screen === "setup")   return (
    <ProfileSetup
      email={authUser?.email}
      catalogReady={catalogReady} loadProgress={loadProgress} usingFallback={usingFallback}
      onComplete={async (name, services) => {
        await upsertProfile(authUser.id, name, services);
        setProfile({ name, services });
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
    <MatchesScreen room={activeRoom} onBack={()=>setScreen("swipe")} />
  );
  return (
    <HomeScreen
      profile={profile} rooms={rooms}
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
      <svg width="90" height="88" viewBox="0 0 90 88" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="45" cy="11" r="8" fill="#FFF176"/>
  <circle cx="32" cy="15" r="7" fill="#FFF9C4"/>
  <circle cx="58" cy="15" r="7" fill="#FFF176"/>
  <circle cx="22" cy="24" r="6" fill="#FFF9C4"/>
  <circle cx="68" cy="24" r="6" fill="#FFF176"/>
  <circle cx="38" cy="9" r="6" fill="#FFF176"/>
  <circle cx="52" cy="9" r="6" fill="#FFF9C4"/>
  <circle cx="45" cy="22" r="7" fill="#FFF9C4"/>
  <circle cx="28" cy="28" r="6" fill="#FFF176"/>
  <circle cx="62" cy="28" r="6" fill="#FFF9C4"/>
  <circle cx="17" cy="34" r="5" fill="#FFF176"/>
  <circle cx="73" cy="34" r="5" fill="#FFF9C4"/>
  <path d="M20 40 L25 78 L65 78 L70 40 Z" fill="#ffffff"/>
  <path d="M20 40 L25 78 L30 78 L25 40 Z" fill="#E53935"/>
  <path d="M34 40 L39 78 L44 78 L39 40 Z" fill="#E53935"/>
  <path d="M48 40 L53 78 L58 78 L53 40 Z" fill="#E53935"/>
  <path d="M62 40 L65 78 L70 78 L70 40 Z" fill="#E53935"/>
  <rect x="17" y="36" width="56" height="7" rx="3.5" fill="#E53935"/>
</svg>
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
function HomeScreen({ profile, rooms, onSearch, onOpenRoom, onSignOut, onEditProfile, onDeleteRooms }) {
  const [showMenu, setShowMenu]   = useState(false);
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
function MatchesScreen({ room, onBack }) {
  const matches=(room.queue||[]).filter(t=>room.userSwipes[t.id]==="like"&&room.partnerSwipes[t.id]==="like");
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
        :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,overflowY:"auto"}}>
          {matches.map(t=>(
            <div key={t.id} style={S.matchCard}>
              {t.poster?<img src={t.poster} style={{width:"100%",height:165,objectFit:"cover",borderRadius:"10px 10px 0 0"}}/>:<div style={{width:"100%",height:165,background:"rgba(255,255,255,0.06)",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>🎬</div>}
              <div style={{padding:"8px 8px 10px"}}>
                <div style={{color:"#fff",fontWeight:600,fontSize:12,textAlign:"center",marginBottom:4,lineHeight:1.3}}>{t.title}</div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"center"}}>
                  {t.services.map(s=><span key={s} style={{background:SERVICE_COLORS[s]||"#444",borderRadius:3,padding:"1px 5px",fontSize:9,color:"#fff"}}>{s}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      }
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
