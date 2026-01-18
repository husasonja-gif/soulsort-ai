import { NextResponse } from 'next/server'

export async function GET() {
  // Check environment variables (without exposing values)
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if service role key has a value (not just empty string)
  const serviceRoleKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  
  return NextResponse.json({
    environment: {
      hasServiceRoleKey,
      serviceRoleKeyLength,
      hasSupabaseUrl,
      hasAnonKey,
      nodeEnv: process.env.NODE_ENV,
    },
    message: hasServiceRoleKey && serviceRoleKeyLength > 0
      ? 'Environment variables are set correctly'
      : 'SUPABASE_SERVICE_ROLE_KEY is missing or empty. Please check your .env.local file.',
  })
}



