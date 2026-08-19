import React, { useState } from "react";
import { Code, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { CombinedLookupResult } from "../../types";

interface JsonInspectorCardProps {
  result: CombinedLookupResult;
  onCopyText: (text: string, label: string) => void;
}

export const JsonInspectorCard: React.FC<JsonInspectorCardProps> = ({ result, onCopyText }) => {
  const [isOpen, setIsOpen] = useState(false);

  const jsonString = JSON.stringify(result, null, 2);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl shadow-black/40 backdrop-blur-md transition-all">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Raw JSON Response Payload
            </h3>
            <p className="text-[11px] text-slate-400">
              Inspect structured API payload & raw detection parameters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyText(jsonString, "Raw JSON Payload");
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
          <div className="p-1 rounded-lg text-slate-400 group-hover:text-white transition-colors">
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800 animate-fade-in">
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-96 leading-relaxed selection:bg-cyan-500 selection:text-black">
            {jsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
