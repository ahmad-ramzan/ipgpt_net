import React from "react";
import { Server, Network, Shield, Mail, Terminal, Layers, ShoppingCart, ExternalLink } from "lucide-react";
import { IpIntelligenceResult } from "../../types";

interface NetworkCardProps {
  intel: IpIntelligenceResult;
}

export const NetworkCard: React.FC<NetworkCardProps> = ({ intel }) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl shadow-black/50 backdrop-blur-xl relative flex flex-col justify-between group hover:border-indigo-500/40 hover:-translate-y-1 hover:shadow-indigo-500/10 transition-all duration-300">
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Server className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-extrabold text-white tracking-widest uppercase">
              Network & ISP Infrastructure
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-sm">
            ASN Details
          </span>
        </div>

        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Network className="w-4 h-4 text-indigo-400" /> ISP
            </span>
            <span className="font-extrabold text-white text-sm sm:text-base truncate max-w-[200px]" title={intel.isp}>
              {intel.isp}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 font-medium text-sm">Organization</span>
            <span className="font-bold text-slate-100 text-sm sm:text-base truncate max-w-[200px]" title={intel.organization}>
              {intel.organization}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Shield className="w-4 h-4 text-purple-400" /> Autonomous System
            </span>
            <span className="font-mono text-cyan-300 font-bold text-sm sm:text-base truncate max-w-[180px]" title={intel.asn}>
              {intel.asn}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Terminal className="w-4 h-4 text-emerald-400" /> Hostname (rDNS)
            </span>
            <span className="font-mono text-slate-200 font-bold text-sm sm:text-base truncate max-w-[180px]" title={intel.hostname}>
              {intel.hostname}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Layers className="w-4 h-4 text-amber-400" /> BGP Prefix
            </span>
            <span className="font-mono font-bold text-indigo-300 text-sm sm:text-base">{intel.bgpPrefix}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Mail className="w-4 h-4 text-slate-400" /> Abuse Contact
            </span>
            <span className="font-mono text-slate-200 font-bold text-sm sm:text-base truncate max-w-[180px]" title={intel.abuseContact}>
              {intel.abuseContact}
            </span>
          </div>
        </div>

        {/* Network Infrastructure Summary Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Route Type:</span>
            <span className="text-indigo-300 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
              {intel.detection.isDatacenter ? "COMMERCIAL DC" : "CONSUMER ISP"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Network Class:</span>
            <span className="text-emerald-300 font-extrabold">
              {intel.networkType}
            </span>
          </div>
        </div>

        {/* Buy Premium Proxy Banner */}
        <div className="mt-4 sm:mt-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-950 to-indigo-950/90 border border-cyan-500/50 shadow-xl shadow-cyan-950/60 flex flex-col gap-3 relative overflow-hidden group/proxybuy">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none group-hover/proxybuy:bg-cyan-500/25 transition-all" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-inner">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-sm font-mono font-black text-white uppercase tracking-wider">
                BUY PREMIUM PROXY
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse shadow-sm">
              100% Clean IPs
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
            To buy premium high-disguise survey proxies, visit our official store:
          </p>

          <a
            href="https://proxygpt.online"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-mono font-black flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer tracking-wide"
          >
            <span>GO TO PROXYGPT.ONLINE</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

