import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === "your_supabase_project_url") {
    console.error(
      "❌ Supabase environment variables are missing! " +
      "Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "are set in .env.local (for local dev) or in Vercel project settings (for production)."
    );
    // Return a dummy client or throw a descriptive error to avoid crashing silently
    return createSupabaseClient(
      url || "https://placeholder-url.supabase.co",
      anonKey || "placeholder-key"
    );
  }

  return createSupabaseClient(url, anonKey);
}
