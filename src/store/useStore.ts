'use client'

import { create } from 'zustand'
import type { Stock, IndexData, NewsItem, Opportunity, Alert, WatchlistItem, BookmarkItem } from '@/types'

interface AppState {
  // Market data
  indices: IndexData[]
  stocks: Stock[]
  news: NewsItem[]
  opportunities: Opportunity[]
  alerts: Alert[]

  // User data
  watchlist: WatchlistItem[]
  bookmarks: BookmarkItem[]

  // UI state
  theme: 'light' | 'dark'
  isLoading: boolean
  isRefreshing: boolean
  lastUpdated: string | null
  newItemIds: string[]
  activeFilter: 'all' | 'high_impact' | 'opportunities' | 'bullish' | 'bearish'
  searchQuery: string
  opportunityTypeFilter: string | null
  selectedNews: import('@/types').NewsItem | null

  // Actions
  setIndices: (indices: IndexData[]) => void
  setStocks: (stocks: Stock[]) => void
  setNews: (news: NewsItem[]) => void
  setOpportunities: (opportunities: Opportunity[]) => void
  addAlert: (alert: Alert) => void
  markAlertRead: (id: string) => void
  clearAlerts: () => void
  setAlerts: (alerts: Alert[]) => void
  setWatchlist: (watchlist: WatchlistItem[]) => void
  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (symbol: string) => void
  setBookmarks: (bookmarks: BookmarkItem[]) => void
  addBookmark: (bookmark: BookmarkItem) => void
  removeBookmark: (newsId: string) => void
  toggleTheme: () => void
  setLoading: (loading: boolean) => void
  setRefreshing: (v: boolean) => void
  setLastUpdated: (ts: string | null) => void
  setNewItemIds: (ids: string[]) => void
  setActiveFilter: (filter: AppState['activeFilter']) => void
  setSearchQuery: (query: string) => void
  setOpportunityTypeFilter: (type: string | null) => void
  setSelectedNews: (item: import('@/types').NewsItem | null) => void
}

export const useStore = create<AppState>((set) => ({
  indices: [],
  stocks: [],
  news: [],
  opportunities: [],
  alerts: [],
  watchlist: [],
  bookmarks: [],
  theme: 'dark',
  isLoading: true,
  isRefreshing: false,
  lastUpdated: null,
  newItemIds: [],
  activeFilter: 'all',
  searchQuery: '',
  opportunityTypeFilter: null,
  selectedNews: null,

  setIndices: (indices) => set({ indices }),
  setStocks: (stocks) => set({ stocks }),
  setNews: (news) => set({ news }),
  setOpportunities: (opportunities) => set({ opportunities }),

  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50),
  })),
  markAlertRead: (id) => set((state) => ({
    alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
  })),
  clearAlerts: () => set({ alerts: [] }),
  setAlerts: (alerts) => set({ alerts }),

  setWatchlist: (watchlist) => set({ watchlist }),
  addToWatchlist: (item) => set((state) => ({
    watchlist: [...state.watchlist, item],
  })),
  removeFromWatchlist: (symbol) => set((state) => ({
    watchlist: state.watchlist.filter(w => w.symbol !== symbol),
  })),

  setBookmarks: (bookmarks) => set({ bookmarks }),
  addBookmark: (bookmark) => set((state) => ({
    bookmarks: [bookmark, ...state.bookmarks],
  })),
  removeBookmark: (newsId) => set((state) => ({
    bookmarks: state.bookmarks.filter(b => b.newsId !== newsId),
  })),

  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      localStorage.setItem('theme', newTheme)
    }
    return { theme: newTheme }
  }),

  setLoading: (isLoading) => set({ isLoading }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setLastUpdated: (lastUpdated) => set({ lastUpdated }),
  setNewItemIds: (newItemIds) => set({ newItemIds }),
  setActiveFilter: (activeFilter) => set({ activeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setOpportunityTypeFilter: (opportunityTypeFilter) => set({ opportunityTypeFilter }),
  setSelectedNews: (selectedNews) => set({ selectedNews }),
}))
