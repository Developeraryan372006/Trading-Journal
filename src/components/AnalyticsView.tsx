import React from "react";
import { DailyJournalEntry, Trade, EmotionType } from "../types";
import { 
  TrendingUp, TrendingDown, Target, HelpCircle, 
  Smile, Activity, DollarSign, Award, Percent
} from "lucide-react";
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from "recharts";

interface AnalyticsViewProps {
  entries: DailyJournalEntry[];
}

export default function AnalyticsView({ entries }: AnalyticsViewProps) {
  // Extract all trades
  const allTrades: Trade[] = entries.flatMap(entry => {
    // Inject date into the trade context for time-series charts
    return (entry.trades || []).map(t => ({
      ...t,
      date: entry.date,
    } as any));
  });

  // Basic calculation states
  const totalTradesCount = allTrades.length;
  const profitableTrades = allTrades.filter(t => t.pnl > 0);
  const winRate = totalTradesCount > 0 ? (profitableTrades.length / totalTradesCount) * 100 : 0;
  
  const totalPnL = allTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLosses = Math.abs(allTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const grossWins = allTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses) : grossWins > 0 ? 100 : 0;

  const averageTrade = totalTradesCount > 0 ? totalPnL / totalTradesCount : 0;
  const maxWin = allTrades.length > 0 ? Math.max(...allTrades.map(t => t.pnl)) : 0;
  const maxLoss = allTrades.length > 0 ? Math.min(...allTrades.map(t => t.pnl)) : 0;

  // 1. Time Series Chart Data (Daily Cumulative PnL)
  // Sort entries chronologically
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let runningPnL = 0;
  const pnlTrendData = sortedEntries.map(entry => {
    const dailyPnL = (entry.trades || []).reduce((sum, t) => sum + t.pnl, 0);
    runningPnL += dailyPnL;
    return {
      date: entry.date,
      daily: dailyPnL,
      cumulative: runningPnL,
      tradeCount: (entry.trades || []).length,
    };
  });

  // 2. Asset distribution
  const assetPnLMap: Record<string, { count: number; pnl: number }> = {};
  allTrades.forEach(t => {
    const sym = t.symbol.trim().toUpperCase() || "UNKNOWN";
    if (!assetPnLMap[sym]) {
      assetPnLMap[sym] = { count: 0, pnl: 0 };
    }
    assetPnLMap[sym].count += 1;
    assetPnLMap[sym].pnl += t.pnl;
  });
  
  const assetData = Object.keys(assetPnLMap).map(sym => ({
    symbol: sym,
    pnl: Number(assetPnLMap[sym].pnl.toFixed(2)),
    count: assetPnLMap[sym].count,
  })).sort((a, b) => b.pnl - a.pnl);

  // 3. Emotion breakdown & correlation (Key Psychological Insight)
  const emotionMap: Record<EmotionType, { count: number; wins: number; pnl: number; average: number }> = {
    calm: { count: 0, wins: 0, pnl: 0, average: 0 },
    greedy: { count: 0, wins: 0, pnl: 0, average: 0 },
    fearful: { count: 0, wins: 0, pnl: 0, average: 0 },
    impatient: { count: 0, wins: 0, pnl: 0, average: 0 },
    fomo: { count: 0, wins: 0, pnl: 0, average: 0 },
  };

  allTrades.forEach(t => {
    const em = (t.emotion || "calm").toLowerCase() as EmotionType;
    if (emotionMap[em]) {
      emotionMap[em].count += 1;
      emotionMap[em].pnl += t.pnl;
      if (t.pnl > 0) {
        emotionMap[em].wins += 1;
      }
    }
  });

  const emotionColors: Record<EmotionType, string> = {
    calm: "#10b981",      // emerald
    greedy: "#f59e0b",     // amber
    fearful: "#3b82f6",    // blue
    impatient: "#8b5cf6", // purple
    fomo: "#ef4444",      // red
  };

  const emotionLabels: Record<EmotionType, string> = {
    calm: "🧘 Disciplined/Calm",
    greedy: "🤑 Greed/Avarice",
    fearful: "😨 Fear/Panic",
    impatient: "⏳ Impatience",
    fomo: "🌪️ FOMO/Chasing",
  };

  const emotionData = Object.keys(emotionMap).map(key => {
    const emKey = key as EmotionType;
    const item = emotionMap[emKey];
    return {
      id: emKey,
      name: emotionLabels[emKey],
      count: item.count,
      pnl: Number(item.pnl.toFixed(2)),
      winRate: item.count > 0 ? Number(((item.wins / item.count) * 100).toFixed(1)) : 0,
      average: item.count > 0 ? Number((item.pnl / item.count).toFixed(2)) : 0,
      color: emotionColors[emKey],
    };
  }).filter(e => e.count > 0);

  // If there are no trades logged yet
  if (totalTradesCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 bg-[#FCFBF8] text-stone-700 border border-stone-200 rounded-lg text-center font-serif">
        <Activity className="w-16 h-16 text-stone-300 stroke-1 mb-4" />
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Awaiting Logging Data</h2>
        <p className="max-w-md text-stone-500 font-sans text-sm leading-relaxed">
          The Analytics Dashboard compiles metrics directly from your notebook pages. 
          Step back into your log pages and register your first trades with emotional states to unlock psychological charts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FCFBF8] text-stone-800 p-8 rounded-lg shadow-sm font-serif border border-stone-200 overflow-y-auto">
      {/* Notebook Header */}
      <div className="border-b-2 border-stone-300 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-900 text-[#FCFBF8] rounded">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-stone-900">Trading Ledger Metrics</h1>
            <p className="text-xs text-stone-500 font-mono uppercase tracking-widest mt-1">Stochastics, Performance, & Psychopathology</p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-sans">
        {/* Net PnL */}
        <div className="bg-white border border-stone-200 p-4 rounded-md shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Net Return</span>
            <DollarSign className="w-4 h-4 text-stone-400" />
          </div>
          <p className={`text-2xl font-black ${totalPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {totalPnL >= 0 ? "+" : ""}${totalPnL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-stone-400 mt-1">Cumulative across all session dates</p>
        </div>

        {/* Win Rate */}
        <div className="bg-white border border-stone-200 p-4 rounded-md shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
            <Target className="w-4 h-4 text-stone-500" />
          </div>
          <p className="text-2xl font-black text-stone-800">
            {winRate.toFixed(1)}%
          </p>
          <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2">
            <div 
              className="bg-stone-800 h-1.5 rounded-full" 
              style={{ width: `${Math.min(winRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-white border border-stone-200 p-4 rounded-md shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Profit Factor</span>
            <Percent className="w-4 h-4 text-stone-400" />
          </div>
          <p className={`text-2xl font-black ${profitFactor >= 2 ? "text-emerald-700" : profitFactor >= 1 ? "text-stone-700" : "text-amber-700"}`}>
            {profitFactor === 100 ? "∞" : profitFactor.toFixed(2)}
          </p>
          <p className="text-[10px] text-stone-400 mt-1">Ratio of Gross Wins / Gross Losses</p>
        </div>

        {/* Average Trade */}
        <div className="bg-white border border-stone-200 p-4 rounded-md shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Exp. Payoff</span>
            <Award className="w-4 h-4 text-stone-400" />
          </div>
          <p className={`text-2xl font-black ${averageTrade >= 0 ? "text-stone-800" : "text-rose-600"}`}>
            {averageTrade >= 0 ? "+" : ""}${averageTrade.toFixed(2)}
          </p>
          <p className="text-[10px] text-stone-400 mt-1">Average outcome per single trade</p>
        </div>
      </div>

      {/* Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 font-sans">
        {/* Cumulative performance chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-md p-5 shadow-xs">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Equity Curve / Cumulative P&L</h2>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pnlTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 10 }} />
                <YAxis tick={{ fill: "#78716c", fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Equity"]} 
                  contentStyle={{ backgroundColor: "#fafaf9", borderColor: "#e7e5e4" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#1c1917" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, stroke: "#1c1917", fill: "#ffffff" }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade metrics table / mini-analysis */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4">Boundary Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                <span className="text-stone-500 text-sm">Best Logged Profit</span>
                <span className="font-mono font-bold text-emerald-600">+${maxWin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                <span className="text-stone-500 text-sm">Largest Single Loss</span>
                <span className="font-mono font-bold text-rose-600">${maxLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                <span className="text-stone-500 text-sm">Total Register Book</span>
                <span className="font-mono font-bold text-stone-800">{totalTradesCount} entries</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-stone-500 text-sm">Profitable trades</span>
                <span className="font-mono font-bold text-stone-700">{profitableTrades.length} / {totalTradesCount}</span>
              </div>
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-200 p-3 rounded text-xs text-stone-500 leading-relaxed italic border-l-stone-800 border-l-2">
            The mathematical expected payoff represents your strategic edge. Keep emotional errors low to support positive metrics.
          </div>
        </div>
      </div>

      {/* Psychological Insights: Emotion Correlation (The main highlight!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
        
        {/* Average return by mental state */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-xs">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-2">Average P&L per Mental State</h2>
          <p className="text-xs text-stone-500 mb-4">Provides exact scientific feedback on what triggers cause monetary bleed</p>
          
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="id" tick={{ fill: "#78716c", fontSize: 11 }} />
                <YAxis tick={{ fill: "#78716c", fontSize: 10 }} />
                <Tooltip 
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Avg P&L"]}
                  contentStyle={{ backgroundColor: "#fafaf9", borderColor: "#e7e5e4" }}
                />
                <Bar dataKey="average">
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win rates vs Emotion & volume */}
        <div className="bg-white border border-stone-200 rounded-md p-5 shadow-xs flex flex-col">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-1">Psychological Outliers</h2>
          <p className="text-xs text-stone-500 mb-4">Individual breakdowns categorized per mindset state</p>
          
          <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[220px]">
            {emotionData.map((em, index) => (
              <div key={index} className="flex flex-col border border-stone-100 p-3 rounded-md bg-stone-50">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: em.color }} />
                    <span className="font-semibold text-stone-800 text-sm">{em.name}</span>
                  </div>
                  <span className="text-xs font-bold font-mono py-0.5 px-2 bg-stone-200 text-stone-700 rounded-full">
                    {em.count} trade{em.count > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="flex justify-between border-r border-stone-200 pr-4">
                    <span className="text-stone-400">Avg Return:</span>
                    <span className={`font-bold ${em.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      ${em.average.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pl-2">
                    <span className="text-stone-400">Win Rate:</span>
                    <span className="font-bold text-stone-700">{em.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
