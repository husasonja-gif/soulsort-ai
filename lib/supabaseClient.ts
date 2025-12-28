import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// createBrowserClient automatically handles PKCE code verifier storage in cookies
// for SSR compatibility
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
