'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useStore } from '@/store/useStore'

export function useMarketData() {
  const {
    setIndices, setStocks, setNews, setOpportunities,
    setLoading, addAlert,
    setRefreshing, setLastUpdated, setNewItemIds,
  } = useStore()
  const intervalRef = useRef<NodeJS.Timeout>(null)
  const hasFetched = useRef(false)
  const prevNewsIdsRef = useRef<Set<string>>(new Set())

  const fetchAllData = useCallback(async () => {
    setRefreshing(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000) // 8s timeout

      const [indicesRes, stocksRes, newsRes] = await Promise.allSettled([
        fetch('/api/stocks?type=indices', { signal: controller.signal }),
        fetch('/api/stocks?type=stocks', { signal: controller.signal }),
        fetch('/api/news', { signal: controller.signal }),
      ])

      clearTimeout(timeout)

      if (indicesRes.status === 'fulfilled' && indicesRes.value.ok) {
        const data = await indicesRes.value.json()
        if (Array.isArray(data)) setIndices(data)
      }

      let stocksData: any[] = []
      if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
        stocksData = await stocksRes.value.json()
        if (Array.isArray(stocksData)) setStocks(stocksData)
      }

      let newsData: any[] = []
      if (newsRes.status === 'fulfilled' && newsRes.value.ok) {
        newsData = await newsRes.value.json()
        if (Array.isArray(newsData)) {
          // Detect new items only after the initial load
          if (hasFetched.current && prevNewsIdsRef.current.size > 0) {
            const newIds = newsData
              .filter((n: any) => !prevNewsIdsRef.current.has(n.id))
              .map((n: any) => n.id as string)
            if (newIds.length > 0) {
              setNewItemIds(newIds)
              setTimeout(() => setNewItemIds([]), 6000)
            }
          }
          prevNewsIdsRef.current = new Set(newsData.map((n: any) => n.id as string))
          setNews(newsData)
        }
      }

      setLastUpdated(new Date().toISOString())

      // Detect opportunities in background
      if (stocksData.length > 0) {
        fetch('/api/stocks?type=opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stocks: stocksData, news: newsData }),
        })
          .then(res => res.ok ? res.json() : [])
          .then(oppData => {
            if (Array.isArray(oppData)) {
              setOpportunities(oppData)
              oppData
                .filter((o: any) => o.impact === 'high')
                .slice(0, 3)
                .forEach((o: any) => {
                  addAlert({
                    id: `alert-${o.id}`,
                    type: 'opportunity',
                    title: `${o.type.replace('_', ' ').toUpperCase()}: ${o.symbol}`,
                    message: o.reason,
                    impact: o.impact,
                    symbol: o.symbol,
                    timestamp: new Date().toISOString(),
                    read: false,
                  })
                })
            }
          })
          .catch(() => {})
      }
    } catch {
      // Network error — UI still renders
    } finally {
      setLoading(false)
      setRefreshing(false)
      hasFetched.current = true
    }
  }, [setIndices, setStocks, setNews, setOpportunities, setLoading, addAlert, setRefreshing, setLastUpdated, setNewItemIds])

  useEffect(() => {
    if (!hasFetched.current) {
      // Show UI immediately, fetch data in background
      setLoading(false)
      fetchAllData()
    }

    intervalRef.current = setInterval(fetchAllData, 60000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchAllData, setLoading])

  return { refresh: fetchAllData }
}
