import React from "react";
import { History, Trash2, ArrowRight, ShieldCheck, ShieldAlert, Clock, RefreshCcw } from "lucide-react";
import { SearchHistoryItem } from "../types";

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelectHistoryItem: (input: string) => void;
  onClearHistory: () => void;
  isLoading: boolean;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
  isLoading,
}) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="w-full max-w-[1240px] mx-auto my-8 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md shadow-2xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Recent Lookup History ({history.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Quick access to previous IP and Proxy checks
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {history.map((item) => {
          const isHighRisk = item.threatScore > 50;
          const threatBadgeClass = isHighRisk
            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";

          return (
            <div
              key={item.id}
              onClick={() => !isLoading && onSelectHistoryItem(item.input)}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between hover:bg-slate-900/80"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 truncate max-w-[150px]">
                    {item.input}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${threatBadgeClass}`}
                  >
                    Risk: {item.threatScore}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono font-bold text-white">
                  <span>Output IP:</span>
                  <span className="text-cyan-300">{item.outputIp}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(item.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <span className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-1 transition-transform">
                  <span>Re-check</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
