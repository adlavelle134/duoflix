// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
// Replace these two values with your own from:
// https://supabase.com → your project → Settings → API
//
// SUPABASE_URL      → "Project URL"
// SUPABASE_ANON_KEY → "anon / public" key
//
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://mynvnadupgzrwdpndfhv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15bnZuYWR1cGd6cndkcG5kZmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NTAwMDgsImV4cCI6MjA4ODEyNjAwOH0.3oSOBg4gnnqMz9i9e08AAbikpddd2yzlJPXvtDEkdmU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── SUPABASE SETUP INSTRUCTIONS ─────────────────────────────────────────────
//
// 1. Go to https://supabase.com and create a free project
//
// 2. In your Supabase dashboard, go to the SQL Editor and run this:
//
//    create table public.profiles (
//      id uuid references auth.users on delete cascade primary key,
//      name text not null,
//      services text[] default '{}',
//      created_at timestamp with time zone default timezone('utc', now())
//    );
//
//    create table public.rooms (
//      id text primary key,
//      owner_id uuid references public.profiles(id) on delete cascade,
//      partner_id text not null,
//      partner_name text not null,
//      partner_avatar text not null,
//      partner_services text[] default '{}',
//      shared_services text[] default '{}',
//      queue_ids text[] default '{}',
//      user_swipes jsonb default '{}',
//      partner_swipes jsonb default '{}',
//      match_ids text[] default '{}',
//      updated_at timestamp with time zone default timezone('utc', now())
//    );
//
//    -- Enable Row Level Security
//    alter table public.profiles enable row level security;
//    alter table public.rooms enable row level security;
//
//    -- Profiles: users can only read/write their own profile
//    create policy "Users can view own profile"
//      on public.profiles for select using (auth.uid() = id);
//    create policy "Users can insert own profile"
//      on public.profiles for insert with check (auth.uid() = id);
//    create policy "Users can update own profile"
//      on public.profiles for update using (auth.uid() = id);
//
//    -- Rooms: users can only read/write their own rooms
//    create policy "Users can manage own rooms"
//      on public.rooms for all using (auth.uid() = owner_id);
//
// 3. Replace SUPABASE_URL and SUPABASE_ANON_KEY above with your project values
//
// 4. In Supabase → Authentication → Settings, make sure email auth is enabled
//
// ─────────────────────────────────────────────────────────────────────────────
