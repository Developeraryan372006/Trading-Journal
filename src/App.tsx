import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DailyPage from "./components/DailyPage";
import TradingPlanComponent from "./components/TradingPlanComponent";
import AnalyticsView from "./components/AnalyticsView";
import { DailyJournalEntry, TradingPlan } from "./types";
import { Book, Menu, HelpCircle, Save, Info } from "lucide-react";

// Firebase imports
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logoutUser, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";

// Professional default trading plan setup
const DEFAULT_TRADING_PLAN: TradingPlan = {
  maxDailyLoss: 500,
  maxTradesPerDay: 5,
  riskPerTradePercent: 1.0,
  rules: [
    "Always place a hard Stop Loss immediately upon executing an entry.",
    "Never add to a losing position (under no circumstances average down).",
    "Once the max daily loss limit is reached, shut down all terminals instantly.",
    "No revenge trading. Wait at least 1 hour after a loss to reset mental coordinates.",
    "Verify multiple timescale filters (e.g. 1H trend & 5M entry) before execution.",
  ],
};

// Elegant seed data to make the app beautiful out of the box
const SEED_DATA: DailyJournalEntry[] = [
  {
    date: "2026-06-07",
    trades: [
      {
        id: "seed-trade-1",
        symbol: "AAPL",
        direction: "LONG",
        entryPrice: 175.20,
        exitPrice: 178.50,
        quantity: 50,
        pnl: 165.00,
        emotion: "calm",
        notes: "Retrace confirmation on 5m EMA bounds.",
        time: "10:30",
      },
      {
        id: "seed-trade-2",
        symbol: "BTCUSDT",
        direction: "LONG",
        entryPrice: 65200,
        exitPrice: 64800,
        quantity: 0.5,
        pnl: -200.00,
        emotion: "fomo",
        notes: "Chased local resistance breakdown, lessons learned.",
        time: "14:15",
      }
    ],
    manualReflections: "Overall AAPL execution worked exactly as mapped. However, I over-engaged with BTC trigger because of FOMO... I must wait for candles to close next time.",
    aiSummary: {
      grade: "B",
      performanceSummary: "The AAPL setup was a highly compliant, textbook execution. Your BTC action, however, broke key entry parameters and suffered psychological leakage.",
      mindsetAnalysis: "AAPL shows high levels of focus and patience. BTC shows significant FOMO and impatience. You kept risk limits properly tight, ensuring loss didn't escalate.",
      journalText: "Sunday opened with narrow consolidation vectors. AAPL offered clean breakout retraces which were caught perfectly on the 175 cushion, delivering a swift profit of $165. Later, a sudden BTC squeeze prompted key panic. Chasing high-level prices resulted in a swift $200 drawdown, prompting a manual shutdown of terminal lines to ensure zero further overtrading errors.",
      marketAdvice: "- Avoid trading hot assets unless fully confirmed structural ranges are present.\n- Strictly wait for candles to close before claiming breakout triggers."
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    date: "2026-06-08",
    trades: [
      {
        id: "seed-trade-3",
        symbol: "EURUSD",
        direction: "LONG",
        entryPrice: 1.0820,
        exitPrice: 1.0865,
        quantity: 100000,
        pnl: 450.00,
        emotion: "calm",
        notes: "Bullish divergence confirmation on 1H RSI limits.",
        time: "09:45",
      },
      {
        id: "seed-trade-4",
        symbol: "ETHUSDT",
        direction: "LONG",
        entryPrice: 3450,
        exitPrice: 3495,
        quantity: 4,
        pnl: 180.00,
        notes: "High volume consolidation break.",
        emotion: "calm",
        time: "11:15",
      }
    ],
    manualReflections: "Incredible discipline displayed today. Sat on hand until high-timeframe coordinates developed and exited cleanly on target structural pivots.",
    aiSummary: {
      grade: "A",
      performanceSummary: "Outstanding session summary! Completely adhered to the trade targets. Win rate reached 100% with solid profit factor metrics.",
      mindsetAnalysis: "You operated out of absolute composure and focus. Zero impulsiveness or chase triggers logged. This represents top state system execution.",
      journalText: "The session recorded high systemic flows. EURUSD experienced strong technical demands, facilitating a patient long trigger on the 1.082 support. The trade completed cleanly on structural resistance margins, locking down $450. A follow-up ETH volume breakout confirmed strong buying interest, executing flawlessly for an additional $180 total.",
      marketAdvice: "- Lock in these psychological gains and duplicate this patience tomorrow.\n- Carry over this structured sizing pattern into the coming trading sessions."
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function App() {
  const [entries, setEntries] = useState<DailyJournalEntry[]>([]);
  const [tradingPlan, setTradingPlan] = useState<TradingPlan>(DEFAULT_TRADING_PLAN);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"journal" | "plan" | "analytics">("journal");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Authentication and Sync state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDbSyncing, setIsDbSyncing] = useState(false);

  // Handle Google Login
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Google authentication error:", err);
    }
  };

  // Handle Log out
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  // Live Firebase Sync & Local storage fallback logic
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsDbSyncing(true);
        try {
          // 1. Fetch Cloud Trading Plan
          const planRef = doc(db, "users", currentUser.uid);
          const planSnap = await getDoc(planRef);

          let activePlan = tradingPlan;
          if (planSnap.exists()) {
            const data = planSnap.data();
            activePlan = {
              maxDailyLoss: data.maxDailyLoss ?? DEFAULT_TRADING_PLAN.maxDailyLoss,
              maxTradesPerDay: data.maxTradesPerDay ?? DEFAULT_TRADING_PLAN.maxTradesPerDay,
              riskPerTradePercent: data.riskPerTradePercent ?? DEFAULT_TRADING_PLAN.riskPerTradePercent,
              rules: data.rules ?? DEFAULT_TRADING_PLAN.rules,
            };
            setTradingPlan(activePlan);
          } else {
            // First time login: Back up offline plan to database
            await setDoc(planRef, {
              userId: currentUser.uid,
              ...tradingPlan,
              updatedAt: new Date().toISOString(),
            });
          }

          // 2. Setup Real-time database subscription for journal entries
          const entriesCollectionRef = collection(db, "users", currentUser.uid, "entries");
          const unsubscribeEntries = onSnapshot(entriesCollectionRef, (snapshot) => {
            setIsDbSyncing(true);
            const cloudEntries: DailyJournalEntry[] = [];
            snapshot.forEach((docSnap) => {
              cloudEntries.push(docSnap.data() as DailyJournalEntry);
            });

            if (cloudEntries.length > 0) {
              setEntries(cloudEntries);
              const sorted = [...cloudEntries].sort((a, b) => b.date.localeCompare(a.date));
              // Focus page if selection is empty/stale
              if (!selectedDate || !cloudEntries.some((e) => e.date === selectedDate)) {
                setSelectedDate(sorted[0].date);
              }
            } else {
              // Firestore entries empty: Let's migrate offline entries if they exist
              const storedEntries = localStorage.getItem("trading_trade_journal_entries") || localStorage.getItem("scribe_trade_journal_entries");
              if (storedEntries) {
                try {
                  const locals: DailyJournalEntry[] = JSON.parse(storedEntries);
                  if (locals.length > 0) {
                    locals.forEach(async (entry) => {
                      await setDoc(doc(db, "users", currentUser.uid, "entries", entry.date), entry);
                    });
                  }
                } catch (e) {
                  console.error("Local storage sync error:", e);
                }
              } else {
                // Pre-populate elegant sample logs so UI is complete
                SEED_DATA.forEach(async (entry) => {
                  await setDoc(doc(db, "users", currentUser.uid, "entries", entry.date), entry);
                });
              }
            }
            setIsDbSyncing(false);
          }, (err) => {
            handleFirestoreError(err, OperationType.LIST, `users/${currentUser.uid}/entries`);
          });

          return () => {
            unsubscribeEntries();
          };

        } catch (err) {
          console.error("Failed to map live subscription streams:", err);
        } finally {
          setIsDbSyncing(false);
          setIsAuthLoading(false);
        }
      } else {
        // Logged out: fallback gracefully to local storage
        setIsAuthLoading(false);
        const storedEntries = localStorage.getItem("trading_trade_journal_entries") || localStorage.getItem("scribe_trade_journal_entries");
        const storedPlan = localStorage.getItem("trading_trade_journal_plan") || localStorage.getItem("scribe_trade_journal_plan");

        if (storedEntries) {
          try {
            const parsed = JSON.parse(storedEntries);
            setEntries(parsed);
            if (parsed.length > 0) {
              const sorted = [...parsed].sort((a, b) => b.date.localeCompare(a.date));
              setSelectedDate(sorted[0].date);
            }
          } catch (err) {
            setEntries(SEED_DATA);
            setSelectedDate("2026-06-08");
          }
        } else {
          setEntries(SEED_DATA);
          setSelectedDate("2026-06-08");
        }

        if (storedPlan) {
          try {
            setTradingPlan(JSON.parse(storedPlan));
          } catch (err) {
            setTradingPlan(DEFAULT_TRADING_PLAN);
          }
        }
      }
    });

    return () => unsubscribeAuth();
  }, [user ? user.uid : null]);

  // Sync entries either to Cloud Firestore or local storage safely
  const saveEntries = async (updatedEntries: DailyJournalEntry[]) => {
    setEntries(updatedEntries);
    localStorage.setItem("trading_trade_journal_entries", JSON.stringify(updatedEntries));
  };

  // Sync changing trading plan
  const savePlan = async (updatedPlan: TradingPlan) => {
    setTradingPlan(updatedPlan);
    localStorage.setItem("trading_trade_journal_plan", JSON.stringify(updatedPlan));
    if (user) {
      setIsDbSyncing(true);
      const path = `users/${user.uid}`;
      try {
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          ...updatedPlan,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      } finally {
        setIsDbSyncing(false);
      }
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setActiveTab("journal");
  };

  const handleAddDatePage = async (newDateStr: string) => {
    // If date already exists, focus it
    const existing = entries.find((e) => e.date === newDateStr);
    if (existing) {
      setSelectedDate(newDateStr);
      return;
    }

    const newPage: DailyJournalEntry = {
      date: newDateStr,
      trades: [],
      manualReflections: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (user) {
      setIsDbSyncing(true);
      const path = `users/${user.uid}/entries/${newDateStr}`;
      try {
        await setDoc(doc(db, "users", user.uid, "entries", newDateStr), newPage);
        setSelectedDate(newDateStr);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      } finally {
        setIsDbSyncing(false);
      }
    } else {
      const updated = [...entries, newPage];
      saveEntries(updated);
      setSelectedDate(newDateStr);
    }
  };

  const handleUpdateEntry = async (updatedEntry: DailyJournalEntry) => {
    const updatedWithTimestamp = {
      ...updatedEntry,
      updatedAt: new Date().toISOString(),
    };

    if (user) {
      setIsDbSyncing(true);
      const path = `users/${user.uid}/entries/${updatedEntry.date}`;
      try {
        await setDoc(doc(db, "users", user.uid, "entries", updatedEntry.date), updatedWithTimestamp);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, path);
      } finally {
        setIsDbSyncing(false);
      }
    } else {
      const filtered = entries.filter((e) => e.date !== updatedEntry.date);
      const updated = [...filtered, updatedWithTimestamp];
      saveEntries(updated);
    }
  };

  // Data exporter (Backup utility)
  const handleExportData = () => {
    const backupObj = {
      scribe_app_signature: "trading_trade_notebook_system",
      exportTime: new Date().toISOString(),
      tradingPlan,
      entries,
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trading_trade_journal_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Data importer (Backup utility)
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJsonStr = event.target?.result as string;
        const parsed = JSON.parse(rawJsonStr);

        if (parsed.scribe_app_signature !== "trading_trade_notebook_system" && parsed.scribe_app_signature !== "scribe_trade_notebook_system") {
          alert("Selected file does not match a valid Trading Journal backup schema.");
          return;
        }

        if (parsed.tradingPlan) {
          await savePlan(parsed.tradingPlan);
        }
        if (parsed.entries) {
          if (user) {
            setIsDbSyncing(true);
            for (const item of parsed.entries) {
              await setDoc(doc(db, "users", user.uid, "entries", item.date), item);
            }
          } else {
            saveEntries(parsed.entries);
            if (parsed.entries.length > 0) {
              setSelectedDate(parsed.entries[0].date);
            }
          }
        }
        alert("Trade Journal database imported successfully!");
      } catch (err: any) {
        alert("Failed to parse the backup file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeEntry = entries.find((e) => e.date === selectedDate);

  return (
    <div className="flex h-screen bg-stone-950 font-sans text-stone-300 overflow-hidden relative">
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2.5 bg-stone-900 border border-stone-850 rounded-md text-stone-200 cursor-pointer shadow-md focus:outline-none"
          id="toggle-sidebar-mobile-btn"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Main Binder Container */}
      <div className="flex w-full h-full relative">
        {/* Sidebar Left Page list Selector */}
        <div className={`fixed inset-y-0 left-0 md:relative z-40 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 shrink-0`}>
          <Sidebar
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onAddDate={handleAddDatePage}
            activeTab={activeTab}
            onChangeActiveTab={(tab) => {
              setActiveTab(tab);
              // Close side panels on mobile triggers
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            onExportData={handleExportData}
            onImportData={handleImportData}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isDbSyncing={isDbSyncing}
          />
        </div>

        {/* Gray ring binder divider mimicking physical ledger rings */}
        <div className="hidden md:flex flex-col justify-around absolute left-[315px] top-0 bottom-0 w-2.5 bg-gradient-to-r from-stone-850 to-stone-900 z-30 shadow-inner rounded-r">
          <div className="w-4 h-2.5 bg-stone-600 border border-stone-700 rounded-sm -ml-0.5 shadow-md" />
          <div className="w-4 h-2.5 bg-stone-600 border border-stone-700 rounded-sm -ml-0.5 shadow-md" />
          <div className="w-4 h-2.5 bg-stone-600 border border-stone-700 rounded-sm -ml-0.5 shadow-md" />
          <div className="w-4 h-2.5 bg-stone-600 border border-stone-700 rounded-sm -ml-0.5 shadow-md" />
          <div className="w-4 h-2.5 bg-stone-600 border border-stone-700 rounded-sm -ml-0.5 shadow-md" />
        </div>

        {/* Right Page View Area */}
        <main className="flex-1 h-full bg-stone-950 p-3 md:p-6 pl-3 md:pl-8 overflow-hidden relative">
          <div className="w-full h-full max-w-7xl mx-auto rounded-xl bg-stone-900 p-1 md:p-2 border border-stone-850/60 shadow-2xl relative">
            {/* The Book Border styling */}
            <div className="w-full h-full rounded-lg bg-[#FCFBF8] border border-stone-200/50 overflow-hidden relative">
              {activeTab === "journal" && (
                activeEntry ? (
                  <DailyPage
                    entry={activeEntry}
                    plan={tradingPlan}
                    onUpdateEntry={handleUpdateEntry}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-stone-500 font-serif text-center p-12">
                    <Book className="w-16 h-16 text-stone-300 stroke-1 mb-4" />
                    <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-2">Notebook Page Missing</h2>
                    <p className="text-sm max-w-md font-sans text-stone-400">
                      Kindly select an active page date in the left index column or create a new journal log ledger using the date picker to start mapping executions.
                    </p>
                  </div>
                )
              )}

              {activeTab === "plan" && (
                <TradingPlanComponent
                  plan={tradingPlan}
                  onSavePlan={savePlan}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsView entries={entries} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
