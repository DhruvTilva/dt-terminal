import { NextRequest, NextResponse } from 'next/server'
import { fetchStocks, fetchIndices } from '@/lib/stocks'
import { fetchNews } from '@/lib/news'
import { detectOpportunities } from '@/lib/intelligence'

// Vercel Cron Job - runs every 5 minutes during market hours
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [stocks, indices, news] = await Promise.all([
      fetchStocks(),
      fetchIndices(),
      fetchNews(),
    ])

    const opportunities = detectOpportunities(stocks, news)

    // Log for monitoring
    console.log(`[CRON] ${new Date().toISOString()} - Stocks: ${stocks.length}, News: ${news.length}, Opportunities: ${opportunities.length}`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts: {
        stocks: stocks.length,
        indices: indices.length,
        news: news.length,
        opportunities: opportunities.length,
      },
    })
  } catch (error) {
    console.error('[CRON] Error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
