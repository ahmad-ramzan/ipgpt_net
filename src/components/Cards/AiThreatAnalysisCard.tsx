import React from "react";
import { Sparkles, Bot, ShieldCheck } from "lucide-react";

interface AiThreatAnalysisCardProps {
  analysis: string | null;
}

export const AiThreatAnalysisCard: React.FC<AiThreatAnalysisCardProps> = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-indigo-950/40 border border-indigo-500/30 shadow-xl shadow-black/50 backdrop-blur-md relative overflow-hidden group hover:border-indigo-500/50 transition-all">
      {/* Decorative background flare */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Premium IP Checker AI Security Assessment</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <p className="text-[11px] text-indigo-300">
              Powered by Gemini 3.6 Intelligence Engine
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          AI Risk Analysis
        </span>
      </div>

      <div className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
        <p className="whitespace-pre-line">{analysis}</p>
      </div>
    </div>
  );
};
