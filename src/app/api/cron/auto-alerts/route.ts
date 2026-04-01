import { NextRequest, NextResponse } from 'next/server'
import { fetchStocks } from '@/lib/stocks'
import { fetchNews } from '@/lib/news'
import { generateAutoAlerts } from '@/lib/auto-alerts'

// Cron endpoint: Smart Auto Alert Detection
// Triggered every 30 min during market hours via GitHub Actions
// Uses CRON_SECRET for auth — same pattern as existing cron jobs
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch fresh data (parallel for speed)
    const [stocks, news] = await Promise.all([fetchStocks(), fetchNews()])

    const count = await generateAutoAlerts(news, stocks)

    console.log(`[AUTO-ALERTS CRON] ${new Date().toISOString()} — generated ${count} alert(s)`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alertsGenerated: count,
      dataPoints: { stocks: stocks.length, news: news.length },
    })
  } catch (error) {
    console.error('[AUTO-ALERTS CRON] Error:', error)
    return NextResponse.json({ error: 'Auto alerts cron failed' }, { status: 500 })
  }
}
