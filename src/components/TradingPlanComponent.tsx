import React, { useState } from "react";
import { TradingPlan } from "../types";
import { Plus, Trash, Check, ShieldAlert, Award } from "lucide-react";

interface TradingPlanProps {
  plan: TradingPlan;
  onSavePlan: (updatedPlan: TradingPlan) => void;
}

export default function TradingPlanComponent({ plan, onSavePlan }: TradingPlanProps) {
  const [maxDailyLoss, setMaxDailyLoss] = useState(plan.maxDailyLoss);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(plan.maxTradesPerDay);
  const [riskPerTradePercent, setRiskPerTradePercent] = useState(plan.riskPerTradePercent);
  const [rules, setRules] = useState<string[]>(plan.rules);
  const [newRule, setNewRule] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSavePlan({
      maxDailyLoss: Number(maxDailyLoss),
      maxTradesPerDay: Number(maxTradesPerDay),
      riskPerTradePercent: Number(riskPerTradePercent),
      rules,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#FCFBF8] text-stone-800 p-8 rounded-lg shadow-sm font-serif border border-stone-200">
      {/* Notebook Header */}
      <div className="border-b-2 border-stone-300 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-900 text-[#FCFBF8] rounded">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-stone-900">Trading Constitution</h1>
            <p className="text-xs text-stone-500 font-mono uppercase tracking-widest mt-1">Boundaries, Rules & Mandates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 font-sans">
        <div className="bg-stone-50 border border-stone-200 p-4 rounded-md">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">
            Max Daily Loss Limit
          </label>
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400 font-bold">$</span>
            <input
              type="number"
              className="w-full bg-white border border-stone-300 rounded px-3 py-2 pl-7 font-mono text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-600 focus:border-stone-600"
              value={maxDailyLoss}
              onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
            />
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Shutdown benchmark once crossed</p>
        </div>

        <div className="bg-stone-50 border border-stone-200 p-4 rounded-md">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">
            Max Trades Per Day
          </label>
          <input
            type="number"
            className="w-full bg-white border border-stone-300 rounded mt-1 px-3 py-2 font-mono text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-600"
            value={maxTradesPerDay}
            onChange={(e) => setMaxTradesPerDay(Number(e.target.value))}
          />
          <p className="text-[10px] text-stone-400 mt-1">Protects against rapid overtrading</p>
        </div>

        <div className="bg-stone-50 border border-stone-200 p-4 rounded-md">
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">
            Risk Per Position (%)
          </label>
          <div className="relative mt-1">
            <input
              type="number"
              step="0.1"
              className="w-full bg-white border border-stone-300 rounded px-3 py-2 pr-7 font-mono text-stone-850 focus:outline-none focus:ring-1 focus:ring-stone-600"
              value={riskPerTradePercent}
              onChange={(e) => setRiskPerTradePercent(Number(e.target.value))}
            />
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 font-bold">%</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Maximum account risk per entry</p>
        </div>
      </div>

      {/* Rules Section: Notebook Paper Look */}
      <div className="flex-1 bg-white border border-stone-200 rounded-md p-6 shadow-xs flex flex-col relative overflow-hidden">
        {/* Red side ledger line to look like notebook paper */}
        <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-red-200" />
        
        <div className="pl-6">
          <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            Active Tactical Rules
          </h2>

          <div className="space-y-3 mb-6 flex-1 max-h-[300px] overflow-y-auto pr-2">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-start justify-between border-b border-dashed border-stone-200 pb-2 group">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs text-stone-400 mt-1">Rule {idx + 1}.</span>
                  <span className="text-stone-700 italic text-sm font-medium">{rule}</span>
                </div>
                <button
                  onClick={() => handleRemoveRule(idx)}
                  className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  id={`remove-rule-btn-${idx}`}
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="text-sm italic text-stone-400 pl-4 py-3">No custom rules currently added. Add your trading anchors below.</p>
            )}
          </div>

          <div className="mt-auto flex gap-2 font-sans pt-4 border-t border-stone-100">
            <input
              type="text"
              placeholder="e.g. Always wait for 5m candle close to trigger entries..."
              className="flex-1 border border-stone-300 rounded px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-600"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddRule();
              }}
              id="new-rule-input"
            />
            <button
              onClick={handleAddRule}
              className="px-4 py-2 bg-stone-800 text-stone-50 rounded hover:bg-stone-900 text-sm font-medium flex items-center gap-1.5 transition-colors"
              id="add-rule-btn"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end font-sans">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-md font-semibold text-sm flex items-center gap-2 shadow-sm transition-all duration-300 ${
            isSaved 
              ? "bg-emerald-600 text-white" 
              : "bg-stone-900 text-stone-100 hover:bg-stone-800"
          }`}
          id="save-trading-plan-btn"
        >
          {isSaved ? (
            <>
              <Check className="w-4 h-4" /> Saved Successfully
            </>
          ) : (
            "Save Constitution & Rules"
          )}
        </button>
      </div>
    </div>
  );
}
