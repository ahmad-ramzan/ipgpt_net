import React from "react";
import { ShieldAlert, CheckCircle2, XCircle, Radio } from "lucide-react";
import { IpIntelligenceResult } from "../../types";

interface SecurityAnonymityCardProps {
  intel: IpIntelligenceResult;
}

export const SecurityAnonymityCard: React.FC<SecurityAnonymityCardProps> = ({ intel }) => {
  const { detection, detectionSignals } = intel;

  const browserTimezone =
    typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "";
  const ipTimezone = intel.timezone || "";
  const isTimezoneMismatch = Boolean(
    browserTimezone &&
      ipTimezone &&
      browserTimezone.trim().toLowerCase() !== ipTimezone.trim().toLowerCase()
  );

  const activeSignals = [
    ...detectionSignals,
    ...(isTimezoneMismatch ? ["Timezone Mismatch Detected (-30%)"] : []),
  ];

  const renderBadge = (label: string, isPositive: boolean, customActiveLabel?: string, customCleanLabel?: string) => {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-xl border text-sm shadow-sm transition-all ${
          isPositive
            ? "bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-amber-950/20"
            : "bg-slate-950/80 border-slate-800 text-slate-200"
        }`}
      >
        <span className="font-bold text-sm sm:text-base">{label}</span>
        {isPositive ? (
          <span className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-amber-400">
            <CheckCircle2 className="w-4 h-4" /> {customActiveLabel || "ACTIVE"}
          </span>
        ) : (
          <span className="flex items-center gap-1 font-mono font-bold text-xs sm:text-sm text-slate-400">
            <XCircle className="w-4 h-4 text-slate-500" /> {customCleanLabel || "CLEAN"}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl shadow-black/50 backdrop-blur-xl relative flex flex-col justify-between group hover:border-purple-500/40 hover:-translate-y-1 hover:shadow-purple-500/10 transition-all duration-300">
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-inner">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-extrabold text-white tracking-widest uppercase">
              Threat & Anonymity Signals
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 shadow-sm">
            Signals
          </span>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {renderBadge("Residential", detection.isResidential)}
          {renderBadge("VPN Service", detection.isVpn)}
          {renderBadge("Proxy Server", detection.isProxy)}
          {renderBadge("Tor Exit Node", detection.isTor)}
          {renderBadge("Datacenter", detection.isDatacenter)}
          {renderBadge("Mobile Network", detection.isMobile)}
          {renderBadge("WebRTC Leak", detection.isWebRtcLeak || false)}
          {renderBadge("Timezone", isTimezoneMismatch, "MISMATCH", "CLEAN")}
        </div>

        {/* Active Signals List */}
        <div className="space-y-2 pt-3 border-t border-slate-800/80">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-300 block">
            Active Security Signals ({activeSignals.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {activeSignals.map((signal, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 text-xs sm:text-sm font-mono font-bold rounded-xl bg-slate-950/90 border border-slate-800 text-cyan-300 flex items-center gap-2 shadow-inner"
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>{signal}</span>
              </span>
            ))}
          </div>
        </div>

        {/* WebRTC Candidate Test Details */}
        {intel.webrtcDetails && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
            <span className="uppercase font-extrabold tracking-widest text-slate-400 block mb-1">
              Browser WebRTC Candidate Scan
            </span>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Leak Status:</span>
                <span className={`font-bold ${intel.webrtcDetails.hasLeak ? "text-rose-400" : "text-emerald-400"}`}>
                  {intel.webrtcDetails.hasLeak ? "EXPOSED (Leak Detected)" : "SECURE (No Leak)"}
                </span>
              </div>
              {intel.webrtcDetails.leakedIps.length > 0 && (
                <div className="flex flex-col gap-0.5 pt-1 border-t border-slate-900">
                  <span className="text-slate-500 text-[10px]">Exposed STUN / ICE IPs:</span>
                  <span className="text-amber-300 font-bold break-all">
                    {intel.webrtcDetails.leakedIps.join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

