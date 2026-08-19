import React, { useState } from "react";
import { Search, Sparkles, ClipboardPaste } from "lucide-react";
import { CONFIG } from "../config";

interface SearchBoxProps {
  onSearch: (input: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, isLoading, initialValue = "" }) => {
  const [inputVal, setInputVal] = useState(initialValue);
  const [pasteError, setPasteError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    onSearch(inputVal);
  };

  // Clipboard read needs a secure context (https) and user permission; if the
  // browser refuses we tell the user to paste manually rather than failing mute.
  const handlePaste = async () => {
    setPasteError(false);
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setInputVal(text.trim());
      }
    } catch {
      setPasteError(true);
      setTimeout(() => setPasteError(false), 4000);
    }
  };

  const handleSelectSample = (sample: string) => {
    setInputVal(sample);
    onSearch(sample);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-4">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow backdrop */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 opacity-25 group-hover:opacity-40 blur-lg transition duration-500" />

        <div className="relative flex flex-col sm:flex-row items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl shadow-black/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 w-full px-3 py-2">
            <Search className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter IP Address"
              className="w-full bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none font-mono py-1 font-medium"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end px-2 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              title="Paste from clipboard"
              className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ClipboardPaste className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Paste</span>
            </button>

            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Check</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {pasteError && (
        <p className="mt-2 text-center text-[11px] text-amber-400">
          Clipboard access was blocked by your browser — please paste manually with Ctrl+V.
        </p>
      )}

    </div>
  );
};
