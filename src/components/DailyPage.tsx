import React, { useState, useEffect } from "react";
import { DailyJournalEntry, Trade, EmotionType, TradingPlan } from "../types";
import { 
  Plus, Trash2, Edit3, BookOpen, Brain, 
  TrendingUp, TrendingDown, RefreshCw, Calendar, 
  Sparkles, CheckCircle2, ChevronRight, Ban 
} from "lucide-react";
import { motion } from "motion/react";

interface DailyPageProps {
  entry: DailyJournalEntry;
  plan: TradingPlan;
  onUpdateEntry: (updatedEntry: DailyJournalEntry) => void;
}

export default function DailyPage({ entry, plan, onUpdateEntry }: DailyPageProps) {
  // Trade Form States
  const [symbol, setSymbol] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [exitPrice, setExitPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [pnl, setPnl] = useState<string>("");
  const [emotion, setEmotion] = useState<EmotionType>("calm");
  const [notes, setNotes] = useState("");
  const [time, setTime] = useState("");

  // Manual Reflection States
  const [manualText, setManualText] = useState(entry.manualReflections || "");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setManualText(entry.manualReflections || "");
  }, [entry.date]);

  // Handle automatic PnL calculations
  useEffect(() => {
    const entryNum = parseFloat(entryPrice);
    const exitNum = parseFloat(exitPrice);
    const qtyNum = parseFloat(quantity);

    if (!isNaN(entryNum) && !isNaN(exitNum) && !isNaN(qtyNum)) {
      let calculatedPnl = 0;
      if (direction === "LONG") {
        calculatedPnl = (exitNum - entryNum) * qtyNum;
      } else {
        calculatedPnl = (entryNum - exitNum) * qtyNum;
      }
      setPnl(calculatedPnl.toFixed(2));
    }
  }, [entryPrice, exitPrice, quantity, direction]);

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !entryPrice || !exitPrice || !quantity) {
      alert("Please fill in symbol, entry, exit, and size parameters.");
      return;
    }

    const tradePnl = parseFloat(pnl) || 0;

    // Default time to current local hour/minute if empty
    let tradeTime = time;
    if (!tradeTime) {
      const now = new Date();
      tradeTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      symbol: symbol.trim().toUpperCase(),
      direction,
      entryPrice: Number(entryPrice),
      exitPrice: Number(exitPrice),
      quantity: Number(quantity),
      pnl: tradePnl,
      emotion,
      notes: notes.trim(),
      time: tradeTime,
    };

    onUpdateEntry({
      ...entry,
      trades: [...(entry.trades || []), newTrade],
      updatedAt: new Date().toISOString(),
    });

    // Reset Form
    setSymbol("");
    setEntryPrice("");
    setExitPrice("");
    setQuantity("");
    setPnl("");
    setEmotion("calm");
    setNotes("");
    setTime("");
  };

  const handleRemoveTrade = (tradeId: string) => {
    onUpdateEntry({
      ...entry,
      trades: (entry.trades || []).filter(t => t.id !== tradeId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveReflections = () => {
    onUpdateEntry({
      ...entry,
      manualReflections: manualText,
      updatedAt: new Date().toISOString(),
    });
    alert("Daily annotations saved successfully.");
  };

  // call the Express backend /api/gemini/analyze
  const handleGenerateAISummary = async () => {
    setIsAiLoading(true);
    setAiError("");

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: entry.date,
          trades: entry.trades || [],
          manualReflections: manualText,
          tradingPlan: plan,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to conduct AI analysis.");
      }

      onUpdateEntry({
        ...entry,
        aiSummary: data,
        manualReflections: manualText,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "An unexpected error occurred during report synthesis.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Daily Calculations
  const tradesList = entry.trades || [];
  const dailyPnL = tradesList.reduce((sum, t) => sum + t.pnl, 0);
  const winCount = tradesList.filter(t => t.pnl > 0).length;
  const winRate = tradesList.length > 0 ? (winCount / tradesList.length) * 100 : 0;

  // Plan compliance check flags
  const ruleLossExceeded = plan.maxDailyLoss > 0 && Math.abs(dailyPnL) > plan.maxDailyLoss && dailyPnL < 0;
  const ruleTradesExceeded = plan.maxTradesPerDay > 0 && tradesList.length > plan.maxTradesPerDay;

  const emotionColors: Record<EmotionType, string> = {
    calm: "bg-emerald-50 text-emerald-700 border-emerald-200",
    greedy: "bg-amber-50 text-amber-700 border-amber-200",
    fearful: "bg-blue-50 text-blue-700 border-blue-200",
    impatient: "bg-purple-50 text-purple-700 border-purple-200",
    fomo: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const emotionEmojis: Record<EmotionType, string> = {
    calm: "🧘 Calm",
    greedy: "🤑 Greed",
    fearful: "😨 Fear",
    impatient: "⏳ Impatience",
    fomo: "🌪️ FOMO",
  };

  // Convert Date to friendly formatting
  const friendlyDate = new Date(entry.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="flex flex-col h-full bg-[#FCFBF8] text-stone-850 p-8 rounded-lg shadow-sm font-serif border border-stone-200 overflow-y-auto relative">
      {/* Red vertical ledger rule mimicking physical notebook */}
      <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-red-100 hidden md:block" />

      <div className="md:pl-6">
        
        {/* Date Headers */}
        <div className="border-b-2 border-stone-350 pb-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
          <div>
            <div className="flex items-center gap-2 text-stone-400 font-mono text-xs uppercase tracking-widest mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>LOGBOOK PAGE</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-stone-900 leading-tight">
              {friendlyDate}
            </h1>
          </div>

          {/* Quick Metrics display */}
          <div className="flex gap-4 font-sans text-xs">
            <div className="bg-stone-100/75 border border-stone-250 px-3 py-1.5 rounded">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400">Total Return</span>
              <span className={`font-mono font-bold text-sm ${dailyPnL >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {dailyPnL >= 0 ? "+" : ""}${dailyPnL.toFixed(2)}
              </span>
            </div>
            <div className="bg-stone-100/75 border border-stone-250 px-3 py-1.5 rounded">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-stone-400">Win Rate</span>
              <span className="font-mono font-bold text-sm text-stone-700">
                {winRate.toFixed(0)}% ({winCount}/{tradesList.length})
              </span>
            </div>
            {tradesList.length > 0 && (
              <div className="flex items-center">
                {ruleLossExceeded || ruleTradesExceeded ? (
                  <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                    RULES BREACHED
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                    COMPLIANT
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 1: Adding a trade */}
        <div className="bg-white border border-stone-250 rounded-md p-5 mb-8 shadow-xs font-sans">
          <h2 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 font-serif border-b border-stone-100 pb-2">
            <Plus className="w-4 h-4 text-stone-600" />
            Log New Execution
          </h2>

          <form onSubmit={handleAddTrade} className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* Symbol */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Asset Symbol</label>
              <input
                type="text"
                placeholder="BTCUSDT, AAPL"
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 text-sm uppercase text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                required
                id="trade-symbol-input"
              />
            </div>

            {/* Direction */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Direction</label>
              <select
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 text-sm text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white"
                value={direction}
                onChange={(e) => setDirection(e.target.value as "LONG" | "SHORT")}
                id="trade-direction-input"
              >
                <option value="LONG">Long / Buy</option>
                <option value="SHORT">Short / Sell</option>
              </select>
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Entry Price</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 text-sm font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                required
                id="trade-entry-input"
              />
            </div>

            {/* Exit Price */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Exit Price</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 text-sm font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                required
                id="trade-exit-input"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Quantity/Qty</label>
              <input
                type="number"
                step="any"
                placeholder="1"
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 text-sm font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                id="trade-quantity-input"
              />
            </div>

            {/* Calculated Net PNL (Editable) */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Calculated P&L ($)</label>
              <input
                type="number"
                step="any"
                className="w-full bg-stone-100 border border-stone-300 rounded px-2.5 py-1.5 text-sm font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                id="trade-pnl-input"
              />
            </div>

            {/* Detailed Emotional State choice */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">Mental State During Execution</label>
              <div className="flex flex-wrap gap-1.5">
                {(["calm", "greedy", "fearful", "impatient", "fomo"] as EmotionType[]).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmotion(em)}
                    className={`px-3 py-1 bg-stone-50 text-xs font-semibold rounded border transition-all ${
                      emotion === em 
                        ? "bg-stone-900 border-stone-900 text-white" 
                        : "hover:bg-stone-100 border-stone-200 text-stone-600"
                    }`}
                    id={`emotion-select-${em}`}
                  >
                    {emotionEmojis[em]}
                  </button>
                ))}
              </div>
            </div>

            {/* Details and Time */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Trade Annotations / Notes</label>
              <input
                type="text"
                placeholder="Breakout trigger, or moved stop..."
                className="w-full bg-stone-50 border border-stone-300 rounded px-2.5 py-1.5 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                id="trade-notes-input"
              />
            </div>

            <div className="flex items-end mt-4 md:mt-0 col-span-2 md:col-span-1">
              <button
                type="submit"
                className="w-full py-1.5 bg-stone-800 hover:bg-stone-900 text-stone-50 text-xs font-bold rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                id="add-execution-btn"
              >
                <Plus className="w-4 h-4" /> Add Execution
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 2: Active Trade Ledger Table */}
        <div className="bg-white border border-stone-250 rounded-md p-1 mb-8 shadow-xs font-sans overflow-hidden">
          <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-[#faf9f6]/40">
            <h2 className="text-sm font-bold text-stone-600 uppercase tracking-widest font-serif flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-stone-500" />
              Daily Entry Register
            </h2>
            <span className="text-xs text-stone-400 font-mono">{tradesList.length} trades registered</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-400 uppercase text-[9px] tracking-wider border-b border-stone-200">
                  <th className="py-2.5 px-4 font-bold">Direction</th>
                  <th className="py-2.5 px-4 font-bold">Asset</th>
                  <th className="py-2.5 px-3 font-bold text-right">Entry</th>
                  <th className="py-2.5 px-3 font-bold text-right">Exit</th>
                  <th className="py-2.5 px-3 font-bold text-right">Size/Qty</th>
                  <th className="py-2.5 px-4 font-bold text-right">Net Return</th>
                  <th className="py-2.5 px-4 font-bold text-center">Mental State</th>
                  <th className="py-2.5 px-4 font-bold">Annotations</th>
                  <th className="py-2.5 px-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {tradesList.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded-sm uppercase text-[9px] font-black border ${
                        t.direction === "LONG" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800 font-mono tracking-wide">{t.symbol}</td>
                    <td className="py-3 px-3 font-mono text-right text-stone-600">${t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 font-mono text-right text-stone-600">${t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 font-mono text-right text-stone-600">{t.quantity}</td>
                    <td className="py-3 px-4 font-mono text-right font-bold">
                      <span className={t.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block py-0.5 px-2 text-[10px] font-semibold rounded-full border ${emotionColors[t.emotion] || emotionColors.calm}`}>
                        {emotionEmojis[t.emotion] || t.emotion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-500 italic max-w-xs truncate">{t.notes || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleRemoveTrade(t.id)}
                        className="text-stone-300 hover:text-rose-600 transition-colors"
                        title="Delete record"
                        id={`delete-trade-${t.id}`}
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
                {tradesList.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400 italic font-medium bg-stone-50/20">
                      No executions registered for this day yet. Fill out the ledger trigger above to log trade history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Reflections & AI Summary Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Manual reflections text field */}
          <div className="bg-white border border-stone-250 rounded-md p-5 shadow-xs flex flex-col justify-between">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-stone-600 uppercase tracking-widest font-serif mb-2 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-stone-500" />
                Manual Annotations & Reflections
              </h2>
              <p className="text-xs text-stone-500 font-sans mb-3">
                Jot down what you observed inside the market, why you triggered setup levels, and emotional feedback.
              </p>
              <textarea
                className="w-full bg-stone-50/50 border border-stone-200 rounded-lg p-3 font-sans text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:bg-white h-[200px]"
                placeholder="Today, I noticed some breakout setups on BTC. My core rule was not to overleverage, but emotion took over on trade #2... I need to respect my stop limits better."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                id="manual-annotations-textarea"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSaveReflections}
                className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 text-xs font-semibold rounded transition-all shadow-sm"
                id="save-manual-notes-btn"
              >
                Save Annotations
              </button>
              <button
                onClick={handleGenerateAISummary}
                disabled={isAiLoading || tradesList.length === 0}
                className={`px-4 py-2 bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold rounded flex items-center gap-1.5 transition-all shadow-sm ${
                  isAiLoading || tradesList.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                id="generate-ai-review-btn"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synthesizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Synthesize AI Journal Card
                  </>
                )}
              </button>
            </div>
            {tradesList.length === 0 && (
              <p className="text-[10px] text-stone-400 font-sans mt-2 text-right">
                ⚠️ Register at least one trade to activate AI compilation.
              </p>
            )}
          </div>

          {/* AI generated Summary Display */}
          <div className="bg-stone-50 border border-stone-250 rounded-md p-6 shadow-xs relative">
            <div className="absolute right-6 top-6">
              <Brain className="w-8 h-8 text-stone-300 stroke-1" />
            </div>

            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center font-sans">
                <div className="relative mb-4">
                  <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-stone-800 animate-spin" />
                  <Sparkles className="w-5 h-5 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <h3 className="text-sm font-bold text-stone-700 uppercase tracking-widest mt-2 animate-pulse">AI Review System</h3>
                <p className="text-xs text-stone-400 max-w-xs mt-1 leading-relaxed">
                  Analyzing emotional coordinates, calculating rule parameters, and crafting your daily vintage leather notebook page. Just a moment...
                </p>
              </div>
            ) : aiError ? (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-xs font-sans text-red-700 leading-relaxed">
                <h4 className="font-bold text-sm mb-1">Synthesis Failure</h4>
                <p>{aiError}</p>
                <button 
                  onClick={handleGenerateAISummary}
                  className="mt-3 bg-red-600 text-white rounded px-2.5 py-1 hover:bg-red-700 font-bold tracking-wide"
                  id="retry-ai-btn"
                >
                  Retry Analysis
                </button>
              </div>
            ) : entry.aiSummary ? (
              /* The Beautiful Notebook AI Page */
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                {/* Vintage Letter Grade Header */}
                <div className="flex items-center gap-4 border-b border-stone-200 pb-3">
                  <div className="w-14 h-14 bg-stone-900 rounded-full border-4 border-stone-100 flex items-center justify-center shadow-md">
                    <span className="text-white text-2xl font-black font-sans leading-none">
                      {entry.aiSummary.grade || "A"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-stone-900 leading-none">Discipline Grade Card</h3>
                    <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider mt-1">Based on Tactical Compliance</p>
                  </div>
                </div>

                {/* Performance Summary block */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-1">Risk & Execution Review</h4>
                  <p className="text-xs text-stone-700 max-h-[85px] overflow-y-auto font-sans leading-relaxed italic bg-white p-3 border border-stone-150 rounded">
                    "{entry.aiSummary.performanceSummary}"
                  </p>
                </div>

                {/* Emotional mindset review */}
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-1">Psychological Analysis</h4>
                  <p className="text-xs text-stone-700 max-h-[85px] overflow-y-auto font-sans leading-relaxed italic bg-white p-3 border border-stone-150 rounded">
                    "{entry.aiSummary.mindsetAnalysis}"
                  </p>
                </div>

                {/* Continual Journal narrative */}
                <div className="border-t border-dashed border-stone-250 pt-2 bg-yellow-10/20 rounded p-1">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-1">Journal Entry Transcription</h4>
                  <p className="text-sm text-stone-850 leading-relaxed max-h-[140px] overflow-y-auto pr-1">
                    {entry.aiSummary.journalText}
                  </p>
                </div>

                {/* Next Day Directive Bullet points */}
                <div className="border-t border-dashed border-stone-250 pt-3">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest font-mono mb-2">Focus Directives for Tomorrow</h4>
                  <div className="text-xs text-stone-700 space-y-1.5 font-sans">
                    {entry.aiSummary.marketAdvice.split("\n").filter(line => line.trim()).map((line, idx) => {
                      // Strip bullet indices if returned to look ultra clean
                      const cleanLine = line.replace(/^[-*•\s\d.]+/g, "").trim();
                      return (
                        <div key={idx} className="flex gap-2 items-start bg-amber-50/50 p-2 border border-amber-100 rounded">
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span className="font-medium text-stone-700">{cleanLine}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-stone-400 text-center font-sans">
                <Sparkles className="w-12 h-12 text-stone-300 stroke-1 mb-3" />
                <h3 className="text-xs font-bold text-stone-600 uppercase tracking-widest">Synthesis Pending</h3>
                <p className="text-xs text-stone-500 max-w-xs mt-1 leading-relaxed">
                  Compile your trades, add annotations on your behavior, and trigger the AI to write your professional psychological journal page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
