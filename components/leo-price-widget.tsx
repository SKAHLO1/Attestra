"use client"

import { useEffect, useState } from "react"
import { TrendingDown, TrendingUp, RefreshCw, Activity } from "lucide-react"
import {
    LineChart,
    Line,
    ResponsiveContainer,
    YAxis,
    Tooltip,
    XAxis
} from "recharts"

interface PriceData {
    usd: number
    usd_24h_change: number
}

interface ChartDataPoint {
    time: number
    price: number
}

export default function LeoPriceWidget() {
    const [data, setData] = useState<PriceData | null>(null)
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchPriceData = async () => {
        try {
            setLoading(true)
            // Fetch current price
            const priceRes = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=aleo&vs_currencies=usd&include_24hr_change=true"
            )
            const priceJson = await priceRes.json()

            // Fetch 7-day chart data
            const chartRes = await fetch(
                "https://api.coingecko.com/api/v3/coins/aleo/market_chart?vs_currency=usd&days=7&interval=daily"
            )
            const chartJson = await chartRes.json()

            if (priceJson.aleo && chartJson.prices) {
                setData({
                    usd: priceJson.aleo.usd,
                    usd_24h_change: priceJson.aleo.usd_24h_change
                })

                const formattedChart = chartJson.prices.map((p: [number, number]) => ({
                    time: p[0],
                    price: p[1]
                }))
                setChartData(formattedChart)
                setError(false)
            } else {
                throw new Error("Invalid response")
            }
        } catch (error) {
            console.error("Failed to fetch Aleo data:", error)
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPriceData()
        const interval = setInterval(fetchPriceData, 300000) // update every 5 mins
        return () => clearInterval(interval)
    }, [])

    if (loading && !data) {
        return (
            <div className="w-64 h-48 bg-gray-50 border border-gray-200 rounded-2xl animate-pulse" />
        )
    }

    if (error && !data) {
        return (
            <div className="w-64 p-6 bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col items-center justify-center gap-4">
                <Activity className="w-8 h-8 text-gray-300" />
                <span className="text-sm font-medium text-gray-400 italic">Market data unavailable</span>
                <button onClick={fetchPriceData} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-bold text-gray-600 uppercase">Retry</span>
                </button>
            </div>
        )
    }

    const usd = data?.usd || 0
    const usd_24h_change = data?.usd_24h_change || 0
    const isPositive = usd_24h_change >= 0

    return (
        <div className="w-72 p-5 bg-white border border-gray-100 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-500 group animate-in fade-in slide-in-from-left-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform duration-500">
                        <span className="text-sm font-black text-white italic">A</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">ALEO NETWORK</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900 tabular-nums">
                                ${usd.toFixed(2)}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">USD</span>
                        </div>
                    </div>
                </div>
                <div className={`flex flex-col items-end gap-1 px-3 py-1.5 rounded-2xl ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    <div className="flex items-center gap-1">
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="text-xs font-black tabular-nums">
                            {Math.abs(usd_24h_change).toFixed(2)}%
                        </span>
                    </div>
                    <span className="text-[8px] font-bold uppercase opacity-60">24h Change</span>
                </div>
            </div>

            {/* Chart Section */}
            <div className="h-32 w-full mt-2 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-gray-900 text-white px-2 py-1 rounded text-[10px] font-bold">
                                            ${payload[0].value?.toLocaleString()}
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={isPositive ? "#10b981" : "#ef4444"}
                            strokeWidth={3}
                            dot={false}
                            animationDuration={2000}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between mt-4 bg-gray-50/50 p-2 rounded-xl">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Live Trading</span>
                </div>
                <button onClick={fetchPriceData} className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1">
                    <RefreshCw className="w-2.5 h-2.5" />
                    REFRESH
                </button>
            </div>
        </div>
    )
}
