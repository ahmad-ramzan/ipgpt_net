import React from "react";
import { ShieldCheck, Terminal, Globe, Lock, Cpu, Heart } from "lucide-react";
import { ScriptAdBanner } from "./ScriptAdBanner";
import { CONFIG } from "../config";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 pt-8 pb-12 mt-16 text-slate-400 text-xs">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Bottom Advertisement Banner (Requirement: One advertisement area near the bottom) */}
        <ScriptAdBanner
          id={CONFIG.ads.bottomBanner.id}
          src="https://pl30737467.effectivecpmnetwork.com/10/2c/ee/102cee23aed7fef6eeadfe94669e5623.js"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
          {/* Col 1: Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Premium IP<span className="text-cyan-400"> Checker</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Next-generation IP Intelligence, IP Verification, and AI Threat Risk Analysis platform.
            </p>
          </div>

          {/* Col 2: Capabilities */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Features</span>
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Proxy Ping & Protocol Test</li>
              <li>IP Intelligence & Geolocation</li>
              <li>Threat Score Meter (0-100)</li>
              <li>VPN, Tor & Datacenter Flags</li>
            </ul>
          </div>

          {/* Col 3: Export & Integrations */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Data Formats</span>
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>Raw JSON Payload Export</li>
              <li>CSV Data Table Export</li>
              <li>Reverse DNS (rDNS) Lookup</li>
              <li>BGP CIDR Subnet Details</li>
            </ul>
          </div>

          {/* Col 4: System Status */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Status</span>
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200">API Engines Operational</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Designed for cybersecurity analysts, network engineers, and proxy administrators.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-[11px] text-slate-400">
            © {new Date().getFullYear()} Premium IP Checker. All rights reserved. Inspired by modern IP intelligence layouts.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" /> Secure SSL
            </span>
            <a href="/privacy-policy" className="transition-colors hover:text-cyan-300">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="transition-colors hover:text-cyan-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
