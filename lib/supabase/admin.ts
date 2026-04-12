import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

// Server-only client using the service role key — bypasses RLS.
// Never import this file from client components or expose the key to the browser.
export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
