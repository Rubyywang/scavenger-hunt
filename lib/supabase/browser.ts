import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

// Singleton browser client using the anon key — safe to expose.
// Used for realtime subscriptions only; all data mutations go through API routes.
export const browserClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
