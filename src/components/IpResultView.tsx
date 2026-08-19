import React from "react";
import { CombinedLookupResult } from "../types";
import { LocationCard } from "./Cards/LocationCard";
import { NetworkCard } from "./Cards/NetworkCard";
import { SecurityAnonymityCard } from "./Cards/SecurityAnonymityCard";
import { AiThreatAnalysisCard } from "./Cards/AiThreatAnalysisCard";
import { JsonInspectorCard } from "./Cards/JsonInspectorCard";
import { ScriptAdBanner } from "./ScriptAdBanner";
import { CONFIG } from "../config";

interface IpResultViewProps {
  result: CombinedLookupResult;
  onCopyText: (text: string, label: string) => void;
}

export const IpResultView: React.FC<IpResultViewProps> = ({ result, onCopyText }) => {
  return (
    <div className="w-full max-w-[1240px] mx-auto my-6 space-y-6 animate-fade-in">
      {/* Grid of 3 Core Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LocationCard intel={result.ipIntelligence} />
        <NetworkCard intel={result.ipIntelligence} />
        <SecurityAnonymityCard intel={result.ipIntelligence} />
      </div>

      {/* Middle Advertisement Area - direct link, so it renders as a clickable
          banner rather than a script-injected unit. */}
      <a
        id="ad-inline-banner"
        href="https://askewevaluationsuicidal.com/x7kvkmjkk?key=c326b037454f074b50200c9a05790572"
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block w-full text-center px-6 py-4 rounded-2xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors"
      >
        Sponsored Offer
      </a>

      {/* AI Threat Security Assessment & JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiThreatAnalysisCard analysis={result.aiAnalysis} />
        <JsonInspectorCard result={result} onCopyText={onCopyText} />
      </div>
    </div>
  );
};
