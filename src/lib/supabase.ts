// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Missing Supabase credentials (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)");
}

// ✅ Singleton pattern — only one instance per browser context
let supabaseClient;

if (!window._supabaseClient) {
  window._supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

supabaseClient = window._supabaseClient;

export const supabase = supabaseClient;
