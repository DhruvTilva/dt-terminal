export interface Stock {
  symbol: string
  name: string
  exchange: 'NSE' | 'BSE'
  price: number
  change: number
  changePercent: number
  volume: number
  avgVolume?: number
  high: number
  low: number
  open: number
  prevClose: number
  marketCap?: number
  lastUpdated: string
}

export interface IndexData {
  name: string
  value: number
  change: number
  changePercent: number
  lastUpdated: string
}

export interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  sourceUrl: string
  publishedAt: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  impact: 'high' | 'medium' | 'low'
  timing?: 'immediate' | 'short-term' | 'informational'
  relatedStocks: string[]
  category: string
  imageUrl?: string
}

export interface Opportunity {
  id: string
  symbol: string
  stockName: string
  type: 'breakout' | 'volume_spike' | 'gap_up' | 'gap_down' | 'news_correlation'
  reason: string
  details: string
  price: number
  changePercent: number
  volume?: number
  avgVolume?: number
  relatedNewsId?: string
  detectedAt: string
  impact: 'high' | 'medium' | 'low'
}

export interface WatchlistItem {
  id: string
  userId: string
  symbol: string
  name: string
  exchange: 'NSE' | 'BSE'
  addedAt: string
}

export interface BookmarkItem {
  id: string
  userId: string
  newsId: string
  news: NewsItem
  savedAt: string
}

export interface Alert {
  id: string
  type: 'news' | 'price' | 'opportunity'
  title: string
  message: string
  impact: 'high' | 'medium' | 'low'
  symbol?: string
  timestamp: string
  read: boolean
}

// DB-backed persistent notification (admin messages + smart auto alerts)
export interface DbNotification {
  id: string
  user_id: string | null          // null = global (shown to all users)
  stock_symbol: string | null
  message: string
  type: 'admin' | 'auto'
  category: 'insider' | 'bulk' | 'fii' | 'pump_dump' | 'promoter_selling' | 'weak_fundamentals' | null
  is_read: boolean
  created_at: string
}

export interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

export interface MarketStatus {
  isOpen: boolean
  nextOpenTime?: string
  nextCloseTime?: string
}
