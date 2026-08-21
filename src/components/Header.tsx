import React, { useEffect, useState } from "react";
import { Cpu, Zap } from "lucide-react";
import { fetchMyIp } from "../services/api";

interface HeaderProps {
  onCheckMyIp: (ip: string) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onCheckMyIp, isLoading }) => {
  const [myIp, setMyIp] = useState<string>("Detecting...");

  useEffect(() => {
    fetchMyIp().then(setMyIp);
  }, []);

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Brand (Left) */}
        <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center overflow-hidden">
              <img
                src="/logo.jpeg"
                alt="Premium IP Checker"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-[11px]"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full blur-[2px] animate-ping opacity-75" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                Premium IP<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400"> Checker</span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                v2.4
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-400 hidden sm:block">
              IP Intelligence & IP Detection Engine
            </p>
          </div>
        </a>

        {/* Center: Larger Check My IP Button */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => myIp !== "Detecting..." && onCheckMyIp(myIp)}
            disabled={isLoading || myIp === "Detecting..."}
            className="flex items-center gap-2 text-sm sm:text-base font-black px-6 py-2.5 sm:px-7 sm:py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Cpu className="w-5 h-5 text-cyan-200" />
            <span>Check My IP</span>
          </button>
        </div>

        {/* Right side: Premium proxy call-to-action */}
        <div className="flex items-center gap-3">
          <a
            href="https://proxygpt.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm sm:text-base font-black px-6 py-2.5 sm:px-7 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/25 border border-amber-400/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Zap className="w-5 h-5 text-amber-100" />
            <span>BUY PREMIUM PROXY</span>
          </a>
        </div>
      </div>
    </header>
  );
};
