import React, { useEffect, useCallback, useState } from "react";
import { CheckCircle2, XCircle, Clock, Server, Network, Shield, Copy, AlertTriangle, Award, Radio, Volume2, VolumeX, Globe, Gauge, Zap, Loader2 } from "lucide-react";
import { CombinedLookupResult } from "../../types";

interface ProxyVerificationCardProps {
  result: CombinedLookupResult | null;
  isLoading?: boolean;
  onCopyText: (text: string, label: string) => void;
}

export const ProxyVerificationCard: React.FC<ProxyVerificationCardProps> = ({
  result,
  isLoading = false,
  onCopyText,
}) => {
  const [speedMbps, setSpeedMbps] = useState<string | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isTestingSpeed, setIsTestingSpeed] = useState<boolean>(false);

  const handleCheckSpeed = useCallback(async () => {
    setIsTestingSpeed(true);
    try {
      // 1. Measure Ping (3-5 rounds average RTT)
      const pingRounds = 4;
      let totalPingTime = 0;
      for (let i = 0; i < pingRounds; i++) {
        const pStart = performance.now();
        await fetch(`/api/ping?cache=${Date.now()}_${i}`, { cache: "no-store" });
        const pEnd = performance.now();
        totalPingTime += pEnd - pStart;
      }
      const avgPing = Math.round(totalPingTime / pingRounds);
      setPingMs(avgPing);

      // 2. Measure Download Speed (1MB test file)
      const startTime = performance.now();
      const response = await fetch(`/api/speedtest-file?cache=${Date.now()}`, { cache: "no-store" });
      await response.blob();
      const endTime = performance.now();

      const durationSec = (endTime - startTime) / 1000;
      const fileSizeMB = 1; // 1 MB test file
      const calculatedSpeed = ((fileSizeMB * 8) / (durationSec || 0.001)).toFixed(2);
      setSpeedMbps(calculatedSpeed);
    } catch (err) {
      console.error("Speed check error:", err);
    } finally {
      setIsTestingSpeed(false);
    }
  }, []);

  // Helper to find female voice in voice array
  const findFemaleVoice = useCallback((voices: SpeechSynthesisVoice[]) => {
    if (!voices || voices.length === 0) return null;

    const femaleKeywords = [
      "female",
      "samantha",
      "zira",
      "victoria",
      "jenny",
      "aria",
      "ana",
      "michelle",
      "karen",
      "susan",
      "lisa",
      "catherine",
      "heather",
      "fiona",
      "allison",
      "ava",
      "emma",
      "olivia",
      "chloe",
      "joanna",
      "salli",
      "kendra",
      "ivy",
      "kimberly",
    ];

    const maleKeywords = [
      "david",
      "mark",
      "george",
      "guy",
      "male",
      "christopher",
      "eric",
      "jacob",
      "liam",
      "steffan",
      "ryan",
      "james",
      "john",
      "michael",
      "paul",
      "richard",
      "joseph",
      "charles",
      "thomas",
      "daniel",
      "matthew",
      "anthony",
      "donald",
      "steven",
      "andrew",
      "google us english", // Default "Google US English" is male in Chrome
      "google uk english male",
    ];

    const isMale = (name: string) =>
      maleKeywords.some((m) => name.includes(m)) && !name.includes("female");

    const isFemale = (name: string) =>
      femaleKeywords.some((f) => name.includes(f));

    const enUsVoices = voices.filter((v) => {
      const lang = v.lang.replace("_", "-").toLowerCase();
      return lang.startsWith("en-us") || lang === "en";
    });

    // 1. Priority: American en-US female voice
    let best = enUsVoices.find(
      (v) => isFemale(v.name.toLowerCase()) && !isMale(v.name.toLowerCase())
    );

    // 2. Priority: Any English female voice
    if (!best) {
      best = voices.find(
        (v) => isFemale(v.name.toLowerCase()) && !isMale(v.name.toLowerCase())
      );
    }

    // 3. Priority: Any en-US non-male voice
    if (!best) {
      best = enUsVoices.find((v) => !isMale(v.name.toLowerCase()));
    }

    return best || null;
  }, []);

  // Text-to-Speech Voice Alert Function with Asynchronous Voice Guarantee
  const playVoiceAlert = useCallback((textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      const executeSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.volume = 1;
        utterance.rate = 0.92;
        utterance.pitch = 1.35; // Higher pitch ensures clear female tone
        utterance.lang = "en-US";

        const femaleVoice = findFemaleVoice(voices);
        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        window.speechSynthesis.speak(utterance);
      };

      const existingVoices = window.speechSynthesis.getVoices();
      if (existingVoices && existingVoices.length > 0) {
        executeSpeak();
      } else {
        // Wait for voices to load before calling speak to prevent male voice fallback on first visit
        window.speechSynthesis.onvoiceschanged = () => {
          executeSpeak();
        };
      }
    } catch (e) {
      console.warn("TTS playback error:", e);
    }
  }, [findFemaleVoice]);

  // Pre-load voices on component mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }, []);

  // Calculations for scores & statuses if result exists
  const isWorking = result?.isValidProxy !== false;
  const protocol = result?.proxyDetails?.protocol || (result?.isProxyInput ? "HTTP" : "HTTP");
  const typeLabel = result?.proxyDetails?.type
    ? result.proxyDetails.type.includes("Private")
      ? "HTTP"
      : "HTTP"
    : result?.isProxyInput
    ? "HTTP"
    : "HTTP";

  const latencyMs = result?.latencyMs || result?.proxyDetails?.pingMs || 30;

  // Derive IP display string (only IP address, no port)
  const ipAddress = result ? result.outputIp : "";

  const countryCode = result?.ipIntelligence?.countryCode || "GLOBAL";
  const flagEmoji = result?.ipIntelligence?.flagEmoji || "🌐";
  const locationStr = result
    ? `${result.ipIntelligence?.city || "Unknown City"}, ${result.ipIntelligence?.country || "Unknown Country"}`
    : "";

  const asnAndIsp = result
    ? `${result.ipIntelligence?.asn ? result.ipIntelligence.asn.split(" ")[0] : "AS00000"} (${
        result.ipIntelligence?.organization || result.ipIntelligence?.isp || "N/A"
      })`
    : "";

  const isProxy = result ? (result.ipIntelligence?.detection?.isProxy || result.isProxyInput) : false;
  const isResidential = result?.ipIntelligence?.detection?.isResidential || false;
  const isMobile = result?.ipIntelligence?.detection?.isMobile || false;
  const isDatacenter = result?.ipIntelligence?.detection?.isDatacenter || false;
  const isVpn = result?.ipIntelligence?.detection?.isVpn || false;
  const isTor = result?.ipIntelligence?.detection?.isTor || false;
  const isWebRtcLeak = result?.ipIntelligence?.detection?.isWebRtcLeak || false;
  
  // Timezone check: Compare browser timezone with IP timezone
  const browserTimezone = typeof Intl !== "undefined" && Intl.DateTimeFormat
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "";
  const ipTimezone = result?.ipIntelligence?.timezone || "";
  const isTimezoneMatch = Boolean(
    browserTimezone &&
    ipTimezone &&
    browserTimezone.trim().toLowerCase() === ipTimezone.trim().toLowerCase()
  );

  let calcScore = 100;
  if (isVpn) calcScore -= 30;
  if (isProxy) calcScore -= 30;
  if (isTor) calcScore -= 30;
  if (isDatacenter) calcScore -= 30;
  if (isWebRtcLeak) calcScore -= 30;
  if (!isTimezoneMatch) calcScore -= 30;

  if (isResidential) calcScore += 15;
  if (isMobile) calcScore += 15;

  const passingScore = Math.max(0, Math.min(100, calcScore));

  const isPremiumIp = (isResidential || isMobile) && passingScore >= 90;
  const isLowRisk = passingScore >= 90;
  const canDoSurvey = passingScore >= 90;

  // Auto-play voice alert ONLY when score is strictly below 90% (<90%). No automatic audio when 90% or higher.
  useEffect(() => {
    if (!result || isLoading) return;

    if (!canDoSurvey) {
      playVoiceAlert("You cannot do survey now");
    } else {
      // Strictly stop and cancel any ongoing speech synthesis if score is 90%+
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [result?.outputIp, passingScore, canDoSurvey, isLoading, playVoiceAlert]);

  if (isLoading) {
    return (
      <div className="w-full max-w-[1240px] mx-auto my-4 space-y-2 animate-fade-in">
        {/* Header bar */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-mono font-extrabold tracking-widest uppercase text-slate-300">
            PROXY CONNECTION VERIFICATION
          </h3>
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 animate-pulse">
            STATUS: CHECKING...
          </span>
        </div>

        {/* Skeleton Card */}
        <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 animate-pulse" />
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="h-7 w-24 bg-slate-800/80 rounded-lg animate-pulse" />
              <div className="h-7 w-16 bg-slate-800/80 rounded-lg animate-pulse" />
              <div className="h-7 w-16 bg-slate-800/80 rounded-lg animate-pulse" />
              <div className="h-7 w-20 bg-slate-800/80 rounded-lg animate-pulse" />
            </div>
            <div className="h-8 w-48 bg-slate-800/80 rounded-xl animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            <div className="h-16 bg-slate-950/60 rounded-xl border border-slate-800/60 animate-pulse" />
            <div className="h-16 bg-slate-950/60 rounded-xl border border-slate-800/60 animate-pulse" />
            <div className="h-16 bg-slate-950/60 rounded-xl border border-slate-800/60 animate-pulse" />
            <div className="h-16 bg-slate-950/60 rounded-xl border border-slate-800/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="w-full max-w-[1240px] mx-auto my-4 space-y-2 animate-fade-in">
      {/* Top Header Label */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs sm:text-sm font-mono font-black tracking-widest uppercase text-slate-200 flex items-center gap-2">
          <span>IP CONNECTION VERIFICATION</span>
        </h3>
        <div className="flex items-center gap-3">
          {/* Dynamic Green/Red Light Indicator Header Widget */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 shadow-inner">
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                canDoSurvey
                  ? "bg-emerald-400 border border-emerald-200 animate-green-light"
                  : "bg-rose-500 border border-rose-200 animate-red-light"
              }`}
            />
            <span
              className={`text-[11px] font-mono font-black tracking-wider uppercase ${
                canDoSurvey ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {canDoSurvey ? "SAFE STATUS (90%+)" : "WARNING STATUS (<90%)"}
            </span>
          </div>

          <span
            className={`text-xs sm:text-sm font-mono font-black tracking-widest ${
              isWorking ? "text-cyan-400" : "text-rose-400"
            }`}
          >
            STATUS: {isWorking ? "WORKING" : "FAILED"}
          </span>
        </div>
      </div>

      {/* Main Verification Card */}
      <div className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl p-4 sm:p-5 overflow-hidden transition-all duration-300">
        {/* Top Gradient Line matching status */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
            isWorking
              ? "from-emerald-500 via-teal-400 to-cyan-500"
              : "from-rose-500 via-red-500 to-amber-500"
          }`}
        />

        {/* Top Status Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            {isWorking ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>WORKING</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono font-black text-xs shadow-sm">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>FAILED</span>
              </div>
            )}

            {/* Premium IP / Status Badge */}
            {isPremiumIp ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-black text-xs shadow-sm">
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>PREMIUM IP</span>
              </div>
            ) : isResidential || isMobile ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-black text-xs shadow-sm">
                <span>{isResidential ? "RESIDENTIAL" : "MOBILE"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono font-black text-xs shadow-sm">
                <span>NON-RESIDENTIAL ({passingScore}%)</span>
              </div>
            )}

            {/* Latency / Ping Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/90 border border-slate-800 text-cyan-300 font-mono font-bold text-xs shadow-sm">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{pingMs !== null ? `${pingMs} MS` : `${latencyMs} MS`}</span>
            </div>


            {/* Speed Checker Button */}
            <button
              type="button"
              onClick={handleCheckSpeed}
              disabled={isTestingSpeed}
              title="Click to measure proxy download speed & ping"
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 hover:text-white font-mono font-extrabold text-xs shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isTestingSpeed ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300 shrink-0" />
              ) : (
                <Gauge className="w-3.5 h-3.5 text-cyan-300 shrink-0 animate-pulse" />
              )}
              <span>{isTestingSpeed ? "Testing Speed..." : "⚡ Check Speed"}</span>
            </button>
          </div>

          {/* Right: TIMEZONE & WEBRTC Leak Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* TIMEZONE Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono font-bold shadow-inner">
              <Globe className={`w-4 h-4 shrink-0 ${!isTimezoneMatch ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
              <span className="text-slate-400 font-medium">TIMEZONE:</span>
              {isTimezoneMatch ? (
                <span className="font-black text-sm tracking-tight text-emerald-400">
                  MATCH ({ipTimezone || "SYNCED"})
                </span>
              ) : (
                <span className="font-black text-sm tracking-tight text-rose-400">
                  MISMATCH (-30%)
                </span>
              )}
            </div>

            {/* WEBRTC Leak Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono font-bold shadow-inner">
              <Radio className={`w-4 h-4 shrink-0 ${isWebRtcLeak ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
              <span className="text-slate-400 font-medium">WEBRTC LEAK:</span>
              {isWebRtcLeak ? (
                <span className="font-black text-sm tracking-tight text-rose-400">
                  YES (-30%)
                </span>
              ) : (
                <span className="font-black text-sm tracking-tight text-emerald-400">
                  NO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Proxy Score & Survey Qualification Progress Bar */}
        <div className="my-3 sm:my-4">
          <div
            className={`relative w-full h-16 sm:h-20 rounded-2xl bg-slate-950 border p-1.5 overflow-hidden transition-all duration-500 flex items-center shadow-2xl ${
              canDoSurvey
                ? "border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.4)]"
                : "border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.4)]"
            }`}
          >
            {/* Glowing Background Pulse */}
            <div
              className={`absolute inset-0 opacity-25 animate-pulse ${
                canDoSurvey ? "bg-emerald-500/20" : "bg-rose-500/20"
              }`}
            />

            {/* Animated Filled Progress Bar */}
            <div
              className={`h-full rounded-xl transition-all duration-700 flex items-center px-4 relative z-10 shadow-lg ${
                canDoSurvey
                  ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)] text-white"
                  : "bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] text-white"
              }`}
              style={{ width: `${Math.max(passingScore, 10)}%` }}
            />

            {/* Overlay Text, Light Bulb & Large Percentage Display */}
            <div className="absolute inset-0 flex items-center justify-between px-3 sm:px-5 gap-2 z-20">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                {/* Score Light Bulb Indicator */}
                <div
                  className={`relative p-2 rounded-xl backdrop-blur-md shrink-0 shadow-lg border flex items-center justify-center ${
                    canDoSurvey
                      ? "bg-emerald-950/90 border-emerald-400/60 text-emerald-300"
                      : "bg-rose-950/90 border-rose-400/60 text-rose-300"
                  }`}
                >
                  {/* Blinking Light Bulb LED */}
                  <span
                    className={`w-4 h-4 rounded-full inline-block ${
                      canDoSurvey
                        ? "bg-emerald-400 border border-emerald-100 animate-green-light"
                        : "bg-rose-500 border border-rose-100 animate-red-light"
                    }`}
                  />
                </div>

                {/* Score & Survey Text */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
                  {/* Large Proxy Score Display */}
                  <span className="text-sm sm:text-lg md:text-xl font-black font-mono tracking-tight text-white drop-shadow-md whitespace-nowrap bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm">
                    Your proxy score:{" "}
                    <span
                      className={`text-base sm:text-xl md:text-2xl font-black inline-block ${
                        canDoSurvey
                          ? "text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                          : "text-rose-300 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)]"
                      }`}
                    >
                      {passingScore}%
                    </span>
                  </span>

                  <span className="hidden sm:inline text-white/60 font-black">•</span>

                  {/* Survey Qualification Message */}
                  <span
                    className={`text-xs sm:text-base md:text-lg font-extrabold tracking-wide drop-shadow-md truncate ${
                      canDoSurvey
                        ? "text-emerald-200"
                        : "text-rose-200"
                    }`}
                  >
                    {canDoSurvey
                      ? "You can do survey now"
                      : "You cannot do survey now"}
                  </span>
                </div>
              </div>

              {/* Voice Alert Trigger Button */}
              <button
                onClick={() =>
                  playVoiceAlert(
                    canDoSurvey
                      ? "You can do survey now"
                      : "You cannot do survey now"
                  )
                }
                className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-white/20 text-white hover:text-cyan-300 transition-all shadow-xl flex items-center gap-2 shrink-0 cursor-pointer group"
                title="Replay Voice Alert"
              >
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold hidden sm:inline text-slate-200 group-hover:text-cyan-300">
                  VOICE ALERT
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Grid Row: 4 Compact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Card 1: YOUR IP ADDRESS */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center space-y-1 shadow-inner">
            <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>YOUR IP ADDRESS</span>
            </div>
            <div className="text-xs sm:text-sm font-mono font-black text-white truncate flex items-center justify-between gap-1" title={ipAddress}>
              <span className="truncate">{ipAddress}</span>
              <button
                onClick={() => onCopyText(result.outputIp, "IP Address")}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded transition-all active:scale-95 shrink-0"
                title="Copy IP Address"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card 2: LOCATION WITH REAL COUNTRY FLAG */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center space-y-1 shadow-inner">
            <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              {countryCode && countryCode !== "GLOBAL" ? (
                <img
                  src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
                  alt={countryCode}
                  className="w-4 h-3 object-cover rounded shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-xs">{flagEmoji}</span>
              )}
              <span>{countryCode} LOCATION</span>
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5" title={locationStr}>
              <span className="truncate">{locationStr}</span>
            </div>
          </div>

          {/* Card 3: ASN & ISP */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col justify-center space-y-1 shadow-inner">
            <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>ASN & ISP</span>
            </div>
            <div className="text-xs sm:text-sm font-mono font-bold text-slate-100 truncate" title={asnAndIsp}>
              {asnAndIsp}
            </div>
          </div>

          {/* Card 4: HIGHLIGHTED SECURITY FLAGS */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 shadow-inner flex flex-col justify-center">
            <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>SECURITY FLAGS</span>
              </div>
              <span className="text-[11px] font-black font-mono text-cyan-300">
                {passingScore}%
              </span>
            </div>

            {/* Highlighted Flags */}
            <div className="flex flex-wrap items-center gap-1">
              {isResidential && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm">
                  RESIDENTIAL
                </span>
              )}
              {isMobile && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm">
                  MOBILE
                </span>
              )}
              {isPremiumIp && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm">
                  PREMIUM IP
                </span>
              )}
              {isVpn && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm">
                  VPN (-30%)
                </span>
              )}
              {isProxy && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-sm">
                  PROXY (-30%)
                </span>
              )}
              {isTor && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-sm">
                  TOR EXIT (-30%)
                </span>
              )}
              {isDatacenter && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-sm">
                  DATACENTER (-30%)
                </span>
              )}
              {isWebRtcLeak && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm">
                  WEBRTC LEAK (-30%)
                </span>
              )}
              {!isTimezoneMatch && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm">
                  TIMEZONE MISMATCH (-30%)
                </span>
              )}
              {isLowRisk ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm">
                  LOW RISK
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm">
                  REDUCED SCORE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

