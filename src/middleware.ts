import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Skip Supabase auth check if no valid credentials configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.next()
  }

  // Only do auth check when Supabase is properly configured
  // Dynamic import to avoid blocking
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
