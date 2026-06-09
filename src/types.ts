export type EmotionType = "calm" | "greedy" | "fearful" | "impatient" | "fomo";

export interface Trade {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl: number; // dynamically calculated but editable
  emotion: EmotionType;
  notes?: string;
  time?: string; // HH:MM
}

export interface TradingPlan {
  maxDailyLoss: number;
  maxTradesPerDay: number;
  riskPerTradePercent: number;
  rules: string[];
}

export interface AISummary {
  performanceSummary: string;
  mindsetAnalysis: string;
  journalText: string;
  marketAdvice: string;
  grade: "A" | "B" | "C" | "D" | "F" | string;
}

export interface DailyJournalEntry {
  date: string; // YYYY-MM-DD
  trades: Trade[];
  manualReflections: string;
  aiSummary?: AISummary;
  createdAt: string;
  updatedAt: string;
}
