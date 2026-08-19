import React from "react";
import {
  Copy,
  Activity,
  Wifi,
  Sparkles,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  MapPin,
  Server,
  Building,
  Terminal,
  Layers,
  Clock,
} from "lucide-react";
import { CombinedLookupResult } from "../../types";

interface IpOverviewCardProps {
  result: CombinedLookupResult;
  onCopyText: (text: string, label: string) => void;
}

export const IpOverviewCard: React.FC<IpOverviewCardProps> = ({ result, onCopyText }) => {
  const { outputIp, ipIntelligence, proxyDetails, latencyMs, isProxyInput } = result;
  const { isVpn, isProxy, isTor, isDatacenter, isResidential, isMobile, isWebRtcLeak } = ipIntelligence.detection;

  let calcScore = 100;
  if (isVpn) calcScore -= 30;
  if (isProxy || isProxyInput) calcScore -= 30;
  if (isTor) calcScore -= 30;
  if (isDatacenter) calcScore -= 30;
  if (isWebRtcLeak) calcScore -= 30;

  if (isResidential) calcScore += 15;
  if (isMobile) calcScore += 15;

  const passingScore = Math.max(0, Math.min(100, calcScore));

  // Determine dynamic risk tier & colors
  const isGreen = passingScore >= 80;
  const isYellow = passingScore >= 45 && passingScore < 80;

  const gaugeColorClass = isGreen
    ? "text-emerald-400"
    : isYellow
    ? "text-amber-400"
    : "text-rose-500";

  const statusLabel = isGreen ? "Low Risk" : isYellow ? "Medium Risk" : "High Risk";

  // SVG Gauge calculations
  const radius = 52;
  const circum = 2 * Math.PI * radius; // ~326.72
  const strokeDashoffset = circum - (circum * passingScore) / 100;

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-black/70 backdrop-blur-xl relative overflow-hidden group hover:border-slate-600 transition-all duration-300">
      {/* Ambient background glow */}
      <div
        className={`absolute -top-16 -right-16 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30 transition-all ${
          isGreen ? "bg-emerald-500/20" : isYellow ? "bg-amber-500/20" : "bg-rose-500/20"
        }`}
      />

      <div className="relative z-10 space-y-4">
        {/* Top Row: IP Header Info (Left) + Prominent Passing Score Gauge (Right) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1 border-b border-slate-800/80">
          {/* Left: Tag, Flag & Large Output IP */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Resolved Output IP</span>
              </span>
              {isProxyInput && (
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-md">
                  Checked via Proxy ({proxyDetails?.protocol || "HTTP"})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className="text-4xl sm:text-5xl leading-none shrink-0 select-none drop-shadow-md"
                title={`Country: ${ipIntelligence.country}`}
              >
                {ipIntelligence.flagEmoji || "🌐"}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tight break-all drop-shadow-sm">
                {outputIp}
              </h2>
              <button
                onClick={() => onCopyText(outputIp, "Output IP Address")}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/80 shadow-md active:scale-95 shrink-0"
                title="Copy Output IP Address"
              >
                <Copy className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Top-Right: Circular Gauge (Prominent Passing Score) */}
          <div className="shrink-0 flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 shadow-inner self-start md:self-center">
            <div className="relative flex items-center justify-center w-32 h-32 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-800/80"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={circum}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${gaugeColorClass}`}
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-3xl sm:text-3xl font-black text-white font-mono tracking-tight leading-none drop-shadow-sm">
                  {passingScore}%
                </span>
                <span className="text-[11px] text-slate-100 font-black uppercase tracking-wider leading-none mt-1.5 whitespace-nowrap drop-shadow-sm">
                  Passing Score
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges Section (Horizontal Row as requested) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Clean Result */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-sm transition-all ${
              isGreen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            {isGreen ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{isGreen ? "✓ Clean Result" : "⚠ Risk Detected"}</span>
          </div>

          {/* 2. No VPN Detected */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-sm transition-all ${
              !isVpn
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/40 text-amber-300"
            }`}
          >
            {!isVpn ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{!isVpn ? "✓ No VPN Detected" : "⚠ VPN Active"}</span>
          </div>

          {/* 3. No Proxy Detected */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-sm transition-all ${
              !isProxy
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            {!isProxy ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{!isProxy ? "✓ No Proxy Detected" : "⚠ Proxy Identified"}</span>
          </div>

          {/* 4. Risk Level */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-bold text-xs shadow-sm transition-all ${
              isGreen
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : isYellow
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            {isGreen ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : isYellow ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>✓ {statusLabel}</span>
          </div>
        </div>

        {/* Responsive Grid of Information Badges (3-4 items per row) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 text-xs">
          {/* Country */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> Country
            </span>
            <span className="font-bold text-white flex items-center gap-1.5 truncate">
              <span>{ipIntelligence.flagEmoji}</span>
              <span className="truncate">{ipIntelligence.country} ({ipIntelligence.countryCode})</span>
            </span>
          </div>

          {/* Latency */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Latency
            </span>
            <span className="font-mono font-bold text-emerald-300">{latencyMs} ms</span>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Network
            </span>
            <span className="font-bold text-indigo-300">{ipIntelligence.networkType}</span>
          </div>

          {/* ISP */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-purple-400 shrink-0" /> ISP
            </span>
            <span className="font-bold text-slate-100 truncate max-w-[140px]" title={ipIntelligence.isp}>
              {ipIntelligence.isp}
            </span>
          </div>

          {/* ASN */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" /> ASN
            </span>
            <span className="font-mono font-bold text-cyan-300 truncate max-w-[140px]" title={ipIntelligence.asn}>
              {ipIntelligence.asn}
            </span>
          </div>

          {/* Organization */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Organization
            </span>
            <span className="font-bold text-slate-200 truncate max-w-[140px]" title={ipIntelligence.organization}>
              {ipIntelligence.organization}
            </span>
          </div>

          {/* City */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" /> City
            </span>
            <span className="font-bold text-slate-100 truncate max-w-[140px]" title={ipIntelligence.city}>
              {ipIntelligence.city}
            </span>
          </div>

          {/* Region */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-teal-400 shrink-0" /> Region
            </span>
            <span className="font-bold text-slate-100 truncate max-w-[140px]" title={ipIntelligence.region}>
              {ipIntelligence.region}
            </span>
          </div>

          {/* Hostname */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Hostname
            </span>
            <span className="font-mono font-bold text-slate-300 truncate max-w-[140px]" title={ipIntelligence.hostname}>
              {ipIntelligence.hostname}
            </span>
          </div>

          {/* BGP Prefix */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> BGP Prefix
            </span>
            <span className="font-mono font-bold text-indigo-300">{ipIntelligence.bgpPrefix}</span>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" /> Timezone
            </span>
            <span className="font-mono font-bold text-purple-300">{ipIntelligence.timezone}</span>
          </div>

          {/* Proxy Status */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 shadow-inner">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Proxy Status
            </span>
            <span className={`font-bold ${isProxy ? "text-rose-400" : "text-emerald-400"}`}>
              {isProxy ? "Detected" : "Not Detected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};



