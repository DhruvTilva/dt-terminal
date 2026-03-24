import { NextResponse } from 'next/server'
import { fetchNews } from '@/lib/news'

export async function GET() {
  try {
    const news = await fetchNews()
    return NextResponse.json(news)
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
