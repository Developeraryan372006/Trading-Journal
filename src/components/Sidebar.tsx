import React, { useState, useEffect } from "react";
import { DailyJournalEntry } from "../types";
import { 
  Plus, Calendar, Award, BarChart2, Book, 
  Download, Upload, CheckCircle, HelpCircle, AlertCircle,
  LogIn, LogOut, Cloud, CloudOff, RefreshCw
} from "lucide-react";

interface SidebarProps {
  entries: DailyJournalEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onAddDate: (date: string) => void;
  activeTab: "journal" | "plan" | "analytics";
  onChangeActiveTab: (tab: "journal" | "plan" | "analytics") => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  user: any; // Firebase User | null
  onLogin: () => void;
  onLogout: () => void;
  isDbSyncing: boolean;
}

export default function Sidebar({
  entries,
  selectedDate,
  onSelectDate,
  onAddDate,
  activeTab,
  onChangeActiveTab,
  onExportData,
  onImportData,
  user,
  onLogin,
  onLogout,
  isDbSyncing,
}: SidebarProps) {
  const [newDateValue, setNewDateValue] = useState("");
  const [serverState, setServerState] = useState<"connecting" | "healthy" | "error">("connecting");

  // Check the backend server connection
  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (res.ok) setServerState("healthy");
        else setServerState("error");
      })
      .catch(() => {
        setServerState("error");
      });
  }, []);

  const handleAddNewDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateValue) return;

    // Trigger onAddDate
    onAddDate(newDateValue);
    setNewDateValue("");
  };

  // Sort daily page tab listing chronologically (newest first)
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="w-full md:w-80 bg-stone-900 text-stone-300 flex flex-col h-full border-r border-stone-800 font-sans">
      {/* Brand logo header with User profile hook */}
      <div className="p-5 border-b border-stone-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-white text-stone-900 flex items-center justify-center font-serif font-black text-xl shadow-inner">
              T
            </div>
            <div>
              <h1 className="text-[#FCFBF8] font-serif text-lg font-bold tracking-tight">Trading Journal</h1>
              <p className="text-[10px] text-stone-500 font-mono tracking-wider uppercase">Trading Desk Companion</p>
            </div>
          </div>
        </div>

        {/* Security Login Card */}
        <div className="bg-stone-950/40 border border-stone-800/80 rounded-md p-3">
          {user ? (
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Trader"}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full ring-1 ring-stone-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center font-bold text-stone-400 text-xs">
                    {(user.displayName || "T")[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-[#FCFBF8] truncate">
                    {user.displayName || user.email}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-500">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Real-time Cloud Active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-stone-800 rounded text-stone-400 hover:text-rose-400 transition-colors"
                title="Disconnect Account"
                id="firebase-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] text-stone-500 leading-normal">
                Sign in to automatically back up your custom journal parameters and trades dually to Cloud Firestore.
              </div>
              <button
                onClick={onLogin}
                className="w-full py-1.5 px-3 bg-white hover:bg-stone-100 text-stone-900 rounded font-bold text-[11px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                id="firebase-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                Connect Cloud DB
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs Selection */}
      <div className="p-4 border-b border-stone-800 space-y-1">
        <button
          onClick={() => onChangeActiveTab("journal")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-all font-medium ${
            activeTab === "journal" 
              ? "bg-stone-800 text-white shadow-xs" 
              : "hover:bg-stone-800/40 text-stone-400 hover:text-stone-200"
          }`}
          id="btn-tab-journal"
        >
          <Book className="w-4 h-4 shrink-0" />
          <span>Daily Logs Logbook</span>
        </button>

        <button
          onClick={() => onChangeActiveTab("plan")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-all font-medium ${
            activeTab === "plan" 
              ? "bg-stone-800 text-white shadow-xs" 
              : "hover:bg-stone-800/40 text-stone-400 hover:text-stone-200"
          }`}
          id="btn-tab-plan"
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>Trading Constitution</span>
        </button>

        <button
          onClick={() => onChangeActiveTab("analytics")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded transition-all font-medium ${
            activeTab === "analytics" 
              ? "bg-stone-800 text-white shadow-xs" 
              : "hover:bg-stone-800/40 text-stone-400 hover:text-stone-200"
          }`}
          id="btn-tab-analytics"
        >
          <BarChart2 className="w-4 h-4 shrink-0" />
          <span>Analytics & Insights</span>
        </button>
      </div>

      {/* Spawning quick calendar days */}
      {activeTab === "journal" && (
        <div className="p-4 border-b border-stone-800 bg-stone-950/20">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 font-mono">Create Ledger Page</p>
          <form onSubmit={handleAddNewDate} className="flex gap-2">
            <input
              type="date"
              className="flex-1 bg-stone-850 hover:bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-500"
              value={newDateValue}
              onChange={(e) => setNewDateValue(e.target.value)}
              required
              id="new-date-picker"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-900 rounded font-bold text-xs flex items-center gap-1.5 transition-colors"
              id="sidebar-add-day-btn"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* List of custom page records */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {activeTab === "journal" ? (
          <>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest pl-2 mb-2 font-mono">Notebook Index Pages</p>
            {sortedEntries.map((item) => {
              const totalDailyPnL = (item.trades || []).reduce((sum, t) => sum + t.pnl, 0);
              const isSelected = item.date === selectedDate;
              // format date for sidebar
              const friendlySidebarDate = new Date(item.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const dayName = new Date(item.date).toLocaleDateString("en-US", { weekday: "short" });

              return (
                <button
                  key={item.date}
                  onClick={() => onSelectDate(item.date)}
                  className={`w-full text-left p-3 rounded transition-all border flex items-center justify-between ${
                    isSelected 
                      ? "bg-white text-stone-900 border-white shadow-md font-semibold" 
                      : "bg-transparent hover:bg-stone-800/40 border-transparent text-stone-400 hover:text-stone-200 text-xs"
                  }`}
                  id={`select-date-row-${item.date}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className={`w-4 h-4 shrink-0 ${isSelected ? "text-stone-800" : "text-stone-600"}`} />
                    <div>
                      <div className={`text-xs ${isSelected ? "text-stone-900" : "text-[#FCFBF8]"}`}>
                        {friendlySidebarDate}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono uppercase">{dayName}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[11px]">
                    <div className={totalDailyPnL >= 0 ? "text-emerald-500" : "text-rose-500"}>
                      {totalDailyPnL >= 0 ? "+" : ""}${totalDailyPnL.toFixed(0)}
                    </div>
                    <div className="text-[9px] text-stone-500">{item.trades?.length || 0} trades</div>
                  </div>
                </button>
              );
            })}
            {entries.length === 0 && (
              <p className="text-xs italic text-stone-500 pl-2">No pages written. Select a date above to spawn your first ledger sheet.</p>
            )}
          </>
        ) : (
          <div className="p-4 bg-stone-950/25 rounded border border-stone-850/50 text-xs text-stone-400 space-y-3 leading-relaxed">
            <h4 className="font-serif font-bold text-stone-200">The Trading Binder Codex</h4>
            <p>
              Professional traders separate rules (Trading Plan), active logging journals, and mathematical telemetry analytics. Expand each segment using the main side selectors.
            </p>
            <p className="text-[10px] text-stone-500">
              Your diary history auto-saves locally underneath your browser container database. Use the backups utility below to export complete histories.
            </p>
          </div>
        )}
      </div>

      {/* Backups / Utilities */}
      <div className="p-4 border-t border-stone-800 bg-[#0c0c0b]/40 space-y-2 text-xs">
        <div className="flex gap-2">
          {/* Export button */}
          <button
            onClick={onExportData}
            className="flex-1 py-1.5 px-2.5 border border-stone-750 rounded text-stone-400 hover:text-white hover:bg-stone-850/50 flex items-center justify-center gap-1.5 transition-colors font-medium text-[11px]"
            title="Download full JSON trade logs backup"
            id="export-backup-btn"
          >
            <Download className="w-3.5 h-3.5" />
            Export Journal
          </button>

          {/* Import button */}
          <label
            className="flex-1 py-1.5 px-2.5 border border-stone-750 rounded text-stone-400 hover:text-white hover:bg-stone-850/50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-medium text-[11px] text-center"
            title="Upload previously exported JSON ledger file"
            id="import-backup-label"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Journal
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={onImportData}
              id="import-backup-input"
            />
          </label>
        </div>

        {/* Server Status Pill */}
        <div className="flex items-center justify-between border-t border-stone-800 pt-2 text-[10px] text-stone-500 tracking-wide font-mono">
          <div className="flex items-center gap-1">
            <span>AI Scribe Server:</span>
            {isDbSyncing && <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-500" />}
          </div>
          <div className="flex items-center gap-1.5">
            {serverState === "connecting" && (
              <>
                <span className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
                <span>Syncing</span>
              </>
            )}
            {serverState === "healthy" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-stone-400">Online</span>
              </>
            )}
            {serverState === "error" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-stone-400">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
