'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useStore } from '@/store/useStore'

type ValuationData = {
  pegRatio: number
  priceToFCF: number
  dcf: { bear: number; base: number; bull: number }
  historicalPE: { current: number; min: number; max: number; avg: number; history: any[] }
  verdict: string
  score: number
  explanation: string
}

type SmartMoneyData = {
  holdings: { promoter: number; fii: number; dii: number; retail: number }
  sentiment: string
  sentimentScore: number
  recentDeals: any[]
  institutionsCount: number
}

type RiskData = {
  verdict: string
  score: number
  flags: { category: string; type: string; message: string }[]
  beta: number
  debtToEquity: number
  currentRatio: number
}

type SectorData = {
  sector: string
  mappedIndex: string
  performance: { period: string; nifty: number; sector: number }[]
  phase: string
  phaseDesc: string
  color: string
}

type EntryData = {
  currentPrice: number;
  indicators: { rsi14: number; sma50: number; sma200: number; distFrom200DMA: number; };
  verdict: string;
  score: number;
  action: string;
}

type DNAData = {
  symbol: string
  name: string
  sector: string
  price: number
  high52: number
  low52: number
  metrics: {
    pe: number
    pb: number
    evEbitda: number
    revenueTTM: number
    revenueGrowth: number
    netProfit: number
    profitGrowth: number
    roe: number
    roce: number
    debtToEquity: number
    fcf: number
    marketCap: number
    promoterHolding: number
  }
  scores: {
    businessQuality: number
    promoterTrust: number
    earningsQuality: number
    overallDNA: number
  }
  moatTag: string
  summaryText: string
  valuation?: ValuationData | null
  smartMoney?: SmartMoneyData | null
  risk?: RiskData | null
  sectorMap?: SectorData | null
  entryMap?: EntryData | null
}

const PREBUILT_BASKETS = [
  {
    name: 'Compounder Kings 👑',
    desc: 'High RoCE, consistent revenue growth, and strong moats.',
    symbols: ['TCS', 'ASIANPAINT', 'TITAN', 'HDFCBANK', 'PIDILITIND'],
  },
  {
    name: 'Debt-Free Gems 💎',
    desc: 'Zero/negligible debt companies with high free cash flow.',
    symbols: ['INFY', 'ITC', 'LTIM', 'CDSL', 'HAL'],
  },
  {
    name: 'Momentum Tech & EV ⚡',
    desc: 'Companies riding the electrification and software wave.',
    symbols: ['TATAMOTORS', 'KPITTECH', 'TATAELXSI', 'ZOMATO'],
  }
]

const WealthProjector = ({ symbol, defaultCagr }: { symbol: string, defaultCagr: number }) => {
  const [initial, setInitial] = useState<number>(100000)
  const [sip, setSip] = useState<number>(10000)
  const [years, setYears] = useState<number>(10)
  const [rate, setRate] = useState<number>(defaultCagr > 0 && defaultCagr < 50 ? defaultCagr : 15)

  const months = years * 12;
  const monthlyRate = rate / 100 / 12;

  const lumpsumFv = initial * Math.pow(1 + rate / 100, years);
  const sipFv = sip > 0 && monthlyRate > 0
    ? sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
    : sip * months;

  const totalFv = lumpsumFv + sipFv;
  const totalInvested = initial + sip * months;
  const totalGains = totalFv - totalInvested;

  const investedPercent = (totalInvested / totalFv) * 100;
  const gainsPercent = (totalGains / totalFv) * 100;

  const formatLakhsCrores = (num: number) => {
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`
    return `₹${num.toFixed(0)}`
  }

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-5">
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-border-primary pb-3">
        <div>
          <h3 className="text-[13px] font-bold text-[#E6EDF3] flex items-center gap-1.5 tracking-wide">
            <span className="text-green text-[15px]">🪄</span> WEALTH PROJECTOR
          </h3>
          <p className="text-[11px] font-mono text-[#6B7A90] mt-1 opacity-80">Compound {symbol}</p>
        </div>
        <div className="px-3 py-1 rounded border bg-green/10 border-green/20 text-green font-bold font-mono text-[10px] tracking-wider uppercase">
          {years}Y Horizon
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-center">
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-4 w-full">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-mono text-[#6B7A90] tracking-wider">LUMPSUM</label>
              <span className="text-[11px] font-mono font-bold text-[#E6EDF3]">{formatLakhsCrores(initial)}</span>
            </div>
            <input
              type="range" min="0" max="1000000" step="10000"
              value={initial} onChange={(e) => setInitial(Number(e.target.value))}
              className="w-full h-1 bg-[#1E2A3B] rounded-lg appearance-none cursor-pointer accent-blue"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-mono text-[#6B7A90] tracking-wider">SIP/MO</label>
              <span className="text-[11px] font-mono font-bold text-[#E6EDF3]">{formatLakhsCrores(sip)}</span>
            </div>
            <input
              type="range" min="0" max="500000" step="5000"
              value={sip} onChange={(e) => setSip(Number(e.target.value))}
              className="w-full h-1 bg-[#1E2A3B] rounded-lg appearance-none cursor-pointer accent-blue"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-mono text-[#6B7A90] tracking-wider">YEARS</label>
              <span className="text-[11px] font-mono font-bold text-[#E6EDF3]">{years} YR</span>
            </div>
            <input
              type="range" min="1" max="40" step="1"
              value={years} onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-1 bg-[#1E2A3B] rounded-lg appearance-none cursor-pointer accent-green"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-mono text-[#6B7A90] tracking-wider">CAGR</label>
              <span className="text-[11px] font-mono font-bold text-green">{rate}%</span>
            </div>
            <input
              type="range" min="5" max="40" step="1"
              value={rate} onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-1 bg-[#1E2A3B] rounded-lg appearance-none cursor-pointer accent-green"
            />
          </div>
        </div>

        <div className="w-full xl:w-[240px] bg-[#0B1220] p-4 rounded-lg border border-[#1E2A3B] shadow-inner flex flex-col justify-center">
          <div className="text-center mb-4">
            <h4 className="text-[10px] font-mono text-[#6B7A90] tracking-widest uppercase mb-1">Projected Wealth</h4>
            <div className="text-2xl font-black font-mono text-[#E6EDF3] drop-shadow-md">
              {formatLakhsCrores(totalFv)}
            </div>
            <div className="text-[10px] font-mono text-green mt-0.5">
              +{(totalFv / (totalInvested || 1)).toFixed(1)}x Multiple
            </div>
          </div>

          <div className="w-full">
            <div className="flex justify-between text-[9px] font-mono mb-1.5 px-0.5 uppercase tracking-wider">
              <span className="text-blue">Inv: {formatLakhsCrores(totalInvested)}</span>
              <span className="text-green">Gain: {formatLakhsCrores(totalGains)}</span>
            </div>
            <div className="h-2 w-full flex rounded-full overflow-hidden border border-[#1E2A3B]">
              <div className="bg-blue" style={{ width: `${investedPercent}%` }} />
              <div className="bg-green" style={{ width: `${gainsPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LongTermEnginePage() {
  const { stocks } = useStore()
  const [activeTab, setActiveTab] = useState<'analyzer' | 'portfolio'>('analyzer')
  const [query, setQuery] = useState('RELIANCE')
  const [data, setData] = useState<DNAData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  const [customBasket, setCustomBasket] = useState<string[]>([])
  const [basketData, setBasketData] = useState<any>(null)
  const [basketLoading, setBasketLoading] = useState(false)

  // Real data state for Prebuilt baskets
  const [prebuiltStats, setPrebuiltStats] = useState<Record<number, any>>({})
  const [prebuiltLoading, setPrebuiltLoading] = useState(false)

  // Smart Search logic
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searching, setSearching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const fetchUserBasket = async () => {
      try {
        const res = await fetch('/api/longterm/basket/user')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setCustomBasket(data.map((item: any) => item.symbol))
          }
        }
      } catch (err) { }
    }
    fetchUserBasket()

    const lastSearch = localStorage.getItem('dt_lte_last_search')
    if (lastSearch) setQuery(lastSearch)
  }, [])

  useEffect(() => {
    if (activeTab === 'portfolio' && customBasket.length > 0) {
      fetchBasketData()
    }
    if (activeTab === 'portfolio' && Object.keys(prebuiltStats).length === 0) {
      fetchPrebuiltStats()
    }
  }, [activeTab, customBasket])

  // Real-time API Debounced Search
  useEffect(() => {
    if (!query.trim() || query.trim() === localStorage.getItem('dt_lte_last_search')) {
      // Don't auto-search on page load if query is just the default populated string
      // But if user deletes text, clear it
      if (!query.trim()) {
        setSuggestions([])
        setSearching(false)
        setShowDropdown(false)
      }
      return
    }

    // Prevent dropdown from reappearing immediately after a selection was made
    if (!showDropdown && suggestions.length === 0 && !searching && query) return;

    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearching(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.slice(0, 8))
          setSelectedIndex(-1)
          if (query.trim().length > 0) {
            setShowDropdown(true)
          }
        }
      } catch (err) {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value.toUpperCase())
    if (!e.target.value.trim()) {
      setShowDropdown(false)
    } else {
      setShowDropdown(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault()
        handleSelectSuggestion(suggestions[selectedIndex].symbol)
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleSelectSuggestion = (sym: string) => {
    setQuery(sym)
    setShowDropdown(false)
    handleSearch(undefined, sym)
  }

  const fetchPrebuiltStats = async () => {
    setPrebuiltLoading(true)
    try {
      const statsMap: Record<number, any> = {}
      await Promise.all(
        PREBUILT_BASKETS.map(async (basket, idx) => {
          const res = await fetch(`/api/longterm/basket?symbols=${basket.symbols.join(',')}`)
          if (res.ok) {
            statsMap[idx] = await res.json()
          }
        })
      )
      setPrebuiltStats(statsMap)
    } catch (e) {
      console.error(e)
    } finally {
      setPrebuiltLoading(false)
    }
  }

  const fetchBasketData = async () => {
    setBasketLoading(true)
    try {
      const res = await fetch(`/api/longterm/basket?symbols=${customBasket.join(',')}`)
      const json = await res.json()
      if (res.ok) setBasketData(json)
    } catch (e) {
      console.error(e)
    } finally {
      setBasketLoading(false)
    }
  }

  const addToBasket = async (sym: string) => {
    if (customBasket.includes(sym)) {
      setToastMsg(`${sym} is already in Custom Portfolio!`)
      setTimeout(() => setToastMsg(''), 3000)
      return
    }
    const next = [...customBasket, sym]
    setCustomBasket(next)

    setToastMsg(`${sym} added to Custom Portfolio!`)
    setTimeout(() => setToastMsg(''), 3000)

    try {
      await fetch('/api/longterm/basket/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym })
      })
    } catch (e) { }
  }

  const removeFromBasket = async (sym: string) => {
    const next = customBasket.filter(s => s !== sym)
    setCustomBasket(next)
    if (next.length === 0) setBasketData(null)

    try {
      await fetch(`/api/longterm/basket/user?symbol=${sym}`, {
        method: 'DELETE'
      })
    } catch (e) { }
  }

  const handleSearch = async (e?: React.FormEvent, explicitQuery?: string) => {
    e?.preventDefault()
    const targetQuery = explicitQuery || query
    if (!targetQuery) return
    setActiveTab('analyzer')

    setLoading(true)
    setError('')
    setShowDropdown(false)
    localStorage.setItem('dt_lte_last_search', targetQuery)

    try {
      const [dnaRes, valRes, smRes, riskRes, secRes, entryRes] = await Promise.all([
        fetch(`/api/longterm/stock-dna?symbol=${targetQuery}`),
        fetch(`/api/longterm/valuation?symbol=${targetQuery}`),
        fetch(`/api/longterm/smart-money?symbol=${targetQuery}`),
        fetch(`/api/longterm/risk?symbol=${targetQuery}`),
        fetch(`/api/longterm/sector?symbol=${targetQuery}`),
        fetch(`/api/longterm/entry?symbol=${targetQuery}`)
      ])

      const dnaJson = await dnaRes.json()
      const valJson = await valRes.json().catch(() => ({}))
      const smJson = await smRes.json().catch(() => ({}))
      const riskJson = await riskRes.json().catch(() => ({}))
      const secJson = await secRes.json().catch(() => ({}))
      const entryJson = await entryRes.json().catch(() => ({}))

      if (!dnaRes.ok) throw new Error(dnaJson.error || 'Failed to fetch DNA')

      setData({
        ...dnaJson,
        valuation: valRes.ok && !valJson.error ? valJson : null,
        smartMoney: smRes.ok && !smJson.error ? smJson : null,
        risk: riskRes.ok && !riskJson.error ? riskJson : null,
        sectorMap: secRes.ok && !secJson.error ? secJson : null,
        entryMap: entryRes.ok && !entryJson.error ? entryJson : null
      })
    } catch (err: any) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  const formatLargeNumber = (num: number) => {
    if (!num) return '₹0'
    if (num >= 1e9) return `₹${(num / 1e9).toFixed(2)}B`
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)}Cr`
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)}L`
    return `₹${num.toFixed(2)}`
  }

  const ScoreBar = ({ label, score }: { label: string, score: number }) => {
    const colorClass = score > 70 ? 'bg-green' : score > 40 ? 'bg-yellow' : 'bg-red'
    return (
      <div className="mb-4 last:mb-0">
        <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
          <span className="text-[#9FB0C0] uppercase tracking-wider">{label}</span>
          <span className="text-[#E6EDF3] font-bold">{score}/100</span>
        </div>
        <div className="h-1.5 w-full bg-[#0B1220] rounded-full overflow-hidden border border-[#1E2A3B] shadow-inner">
          <div className={`h-full ${colorClass} transition-all duration-1000 rounded-full`} style={{ width: `${score}%` }} />
        </div>
      </div>
    )
  }

  const gaugeRadius = 36
  const gaugeCircumference = 2 * Math.PI * gaugeRadius
  const gaugeStrokeOffset = data ? gaugeCircumference - (data.scores.overallDNA / 100) * gaugeCircumference : gaugeCircumference
  const gaugeColor = data ? (data.scores.overallDNA > 75 ? '#22C55E' : data.scores.overallDNA > 45 ? '#F59E0B' : '#F43F5E') : '#3B82F6'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0B1220' }}>

      {/* Custom Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[100] animate-fade pointer-events-none">
          <div className="flex items-center gap-3 bg-[#121A2B] border border-[#263042] px-4 py-3 rounded-lg shadow-2xl">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue/20 text-blue shrink-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[12px] font-mono text-[#E6EDF3] tracking-wide">{toastMsg}</span>
          </div>
        </div>
      )}

      {/* ── Shared Header (brand + nav + ticker) ───────────────────────────── */}
      <Header />

      {/* ── Sub-header (Search + Tabs) ─────────────────────────────────────── */}
      <div style={{
        background: '#121A2B', borderBottom: '1px solid #263042',
        padding: '10px 0 0', flexShrink: 0,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}
          className="sm:px-8 lg:px-14 xl:px-20"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-mono font-bold text-text-primary tracking-widest pl-1">LONG-TERM ENGINE</h1>
              <span className="px-2 py-0.5 text-[9px] font-mono bg-blue/10 text-blue border border-blue/20 rounded">Plus</span>
            </div>

            <div ref={dropdownRef} className="relative w-full sm:w-[320px]">
              <form onSubmit={e => handleSearch(e)} className="flex relative w-full">
                <input
                  type="text"
                  placeholder="Search name or Symbol (e.g.RELIANCE)"
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  onFocus={(e) => handleQueryChange(e as any)}
                  className="w-full bg-[#0B1220] border border-[#263042] rounded h-8 px-3 pr-10 text-[12px] font-mono text-text-primary placeholder:text-[#6B7A90] focus:outline-none focus:border-blue/50 transition-colors uppercase"
                />
                <button type="submit" className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-[#6B7A90] hover:text-blue transition-colors disabled:opacity-50" disabled={loading}>
                  {loading ? <span className="w-4 h-4 border-2 border-[#263042] border-t-blue rounded-full animate-spin" /> : <Search size={14} strokeWidth={2} />}
                </button>
              </form>

              {/* Smart Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#121A2B] border border-[#263042] rounded-lg shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto animate-fade">
                  {searching ? (
                    <div className="px-3 py-4 flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-[#263042] border-t-[#3B82F6] rounded-full animate-spin" />
                      <span className="text-[11px] font-mono text-[#6B7A90]">Searching NSE...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s, idx) => (
                      <div
                        key={s.symbol}
                        onClick={() => handleSelectSuggestion(s.symbol)}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${idx === selectedIndex ? 'bg-[#1E2E4A]' : 'hover:bg-[#1A2336]'
                          }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <span className="text-[12px] font-mono font-bold text-[#E6EDF3] leading-none shrink-0">{s.symbol}</span>
                          <span className="text-[11px] text-[#6B7A90] truncate leading-none mt-0.5">{s.name}</span>
                        </div>
                        {s.exchange && (
                          <span className="text-[9px] font-mono text-[#6B7A90] bg-[#1A2336] border border-[#263042] px-1.5 py-0.5 rounded shrink-0">
                            {s.exchange}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-[11px] font-mono text-[#6B7A90] text-center">
                      No matching stocks found for "{query}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <div style={{
              display: 'flex', alignItems: 'center', position: 'relative',
              borderBottom: activeTab === 'analyzer' ? `2px solid #3B82F6` : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              background: activeTab === 'analyzer' ? '#0B1220' : 'transparent',
            }}>
              <button
                onClick={() => setActiveTab('analyzer')}
                style={{
                  padding: '7px 16px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  border: 'none', background: 'transparent',
                  color: activeTab === 'analyzer' ? '#3B82F6' : '#6B7A90',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                STOCK ANALYZER
              </button>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', position: 'relative',
              borderBottom: activeTab === 'portfolio' ? `2px solid #3B82F6` : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              background: activeTab === 'portfolio' ? '#0B1220' : 'transparent',
            }}>
              <button
                onClick={() => setActiveTab('portfolio')}
                style={{
                  padding: '7px 16px', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                  border: 'none', background: 'transparent',
                  color: activeTab === 'portfolio' ? '#3B82F6' : '#6B7A90',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                PORTFOLIO BUILDER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px' }}
          className="sm:px-8 sm:py-6 lg:px-14 lg:py-7 xl:px-20 xl:py-8"
        >
          {error && activeTab === 'analyzer' && (
            <div className="p-4 mb-4 border border-red/30 bg-red/10 text-red text-[13px] font-mono rounded">
              {error}
            </div>
          )}

          {/* --- ANALYZER MODE --- */}
          {activeTab === 'analyzer' && (
            <>
              {!data && !loading && !error && (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔬</div>
                  <div style={{ fontSize: 14, color: '#E6EDF3', marginBottom: 6 }}>No company selected</div>
                  <div style={{ fontSize: 12, color: '#6B7A90' }}>Enter a stock symbol to analyze its fundamental DNA.</div>
                </div>
              )}

              {data && (
                <div className="animate-fade slide-up flex flex-col gap-4">

                  {/* Main Analyzer Grid Framework */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 relative w-full">

                    {/* ====== LEFT COLUMN ====== */}
                    <div className="lg:col-span-7 flex flex-col gap-4 w-full">

                      {/* Header Card */}
                      <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-lg relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h2 className="text-lg sm:text-2xl font-bold text-text-primary tracking-tight leading-none truncate">{data.name}</h2>
                            <span className="text-[10px] font-mono bg-bg-tertiary px-2 py-0.5 border border-border-secondary rounded text-text-secondary shadow-sm shrink-0">{data.symbol}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#6B7A90] uppercase tracking-widest">{data.sector}</span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                          <div className="flex flex-col items-start sm:items-end">
                            <div className="text-xl sm:text-2xl font-mono text-text-primary font-light tracking-tight whitespace-nowrap">
                              ₹{data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] font-mono text-[#6B7A90] mt-0.5 whitespace-nowrap">
                              <span className="opacity-60">52W:</span> ₹{data.low52.toFixed(1)} – ₹{data.high52.toFixed(1)}
                            </div>
                          </div>

                          <button
                            onClick={() => addToBasket(data.symbol)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-blue/10 hover:bg-blue/20 text-blue text-[11px] font-mono font-bold border border-blue/20 rounded-lg transition-colors group shadow-sm whitespace-nowrap shrink-0"
                          >
                            <Plus size={13} className="group-hover:scale-110 transition-transform" /> <span className="hidden sm:inline">ADD TO BASKET</span><span className="sm:hidden">+</span>
                          </button>
                        </div>
                      </div>

                      {/* Metrics Grid */}
                      <div className="bg-bg-secondary border border-border-primary rounded-xl p-4 sm:p-5 shadow-lg">
                        <h3 className="section-label mb-4 text-[11px] tracking-widest text-[#6B7A90] font-bold">KEY METRICS</h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">ROE</div>
                            <div className="text-[13px] sm:text-[14px] font-mono text-[#E6EDF3]">{data.metrics.roe.toFixed(2)}%</div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">ROCE</div>
                            <div className="text-[13px] sm:text-[14px] font-mono text-[#E6EDF3]">{data.metrics.roce.toFixed(2)}%</div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">D/E RATIO</div>
                            <div className={`text-[13px] sm:text-[14px] font-mono ${data.metrics.debtToEquity > 1.5 ? 'text-red' : data.metrics.debtToEquity > 0.8 ? 'text-yellow' : 'text-green'}`}>
                              {data.metrics.debtToEquity.toFixed(2)}
                            </div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">FCF</div>
                            <div className="text-[13px] sm:text-[14px] font-mono text-[#E6EDF3]">{formatLargeNumber(data.metrics.fcf)}</div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">REV GROWTH</div>
                            <div className={`text-[13px] sm:text-[14px] font-mono ${data.metrics.revenueGrowth > 0 ? 'text-green' : 'text-red'}`}>
                              {data.metrics.revenueGrowth > 0 ? '+' : ''}{data.metrics.revenueGrowth.toFixed(2)}%
                            </div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">PROFIT GROWTH</div>
                            <div className={`text-[13px] sm:text-[14px] font-mono ${data.metrics.profitGrowth > 0 ? 'text-green' : 'text-red'}`}>
                              {data.metrics.profitGrowth > 0 ? '+' : ''}{data.metrics.profitGrowth.toFixed(2)}%
                            </div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">P/E RATIO</div>
                            <div className="text-[13px] sm:text-[14px] font-mono text-[#E6EDF3]">{data.metrics.pe.toFixed(2)}</div>
                          </div>
                          <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl px-3 py-2.5 sm:px-4 flex flex-col items-start justify-center transition-colors hover:border-[#2A3B54]">
                            <div className="text-[9px] sm:text-[10px] font-mono text-[#6B7A90] mb-1 tracking-wider uppercase">EV/EBITDA</div>
                            <div className="text-[13px] sm:text-[14px] font-mono text-[#E6EDF3]">{data.metrics.evEbitda.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                      {data.entryMap && (
                        <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-5">
                          <div className="flex items-center justify-between gap-3 mb-4 border-b border-border-primary pb-3">
                            <div className="min-w-0">
                              <h3 className="text-[13px] font-bold text-[#E6EDF3] flex items-center gap-1.5 tracking-wide">
                                <span className="text-blue text-[15px] shrink-0">🎯</span> ENTRY TIMING
                              </h3>
                              <p className="text-[11px] font-mono text-[#6B7A90] mt-1 opacity-80">Techno-Fundamental Setup</p>
                            </div>
                            <div className={`shrink-0 px-3 py-1 rounded border text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap
                          ${data.entryMap.score > 70 ? 'bg-green/10 border-green/20 text-green' :
                                data.entryMap.score < 40 ? 'bg-red/10 border-red/20 text-red' :
                                  'bg-yellow/10 border-yellow/20 text-yellow'}`
                            }>
                              {data.entryMap.verdict}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-3 flex flex-col justify-center gap-5">
                              <div>
                                <div className="flex justify-between items-center text-[10px] font-mono mb-1.5 tracking-wider">
                                  <span className="text-[#6B7A90] uppercase">RSI (14)</span>
                                  <span className={`font-bold ${data.entryMap.indicators.rsi14 > 70 ? 'text-red' : data.entryMap.indicators.rsi14 < 35 ? 'text-green' : 'text-[#E6EDF3]'}`}>
                                    {data.entryMap.indicators.rsi14}
                                  </span>
                                </div>
                                <div className="h-[6px] w-full flex rounded-full overflow-hidden border border-[#1E2A3B] relative bg-[#0B1220]">
                                  <div className="bg-green/40" style={{ width: '35%' }} />
                                  <div className="bg-yellow/40" style={{ width: '35%' }} />
                                  <div className="bg-red/40" style={{ width: '30%' }} />
                                  <div
                                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                                    style={{ left: `${Math.min(100, Math.max(0, data.entryMap.indicators.rsi14))}%` }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between items-center text-[10px] font-mono mb-1.5 tracking-wider">
                                  <span className="text-[#6B7A90] uppercase">DIST VS 200-DMA</span>
                                  <span className={`font-bold ${data.entryMap.indicators.distFrom200DMA > 30 ? 'text-red' : data.entryMap.indicators.distFrom200DMA < 5 ? 'text-green' : 'text-[#E6EDF3]'}`}>
                                    {data.entryMap.indicators.distFrom200DMA > 0 ? '+' : ''}{data.entryMap.indicators.distFrom200DMA}%
                                  </span>
                                </div>
                                <div className="h-[6px] w-full flex rounded-full overflow-hidden border border-[#1E2A3B] relative bg-[#0B1220]">
                                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#6B7A90] z-0" />
                                  <div
                                    className={`absolute top-0 bottom-0 ${data.entryMap.indicators.distFrom200DMA > 0 ? 'bg-red/80' : 'bg-green/80'}`}
                                    style={{
                                      left: data.entryMap.indicators.distFrom200DMA > 0 ? '50%' : `${50 + data.entryMap.indicators.distFrom200DMA}%`,
                                      width: `${Math.min(50, Math.abs(data.entryMap.indicators.distFrom200DMA))}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-2 bg-[#0B1220] p-4 rounded-lg border border-[#1E2A3B] shadow-inner flex flex-col justify-center">
                              <div className="flex flex-col gap-2 mb-3">
                                <div className="flex justify-between items-center text-[11px] font-mono gap-3">
                                  <span className="text-[#6B7A90] shrink-0">Cmp</span>
                                  <span className="text-[#E6EDF3] font-bold truncate text-right">₹{data.entryMap.currentPrice}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-mono gap-3">
                                  <span className="text-[#6B7A90] shrink-0">50 DMA</span>
                                  <span className="text-[#E6EDF3] font-bold truncate text-right">₹{data.entryMap.indicators.sma50}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-mono gap-3">
                                  <span className="text-[#6B7A90] shrink-0">200 DMA</span>
                                  <span className="text-[#E6EDF3] font-bold truncate text-right">₹{data.entryMap.indicators.sma200}</span>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-[#1E2A3B]">
                                <div className="text-[10px] font-mono text-blue font-bold tracking-widest uppercase mb-1">Signal</div>
                                <p className="text-[11px] text-[#9FB0C0] leading-snug">
                                  {data.entryMap.action}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {data.risk && (
                        <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-5">
                          <div className="flex items-center justify-between gap-3 mb-4 border-b border-border-primary pb-3">
                            <div className="min-w-0">
                              <h3 className="text-[13px] font-bold text-[#E6EDF3] flex items-center gap-1.5 tracking-wide">
                                <span className="text-red text-[15px] shrink-0">🛑</span> RISK RADAR
                              </h3>
                              <p className="text-[11px] font-mono text-[#6B7A90] mt-1 opacity-80">Debt, Liquidity, Earnings checks</p>
                            </div>
                            <div className={`shrink-0 px-3 py-1 rounded border text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap
                          ${data.risk.score > 60 ? 'bg-red/10 border-red/20 text-red' :
                                data.risk.score < 30 ? 'bg-green/10 border-green/20 text-green' :
                                  'bg-yellow/10 border-yellow/20 text-yellow'}`
                            }>
                              {data.risk.verdict}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                            {data.risk.flags.map((flag, idx) => (
                              <div key={idx} className={`border border-[#1E2A3B] rounded-xl p-3 sm:p-4 flex flex-col gap-2 shadow-inner min-w-0
                          ${flag.type === 'High' ? 'bg-[#3A1015]/30 hover:border-red/40' :
                                  flag.type === 'Medium' ? 'bg-[#3A2A0A]/30 hover:border-yellow/40' :
                                    'bg-[#052515]/30 hover:border-green/40'} transition-colors`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-mono text-[#6B7A90] uppercase tracking-wider truncate">{flag.category}</span>
                                  <span className={`text-[11px] shrink-0 ml-1 ${flag.type === 'High' ? 'text-red' : flag.type === 'Medium' ? 'text-yellow' : 'text-green'}`}>
                                    {flag.type === 'High' ? '⚠️' : flag.type === 'Medium' ? '⚡' : '✅'}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-snug break-words ${flag.type === 'High' ? 'text-red/90 font-medium' : flag.type === 'Medium' ? 'text-yellow/90' : 'text-green/80'}`}>
                                  {flag.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Wealth Projector Section */}
                      {data.metrics && (
                        <WealthProjector
                          symbol={data.symbol}
                          // Pass profit growth as default expected return natively for realistic simulation
                          defaultCagr={data.metrics.profitGrowth > 0 ? Number(data.metrics.profitGrowth.toFixed(0)) : 15}
                        />
                      )}
                    </div>

                    {/* ====== RIGHT COLUMN ====== */}
                    <div className="lg:col-span-5 flex flex-col gap-4 w-full">

                      {/* DNA Card */}
                      <div className="bg-bg-secondary border border-border-primary rounded-xl p-5 shadow-lg flex flex-col items-center justify-center relative flex-1">
                        <h3 className="absolute top-4 left-5 section-label text-[10px] tracking-widest text-[#6B7A90] font-bold uppercase">DNA SCORE</h3>

                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center mt-6 mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="50%" cy="50%" r="42%" stroke="#0B1220" strokeWidth="10%" fill="none" />
                            <circle
                              cx="50%" cy="50%" r="42%"
                              stroke={gaugeColor}
                              strokeWidth="10%" fill="none"
                              strokeDasharray="264%"
                              strokeDashoffset={data ? `${264 - (data.scores.overallDNA / 100) * 264}%` : '264%'}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                              style={{ filter: `drop-shadow(0px 0px 6px ${gaugeColor}40)` }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                            <span className="text-3xl sm:text-5xl font-black font-mono tracking-tighter" style={{ color: gaugeColor }}>{data.scores.overallDNA}</span>
                            <span className="text-[9px] sm:text-[11px] font-mono text-[#6B7A90] uppercase tracking-widest mt-0.5">/ 100</span>
                          </div>
                        </div>

                        <div className={`mt-1 px-4 py-1.5 text-[11px] font-mono font-bold rounded border shadow-sm tracking-wider uppercase ${data.scores.overallDNA > 75 ? 'bg-green/10 text-green border-green/20' : data.scores.overallDNA > 45 ? 'bg-yellow/10 text-yellow border-yellow/20' : 'bg-red/10 text-red border-red/20'}`}>
                          {data.moatTag}
                        </div>

                        {/* Summary Block embedded in DNA card for visual balance */}
                        <div className="mt-5 pt-4 border-t border-[#1E2A3B] w-full text-left">
                          <h4 className="text-[10px] font-mono font-bold text-[#6B7A90] mb-2.5 tracking-widest flex items-center gap-1.5 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue"></span> Core Summary
                          </h4>
                          <p className="text-[12px] leading-relaxed text-[#9FB0C0]">{data.summaryText}</p>
                        </div>
                      </div>

                      {/* Pillar Scores Card */}
                      <div className="bg-[#0B1220] border border-[#1E2A3B] shadow-inner rounded-xl p-5 flex-1">
                        <h3 className="section-label mb-5 text-[10px] tracking-widest text-[#6B7A90] font-bold uppercase">PILLAR SCORES</h3>
                        <div className="flex flex-col gap-1">
                          <ScoreBar label="Business Quality" score={data.scores.businessQuality} />
                          <ScoreBar label="Promoter Trust" score={data.scores.promoterTrust} />
                          <ScoreBar label="Earnings Quality" score={data.scores.earningsQuality} />
                        </div>
                      </div>



                      {data.valuation && (
                        <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-5">
                          <div className="flex items-center justify-between gap-3 mb-4 border-b border-border-primary pb-3">
                            <div className="min-w-0">
                              <h3 className="text-[13px] font-bold text-[#E6EDF3] flex items-center gap-1.5 tracking-wide">
                                <span className="text-blue text-[15px] shrink-0">✛</span> VALUATION COMPASS
                              </h3>
                              <p className="text-[11px] font-mono text-[#6B7A90] mt-1 opacity-80">Intrinsic Value Analysis</p>
                            </div>

                            <div className={`shrink-0 px-3 py-1 rounded border text-[10px] font-mono font-bold tracking-wider uppercase whitespace-nowrap
                          ${data.valuation.score > 70 ? 'bg-red/10 border-red/20 text-red' :
                                data.valuation.score < 30 ? 'bg-green/10 border-green/20 text-green' :
                                  'bg-yellow/10 border-yellow/20 text-yellow'}`
                            }>
                              {data.valuation.verdict}
                            </div>
                          </div>

                          {/* Compass slider — fully in-flow, no absolute needle overlap */}
                          <div className="w-full mb-5">
                            <div className="flex justify-between text-[10px] font-mono mb-1.5 px-0.5 tracking-wider uppercase">
                              <span className="text-green">Cheap</span>
                              <span className="text-[#6B7A90]">Fair</span>
                              <span className="text-red">Expensive</span>
                            </div>
                            {/* Gradient bar */}
                            <div className="h-2 w-full rounded-sm bg-gradient-to-r from-[#22C55E] via-[#F59E0B] to-[#F43F5E] shadow-inner" />
                            {/* Needle row — in-flow with relative positioning only */}
                            <div className="relative h-3 w-full">
                              <div
                                className="absolute top-0 flex flex-col items-center"
                                style={{ left: `clamp(4px, calc(${data.valuation.score}% - 4px), calc(100% - 4px))` }}
                              >
                                <div className="w-0.5 h-3 bg-white shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                                <div className="w-2 h-2 bg-white rounded-full -mt-0.5 shadow-[0_0_4px_rgba(255,255,255,0.9)]" />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 mt-2">
                            <div className="bg-[#0B1220] border border-[#1E2A3B] rounded-xl border-b-[3px] border-b-red p-3 flex flex-col items-center shadow-inner overflow-hidden">
                              <div className="text-[9px] font-mono text-[#6B7A90] uppercase mb-1.5 tracking-wider">Bear</div>
                              <div className="text-[12px] sm:text-[13px] font-bold font-mono text-[#E6EDF3] truncate w-full text-center">₹{data.valuation.dcf.bear.toLocaleString()}</div>
                            </div>
                            <div className="bg-[#0B1220] border border-[#1E2A3B] rounded-xl border-b-[3px] border-b-yellow p-3 flex flex-col items-center shadow-inner overflow-hidden">
                              <div className="text-[9px] font-mono text-[#6B7A90] uppercase mb-1.5 tracking-wider">Base</div>
                              <div className="text-[12px] sm:text-[13px] font-bold font-mono text-[#E6EDF3] truncate w-full text-center">₹{data.valuation.dcf.base.toLocaleString()}</div>
                            </div>
                            <div className="bg-[#0B1220] border border-[#1E2A3B] rounded-xl border-b-[3px] border-b-green p-3 flex flex-col items-center shadow-inner overflow-hidden">
                              <div className="text-[9px] font-mono text-[#6B7A90] uppercase mb-1.5 tracking-wider">Bull</div>
                              <div className="text-[12px] sm:text-[13px] font-bold font-mono text-[#E6EDF3] truncate w-full text-center">₹{data.valuation.dcf.bull.toLocaleString()}</div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 bg-[#0B1220] p-4 rounded-xl border border-[#1E2A3B] shadow-inner mb-4">
                            <div>
                              <h4 className="text-[9px] font-mono text-[#6B7A90] mb-2 uppercase tracking-widest border-b border-[#1E2A3B] pb-1">P/E vs History</h4>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-[#9FB0C0]">Current P/E</span>
                                  <span className="text-[#E6EDF3] font-bold">{data.valuation.historicalPE.current.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-[#9FB0C0]">3Y Average</span>
                                  <span className="text-[#E6EDF3] font-bold">{data.valuation.historicalPE.avg.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-[#9FB0C0]">3Y Range</span>
                                  <span className="text-[#E6EDF3] font-bold">{data.valuation.historicalPE.min.toFixed(1)} - {data.valuation.historicalPE.max.toFixed(1)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-1 pt-3 border-t border-[#1E2A3B]">
                              <h4 className="text-[9px] font-mono text-[#6B7A90] mb-2 uppercase tracking-widest border-b border-[#1E2A3B] pb-1">Multiples</h4>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-[#9FB0C0]">PEG Ratio</span>
                                  <span className={`font-bold ${data.valuation.pegRatio < 1 && data.valuation.pegRatio > 0 ? 'text-green' : data.valuation.pegRatio > 2 ? 'text-red' : 'text-[#E6EDF3]'}`}>
                                    {data.valuation.pegRatio > 0 ? data.valuation.pegRatio.toFixed(2) : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] font-mono">
                                  <span className="text-[#9FB0C0]">Price to FCF</span>
                                  <span className={`font-bold ${data.valuation.priceToFCF < 15 && data.valuation.priceToFCF > 0 ? 'text-green' : data.valuation.priceToFCF > 25 ? 'text-red' : 'text-[#E6EDF3]'}`}>
                                    {data.valuation.priceToFCF > 0 ? data.valuation.priceToFCF.toFixed(2) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {data.sectorMap && (
                    <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-6 sm:p-8 mt-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                        <div>
                          <h3 className="text-[14px] font-bold text-[#E6EDF3] flex items-center gap-2 tracking-wide">
                            <span className="text-blue text-lg">🧭</span> SECTOR ROTATION MAP
                          </h3>
                          <p className="text-[12px] font-mono text-[#6B7A90] mt-1.5 opacity-80">Momentum vs NIFTY 50 ({data.sectorMap.sector})</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full border text-[11px] font-mono font-bold tracking-wider uppercase
                        ${data.sectorMap.color === 'green' ? 'bg-green/10 border-green/20 text-green' :
                            data.sectorMap.color === 'red' ? 'bg-red/10 border-red/20 text-red' :
                              data.sectorMap.color === 'blue' ? 'bg-blue/10 border-blue/20 text-blue' :
                                'bg-yellow/10 border-yellow/20 text-yellow'}`
                        }>
                          {data.sectorMap.phase}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 bg-bg-tertiary p-6 rounded-xl border border-border-primary">
                        <div className="flex flex-col justify-center">
                          <p className="text-[13px] text-[#9FB0C0] leading-[1.7] font-sans mb-6">
                            {data.sectorMap.phaseDesc}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#6B7A90] bg-[#0B1220] px-4 py-3 rounded-lg border border-[#1E2A3B] shadow-inner">
                            Tracking Index: <span className="text-[#E6EDF3] font-bold">{data.sectorMap.mappedIndex === '^NSEI' ? 'Unmapped (Using NIFTY)' : data.sectorMap.mappedIndex}</span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center">
                          <h4 className="text-[11px] font-mono font-bold text-[#6B7A90] mb-4 tracking-widest uppercase">Relative Performance</h4>
                          <div className="overflow-hidden rounded-lg border border-[#1E2A3B] shadow-sm">
                            <table className="w-full text-left text-[11px] font-mono text-[#9FB0C0] bg-[#0B1220]">
                              <thead>
                                <tr className="border-b border-[#1E2A3B] text-[#6B7A90] bg-[#121A2B]">
                                  <th className="px-4 py-3 font-medium">Period</th>
                                  <th className="px-4 py-3 font-medium">Sector</th>
                                  <th className="px-4 py-3 font-medium">Nifty 50</th>
                                  <th className="px-4 py-3 font-medium text-right">Alpha</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.sectorMap.performance.map((p, idx) => {
                                  const alpha = p.sector - p.nifty
                                  return (
                                    <tr key={idx} className="border-b border-[#1E2A3B]/50 last:border-0 hover:bg-[#1A2336] transition-colors">
                                      <td className="px-4 py-3 text-white font-medium">{p.period}</td>
                                      <td className={`px-4 py-3 font-bold ${p.sector > 0 ? 'text-green' : 'text-red'}`}>{p.sector > 0 ? '+' : ''}{p.sector.toFixed(1)}%</td>
                                      <td className={`px-4 py-3 ${p.nifty > 0 ? 'text-green' : 'text-red'}`}>{p.nifty > 0 ? '+' : ''}{p.nifty.toFixed(1)}%</td>
                                      <td className={`px-4 py-3 font-bold text-right ${alpha > 0 ? 'text-green' : 'text-red'}`}>{alpha > 0 ? '+' : ''}{alpha.toFixed(1)}%</td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {data.smartMoney && (
                    <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div>
                          <h3 className="text-[15px] font-bold text-text-primary flex items-center gap-2">
                            <span className="text-[#8B5CF6] text-lg">👁️</span> SMART MONEY X-RAY
                          </h3>
                          <p className="text-[12px] font-mono text-text-muted mt-1">Institutional Ownership & Bulk Deals</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full border text-[12px] font-mono font-bold
                        ${data.smartMoney.sentimentScore > 70 ? 'bg-green/10 border-green/20 text-green' :
                            data.smartMoney.sentimentScore < 40 ? 'bg-red/10 border-red/20 text-red' :
                              'bg-yellow/10 border-yellow/20 text-yellow'}`
                        }>
                          {data.smartMoney.sentiment}
                        </div>
                      </div>

                      <div className="mb-8">
                        <div className="flex justify-between text-[11px] font-mono text-text-muted mb-2 px-1">
                          <span>PROMOTER</span>
                          <span>FII</span>
                          <span>DII</span>
                          <span>RETAIL</span>
                        </div>
                        <div className="h-4 w-full rounded-full flex overflow-hidden border border-border-primary">
                          <div className="bg-blue" style={{ width: `${data.smartMoney.holdings.promoter}%` }} title={`Promoter: ${data.smartMoney.holdings.promoter}%`} />
                          <div className="bg-[#8B5CF6]" style={{ width: `${data.smartMoney.holdings.fii}%` }} title={`FII: ${data.smartMoney.holdings.fii}%`} />
                          <div className="bg-[#10B981]" style={{ width: `${data.smartMoney.holdings.dii}%` }} title={`DII: ${data.smartMoney.holdings.dii}%`} />
                          <div className="bg-text-muted" style={{ width: `${data.smartMoney.holdings.retail}%` }} title={`Retail: ${data.smartMoney.holdings.retail}%`} />
                        </div>
                        <div className="flex justify-between text-[13px] font-mono text-text-primary mt-2 px-1">
                          <span>{data.smartMoney.holdings.promoter}%</span>
                          <span>{data.smartMoney.holdings.fii}%</span>
                          <span>{data.smartMoney.holdings.dii}%</span>
                          <span>{data.smartMoney.holdings.retail}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 bg-bg-tertiary p-4 rounded border border-border-primary">
                        <div>
                          <h4 className="text-[11px] font-mono text-text-muted mb-3 uppercase">Top Institutional Holders</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12px] font-mono text-text-secondary">
                              <thead>
                                <tr className="border-b border-border-primary text-text-muted">
                                  <th className="pb-2">Date Reported</th>
                                  <th className="pb-2">Institution</th>
                                  <th className="pb-2">Status</th>
                                  <th className="pb-2">Shares</th>
                                </tr>
                              </thead>
                              <tbody>
                                {data.smartMoney.recentDeals.map((deal, idx) => (
                                  <tr key={idx} className="border-b border-border-primary/50 last:border-0">
                                    <td className="py-3">{deal.date}</td>
                                    <td className="py-3 text-text-primary truncate max-w-[200px]" title={deal.participant}>{deal.participant}</td>
                                    <td className={`py-3 font-bold ${deal.type === 'HOLDING' ? 'text-blue' : deal.type === 'BUY' ? 'text-green' : 'text-red'}`}>{deal.type}</td>
                                    <td className="py-3">{deal.quantity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* --- PORTFOLIO BUILDER MODE --- */}
          {activeTab === 'portfolio' && (
            <div className="animate-fade slide-up flex flex-col gap-8 w-full">

              {/* Custom Builder Section */}
              <div className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden shadow-lg p-6">
                <div className="flex items-center justify-between border-b border-border-primary pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      <span className="text-blue">⚙️</span> Custom Builder
                    </h3>
                    <p className="text-[12px] font-mono text-text-muted mt-1">Build and track your own personalized long-term basket.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-text-muted uppercase">SYMBOLS</div>
                    <div className="text-lg font-mono text-text-primary">{customBasket.length}</div>
                  </div>
                </div>

                {customBasket.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border-primary rounded-lg text-text-muted">
                    <span className="text-2xl mb-2">📥</span>
                    <p className="text-[13px]">Your custom basket is empty.</p>
                    <p className="text-[11px] mt-1 font-mono">Use the Stock Analyzer to add symbols.</p>
                  </div>
                ) : (
                  <>
                    {/* Aggregated Stats */}
                    {basketData && (
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-bg-primary border border-border-primary rounded p-4">
                          <div className="text-[10px] font-mono text-text-muted mb-1 uppercase">Avg P/E Ratio</div>
                          <div className="text-xl font-mono text-text-primary">{basketData.avgPE}</div>
                        </div>
                        <div className="bg-bg-primary border border-border-primary rounded p-4">
                          <div className="text-[10px] font-mono text-text-muted mb-1 uppercase">Total Market Cap</div>
                          <div className="text-xl font-mono text-text-primary">{formatLargeNumber(basketData.basketCap)}</div>
                        </div>
                      </div>
                    )}

                    {/* List */}
                    <div className="overflow-x-auto border border-border-primary rounded">
                      <table className="w-full text-left text-[12px] font-mono text-text-secondary">
                        <thead>
                          <tr className="border-b border-border-primary text-text-muted bg-bg-tertiary">
                            <th className="p-3">Symbol</th>
                            <th className="p-3">Name</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Today</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {basketLoading && !basketData && (
                            <tr><td colSpan={5} className="p-4 text-center">Loading basket metrics...</td></tr>
                          )}
                          {basketData && basketData.holdings.map((h: any, idx: number) => (
                            <tr key={idx} className="border-b border-border-primary/50 last:border-0 hover:bg-bg-tertiary">
                              <td className="p-3 font-bold text-white">{h.symbol}</td>
                              <td className="p-3 truncate max-w-[150px]">{h.name}</td>
                              <td className="p-3 text-text-primary">₹{h.price.toFixed(2)}</td>
                              <td className={`p-3 ${h.change > 0 ? 'text-green' : 'text-red'}`}>{h.change > 0 ? '+' : ''}{h.change.toFixed(2)}%</td>
                              <td className="p-3 text-right">
                                <button onClick={() => removeFromBasket(h.symbol)} className="text-red/70 hover:text-red transition-colors p-1">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Prebuilt Baskets Section */}
              <div>
                <h3 className="text-[14px] font-bold text-text-primary mb-4 flex items-center gap-2">
                  <span className="text-yellow text-lg">💡</span> PRE-BUILT BASKETS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {PREBUILT_BASKETS.map((basket, idx) => {
                    const liveStats = prebuiltStats[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCustomBasket(basket.symbols);
                          localStorage.setItem('dt_lte_basket', JSON.stringify(basket.symbols));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="bg-bg-secondary border border-border-primary rounded-xl overflow-hidden hover:border-border-secondary transition-colors cursor-pointer group"
                      >
                        <div className="p-5 border-b border-border-primary">
                          <h4 className="font-bold text-text-primary mb-1">{basket.name}</h4>
                          <p className="text-[11px] text-text-muted h-8 leading-snug">{basket.desc}</p>
                        </div>
                        <div className="flex bg-bg-tertiary">
                          <div className="flex-1 p-4 border-r border-border-primary">
                            <div className="text-[9px] font-mono text-text-muted mb-1 uppercase">Live Avg P/E</div>
                            <div className="text-14px font-mono text-text-primary">
                              {prebuiltLoading || !liveStats ? <span className="animate-pulse">...</span> : liveStats.avgPE}
                            </div>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="text-[9px] font-mono text-text-muted mb-1 uppercase">Live Market Cap</div>
                            <div className="text-14px font-mono text-green">
                              {prebuiltLoading || !liveStats ? <span className="animate-pulse">...</span> : formatLargeNumber(liveStats.basketCap)}
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-bg-primary">
                          <div className="flex flex-wrap gap-2">
                            {basket.symbols.map((sym, i) => (
                              <span key={i} className="text-[10px] font-mono bg-bg-secondary border border-border-primary px-2 py-0.5 rounded text-text-secondary">{sym}</span>
                            ))}
                          </div>
                        </div>
                        <div className="p-3 border-t border-border-primary bg-blue/5 text-blue text-center text-[11px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          APPLY THIS BASKET +
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
