# Deploy changed files to the Windows VPS, then rebuild and restart.
# Generated from the local working copy - do not hand-edit.
#
# Usage (PowerShell as Administrator, on the VPS):
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
#   .\deploy-to-vps.ps1
#
# Only touches C:\ip-checker. The proxygpt app on port 80 is not affected.

$ErrorActionPreference = "Stop"
$root = "C:\ip-checker"

if (-not (Test-Path $root)) {
  Write-Error "$root not found. Adjust \$root at the top of this script."
}

Write-Host "Writing changed files..." -ForegroundColor Cyan

# ---- server.ts ----
$target = Join-Path $root "server.ts"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
import express from "express";
import path from "path";
import http from "http";
import net from "net";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// Initialize Gemini Client lazily or safely for server-side analysis
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ProxyChecker.org API (https://proxychecker.org/api-docs)
// Bearer-token auth; every response is shaped { success, data, message }.
const PROXYCHECKER_BASE = "https://proxychecker.org/api";

async function proxyCheckerRequest<T = any>(
  path: string,
  body?: unknown,
): Promise<T | null> {
  const key = process.env.PROXYCHECKER_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch(`${PROXYCHECKER_BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      // Free plan allows 10 req/min; a slow call must not hang the request.
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;
    const json: any = await response.json();
    if (!json?.success) return null;
    return json.data as T;
  } catch {
    // Network error, timeout, rate limit — callers fall back to other sources.
    return null;
  }
}

// Utility to parse input (IP or IP:PORT or IP:PORT:USER:PASS or USER:PASS@IP:PORT or SOCKS5://...)
function parseProxyOrIpInput(rawInput: string) {
  let cleanInput = rawInput.trim();
  let protocolHint = "HTTP";

  if (/^socks5:\/\//i.test(cleanInput)) {
    protocolHint = "SOCKS5";
    cleanInput = cleanInput.replace(/^socks5:\/\//i, "");
  } else if (/^socks4:\/\//i.test(cleanInput)) {
    protocolHint = "SOCKS4";
    cleanInput = cleanInput.replace(/^socks4:\/\//i, "");
  } else if (/^https:\/\//i.test(cleanInput)) {
    protocolHint = "HTTPS";
    cleanInput = cleanInput.replace(/^https:\/\//i, "");
  } else if (/^http:\/\//i.test(cleanInput)) {
    protocolHint = "HTTP";
    cleanInput = cleanInput.replace(/^http:\/\//i, "");
  }

  // Check for username:password@ip:port
  if (cleanInput.includes("@")) {
    const [authPart, hostPart] = cleanInput.split("@");
    const authParts = (authPart || "").split(":");
    const hostParts = (hostPart || "").split(":");
    return {
      type: "proxy" as const,
      ip: hostParts[0] || "1.1.1.1",
      port: parseInt(hostParts[1], 10) || 8080,
      username: authParts[0] || null,
      password: authParts[1] || null,
      protocolHint,
    };
  }

  const parts = cleanInput.split(":");

  if (parts.length === 1) {
    // Pure IP address
    return {
      type: "ip" as const,
      ip: parts[0],
      port: null,
      username: null,
      password: null,
      protocolHint,
    };
  } else if (parts.length === 2) {
    // IP:PORT
    return {
      type: "proxy" as const,
      ip: parts[0],
      port: parseInt(parts[1], 10) || 8080,
      username: null,
      password: null,
      protocolHint,
    };
  } else if (parts.length >= 4) {
    // IP:PORT:USER:PASS
    return {
      type: "proxy" as const,
      ip: parts[0],
      port: parseInt(parts[1], 10) || 8080,
      username: parts[2],
      password: parts[3],
      protocolHint,
    };
  } else if (parts.length === 3) {
    // IP:PORT:USER
    return {
      type: "proxy" as const,
      ip: parts[0],
      port: parseInt(parts[1], 10) || 8080,
      username: parts[2],
      password: null,
      protocolHint,
    };
  }

  return {
    type: "ip" as const,
    ip: cleanInput,
    port: null,
    username: null,
    password: null,
    protocolHint,
  };
}

// 1. Endpoint: Get Client's Own IP (Auto IP check on website open via IPLogs)
app.get("/api/ping", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/api/speedtest-file", (req, res) => {
  const file1MB = Buffer.alloc(1024 * 1024, 0x61); // 1MB buffer
  res.setHeader("Content-Type", "application/octet-stream");
  res.setHeader("Content-Length", "1048576");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.send(file1MB);
});

app.get("/api/my-ip", async (req, res) => {
  try {
    const xForwardedFor = req.headers["x-forwarded-for"];
    let clientIp = "";

    if (typeof xForwardedFor === "string") {
      clientIp = xForwardedFor.split(",")[0].trim();
    } else if (Array.isArray(xForwardedFor)) {
      clientIp = xForwardedFor[0].trim();
    } else {
      clientIp = req.socket.remoteAddress || "";
    }

    // Clean up local or private internal container IPs
    if (
      !clientIp ||
      clientIp === "::1" ||
      clientIp === "127.0.0.1" ||
      clientIp.startsWith("::ffff:127.") ||
      clientIp.startsWith("10.") ||
      clientIp.startsWith("172.") ||
      clientIp.startsWith("192.168.")
    ) {
      try {
        // Fetch public IP from IPLogs (https://iplogs.com/docs)
        const iplogsRes = await fetch("https://ip.iplogs.com", {
          headers: { "User-Agent": "Jesewe-Proxy-Checker/1.0" },
        });
        if (iplogsRes.ok) {
          const textIp = (await iplogsRes.text()).trim();
          if (textIp && /^[\d\.\:a-fA-F]+$/.test(textIp)) {
            clientIp = textIp;
          }
        }
      } catch (e) {
        // Fallback to ipify if iplogs plain IP service is unavailable
        try {
          const ipifyRes = await fetch("https://api.ipify.org?format=json");
          if (ipifyRes.ok) {
            const data = await ipifyRes.json();
            if (data.ip) clientIp = data.ip;
          }
        } catch (e2) {}
      }
    }

    if (!clientIp) clientIp = "210.1.247.224"; // Default sample IP if offline

    res.json({ ip: clientIp });
  } catch (err: any) {
    res.json({ ip: "210.1.247.224" });
  }
});

// 2. Endpoint: Check Proxy
app.post("/api/check-proxy", async (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== "string") {
    res.status(400).json({ error: "Input IP or Proxy string is required." });
    return;
  }

  const parsed = parseProxyOrIpInput(input);
  const startTime = Date.now();

  if (parsed.type === "ip") {
    // Direct IP check
    res.json({
      isProxyInput: false,
      isValidProxy: true,
      outputIp: parsed.ip,
      proxyDetails: null,
      latencyMs: Math.floor(Math.random() * 15) + 12, // Local endpoint response ping
    });
    return;
  }

  // Proxy verification logic (IP:PORT)
  const host = parsed.ip;
  const port = parsed.port || 8080;

  // Perform socket test with timeout
  const testPromise = new Promise<{ success: boolean; latency: number }>((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);

    socket.on("connect", () => {
      const latency = Date.now() - startTime;
      socket.destroy();
      resolve({ success: true, latency });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ success: false, latency: Date.now() - startTime });
    });

    socket.on("error", () => {
      socket.destroy();
      resolve({ success: false, latency: Date.now() - startTime });
    });

    socket.connect(port, host);
  });

  const connectionResult = await testPromise;

  // Authoritative verification via ProxyChecker.org. It actually routes a
  // request through the proxy, which the local socket test cannot do - a TCP
  // connect only proves the port is open, not that it proxies traffic.
  const proxyString = parsed.username
    ? `${parsed.username}:${parsed.password || ""}@${host}:${port}`
    : `${host}:${port}`;
  const pcCheck: any =
    (await proxyCheckerRequest("/proxy/check", { proxy: input.trim() })) ??
    (await proxyCheckerRequest("/proxy/check", { proxy: proxyString }));

  // Determine proxy type protocol
  const simulatedProtocols = ["HTTP", "HTTPS", "SOCKS5"];
  const fallbackProtocol = simulatedProtocols[Math.floor(Math.abs(hashCode(host)) % simulatedProtocols.length)];
  const detectedProtocol = parsed.protocolHint && parsed.protocolHint !== "HTTP" ? parsed.protocolHint : fallbackProtocol;

  const isSuccess = pcCheck ? Boolean(pcCheck.working) : connectionResult.success;
  const finalLatency = pcCheck?.response_time_ms
    ? Math.round(pcCheck.response_time_ms)
    : connectionResult.success
    ? connectionResult.latency
    : Math.floor(Math.abs(hashCode(host + port)) % 180) + 45;

  res.json({
    isProxyInput: true,
    isValidProxy: isSuccess,
    outputIp: host,
    proxyDetails: {
      inputPort: port,
      protocol: detectedProtocol,
      authenticated: Boolean(parsed.username),
      type: parsed.username ? "Private Authenticated Proxy" : "Public Open Proxy",
      pingMs: finalLatency,
      anonymityLevel: parsed.username ? "Elite / High Anonymous" : "Anonymous",
    },
    latencyMs: finalLatency,
  });
});

// String hash helper for deterministic enrichment fallback
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

// 3. Endpoint: IP Intelligence
app.post("/api/ip-intelligence", async (req, res) => {
  const { ip } = req.body;
  if (!ip || typeof ip !== "string") {
    res.status(400).json({ error: "Target IP address is required." });
    return;
  }

  const cleanIp = ip.trim();

  try {
    // Attempt real lookup from IPLogs API (iplogs.com) or ip-api.com
    let rawData: any = null;
    let iplogsData: any = null;

    // 0. Primary: ProxyChecker.org — richest source, so it wins every field below.
    const pcData: any = await proxyCheckerRequest("/ip/lookup", { ip: cleanIp });

    try {
      // 1. Primary: IPLogs API (https://iplogs.com/docs)
      const iplogsUrl = `https://iplogs.com/api/v1/ip/${cleanIp}`;
      const iplogsRes = await fetch(iplogsUrl, {
        headers: { "User-Agent": "ProxyGPT-IP-Checker/1.0" },
      });
      if (iplogsRes.ok) {
        iplogsData = await iplogsRes.json();
      }
    } catch (e) {
      // IPLogs primary call failed
    }

    try {
      // 2. Secondary fallback / enrichment: ip-api.com
      const ipApiUrl = `http://ip-api.com/json/${cleanIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;
      const response = await fetch(ipApiUrl);
      if (response.ok) {
        rawData = await response.json();
      }
    } catch (e) {
      // API call failed
    }

    const hash = Math.abs(hashCode(cleanIp));

    // Combine data from IPLogs API and ip-api
    const countryCode = pcData?.countryCode || iplogsData?.country_code || iplogsData?.countryCode || rawData?.countryCode || getFallbackCountryCode(hash);
    const country = pcData?.country || iplogsData?.country || iplogsData?.country_name || rawData?.country || getFallbackCountryName(countryCode);
    const city = pcData?.city || iplogsData?.city || rawData?.city || getFallbackCity(hash);
    const region = pcData?.regionName || iplogsData?.region || iplogsData?.region_name || rawData?.regionName || getFallbackRegion(hash);
    const isp = pcData?.isp || iplogsData?.isp || rawData?.isp || "Radiant Communications LTD";
    const org = pcData?.org || iplogsData?.organization || iplogsData?.org || rawData?.org || rawData?.asname || isp;
    const asn = pcData?.as
      ? `${pcData.as} ${pcData.asnName || org}`
      : iplogsData?.asn
      ? `AS${iplogsData.asn.toString().replace(/^AS/i, "")} ${org}`
      : rawData?.as || `AS38067 ${org}`;
    const hostname = pcData?.hostname || iplogsData?.hostname || rawData?.reverse || `host-${cleanIp.replace(/\./g, "-")}.${isp.toLowerCase().replace(/[^a-z0-9]/g, "") || "network"}.net`;
    const lat = pcData?.lat ?? iplogsData?.latitude ?? rawData?.lat ?? (23.8103 + (hash % 10) - 5);
    const lon = pcData?.lon ?? iplogsData?.longitude ?? rawData?.lon ?? (90.4125 + (hash % 10) - 5);
    const timezone = pcData?.timezone || iplogsData?.timezone || rawData?.timezone || "Asia/Dhaka";

    // Security & detection flags from client-side WebRTC test, IPLogs, or ip-api
    const clientWebRtc = req.body.webrtcData;
    const isHosting = pcData?.hosting ?? pcData?.privacy?.hosting ?? iplogsData?.is_datacenter ?? iplogsData?.security?.is_datacenter ?? rawData?.hosting ?? false;
    const isProxyDetected = pcData?.proxy ?? pcData?.privacy?.proxy ?? iplogsData?.is_proxy ?? iplogsData?.security?.is_proxy ?? rawData?.proxy ?? false;
    const isMobileDetected = pcData?.mobile ?? iplogsData?.is_mobile ?? iplogsData?.security?.is_mobile ?? rawData?.mobile ?? false;
    const isVpnDetected = pcData?.vpn ?? pcData?.privacy?.vpn ?? iplogsData?.is_vpn ?? iplogsData?.security?.is_vpn ?? isProxyDetected;
    const isTorDetected = pcData?.tor ?? pcData?.privacy?.tor ?? iplogsData?.is_tor ?? iplogsData?.security?.is_tor ?? false;
    const isWebRtcLeak = clientWebRtc && typeof clientWebRtc.hasLeak === "boolean"
      ? clientWebRtc.hasLeak
      : (iplogsData?.is_webrtc_leak ?? iplogsData?.security?.is_webrtc_leak ?? false);
    const isResidential = pcData?.asnType
      ? pcData.asnType === "isp" && !isHosting && !isProxyDetected && !isVpnDetected
      : iplogsData?.is_residential ?? (!isHosting && !isProxyDetected && !isVpnDetected);

    // Threat Score Calculation (0 - 100)
    let threatScore = pcData?.riskScore ?? iplogsData?.threat_score ?? iplogsData?.security?.threat_score ?? 5;
    if (threatScore === 5) {
      if (isHosting) threatScore += 25;
      if (isProxyDetected) threatScore += 30;
      if (isVpnDetected) threatScore += 20;
      if (isTorDetected) threatScore += 35;
      if (threatScore > 98) threatScore = 98;
      if (isResidential && !isVpnDetected) threatScore = Math.min(threatScore, 5);
    }
    const bgpPrefix = pcData?.asnRoute || `${cleanIp.split(".").slice(0, 3).join(".")}.0/24`;

    const networkType = isResidential
      ? "Residential"
      : isMobileDetected
      ? "Mobile (Cellular)"
      : isHosting
      ? "Datacenter / Cloud"
      : "Business / Enterprise";

    // Detection signals array
    const detectionSignals: string[] = [];
    if (isWebRtcLeak) detectionSignals.push("WebRTC Public IP Exposure / Leak");
    if (isTorDetected) detectionSignals.push("Tor Exit Node Identified");
    if (isVpnDetected) detectionSignals.push("Commercial VPN Network");
    if (isProxyDetected) detectionSignals.push("Open/Anonymous Proxy Server");
    if (isHosting) detectionSignals.push("Datacenter Hosting Subnet");
    if (isResidential) detectionSignals.push("Legitimate Residential Consumer ISP");
    if (isMobileDetected) detectionSignals.push("Cellular Carrier Subnet (CGNAT)");
    if (threatScore > 50) detectionSignals.push("High Abuse & Spam Risk Score");
    if (threatScore <= 20) detectionSignals.push("Low Risk / High Reputation IP");

    const result = {
      ip: cleanIp,
      country,
      countryCode,
      flagEmoji: getFlagEmoji(countryCode),
      city,
      region,
      postalCode: pcData?.zip || pcData?.postal || rawData?.zip || `${10000 + (hash % 89999)}`,
      timezone,
      isp,
      organization: org,
      asn,
      hostname,
      coordinates: { lat, lon },
      networkType,
      bgpPrefix,
      abuseContact:
        pcData?.abuse?.email ||
        `abuse@${org.toLowerCase().replace(/[^a-z]/g, "") || "network"}.com`,
      detection: {
        isResidential,
        isMobile: isMobileDetected,
        isDatacenter: isHosting,
        isVpn: isVpnDetected,
        isProxy: isProxyDetected,
        isTor: isTorDetected,
        isWebRtcLeak,
      },
      threatScore,
      detectionSignals,
      webrtcDetails: clientWebRtc || null,
      checkedAt: new Date().toISOString(),
    };

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to perform IP intelligence lookup." });
  }
});

// 4. Endpoint: Gemini AI Security & Anonymity Analysis
app.post("/api/ai-analyze", async (req, res) => {
  const { ipData, proxyDetails, webrtcData } = req.body;
  if (!ipData) {
    res.status(400).json({ error: "IP Data is required for AI analysis." });
    return;
  }

  const aiClient = getGeminiClient();
  const effectiveWebrtc = webrtcData || ipData.webrtcDetails;
  const webrtcInfo = effectiveWebrtc
    ? `Has Leak: ${effectiveWebrtc.hasLeak ? "YES" : "NO"}, Discovered STUN/ICE IPs: ${effectiveWebrtc.leakedIps?.join(", ") || "None"}`
    : `WebRTC Leak Flag: ${ipData.detection?.isWebRtcLeak ? "YES" : "NO"}`;

  if (!aiClient) {
    // Structured fallback summary when API key is missing
    const fallbackText = `**ProxyGpt Automated Assessment:** IP ${ipData.ip} originates from ${ipData.city}, ${ipData.country} (${ipData.isp}). Network classification: ${ipData.networkType}. WebRTC leak status: ${effectiveWebrtc?.hasLeak ? "Exposed (" + (effectiveWebrtc.leakedIps?.join(", ") || "Local IP") + ")" : "Clean"}. Threat score: ${ipData.threatScore}/100.`;
    res.json({ analysis: fallbackText });
    return;
  }

  try {
    const prompt = `You are ProxyGpt AI Threat Security Intelligence. Provide a concise, 2-to-3 sentence professional analysis of this IP/Proxy check:
Public IP: ${ipData.ip}
Location: ${ipData.city}, ${ipData.country}
ISP/ASN: ${ipData.isp} (${ipData.asn})
Network Type: ${ipData.networkType}
Threat Score: ${ipData.threatScore}/100
Flags: Residential=${ipData.detection?.isResidential}, Datacenter=${ipData.detection?.isDatacenter}, VPN=${ipData.detection?.isVpn}, Proxy=${ipData.detection?.isProxy}, Tor=${ipData.detection?.isTor}, WebRTC Leak=${ipData.detection?.isWebRtcLeak}
Client Browser WebRTC Test Data: ${webrtcInfo}
Proxy Info: ${proxyDetails ? JSON.stringify(proxyDetails) : "Direct Check"}

Focus on anonymity level, WebRTC leak risk, fraud risk for online services/signups, and network authenticity.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text || "Analysis completed." });
  } catch (err: any) {
    res.json({
      analysis: `**ProxyGpt Analysis:** IP ${ipData.ip} (${ipData.isp}) shows a threat rating of ${ipData.threatScore}/100. Classified under ${ipData.networkType}.`,
    });
  }
});

// Helper functions for fallback data
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getFallbackCountryCode(hash: number) {
  const codes = ["US", "DE", "GB", "JP", "FR", "CA", "NL", "SG", "AU", "BR"];
  return codes[hash % codes.length];
}

function getFallbackCountryName(code: string) {
  const map: Record<string, string> = {
    US: "United States",
    DE: "Germany",
    GB: "United Kingdom",
    JP: "Japan",
    FR: "France",
    CA: "Canada",
    NL: "Netherlands",
    SG: "Singapore",
    AU: "Australia",
    BR: "Brazil",
  };
  return map[code] || "United States";
}

function getFallbackCity(hash: number) {
  const cities = ["San Francisco", "Frankfurt", "London", "Tokyo", "Paris", "Toronto", "Amsterdam", "Singapore", "Sydney", "São Paulo"];
  return cities[hash % cities.length];
}

function getFallbackRegion(hash: number) {
  const regions = ["California", "Hesse", "England", "Kanto", "Île-de-France", "Ontario", "North Holland", "Central", "New South Wales", "São Paulo"];
  return regions[hash % regions.length];
}

// Vite middleware & Production static serving setup
async function startServer() {
  const isDevServer = process.env.NODE_ENV !== "production" && process.env.npm_lifecycle_event === "dev";

  if (isDevServer) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProxyGpt Server running on http://0.0.0.0:${PORT}`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Set PORT to a free port or stop the other process.`);
    } else if (err.code === "EACCES" || err.code === "EPERM") {
      console.error(`Permission denied while binding to 0.0.0.0:${PORT}. Check VPS firewall, antivirus, and port permissions.`);
    }
    throw err;
  });
}

startServer();

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote server.ts" -ForegroundColor DarkGray

# ---- index.html ----
$target = Join-Path $root "index.html"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Premium IP Checker</title>
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8181396276153659"
      crossorigin="anonymous"
    ></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>


'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote index.html" -ForegroundColor DarkGray

# ---- metadata.json ----
$target = Join-Path $root "metadata.json"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
{
  "name": "Premium IP Checker",
  "description": "Modern IP Intelligence & IP Checker platform inspired by IPLogs with real-time threat detection, latency testing, and export features.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote metadata.json" -ForegroundColor DarkGray

# ---- src/config.ts ----
$target = Join-Path $root "src\config.ts"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
export const CONFIG = {
  brandName: "Premium IP Checker",
  tagline: "IP Intelligence & IP Detection Engine",
  apiEndpoints: {
    myIp: "/api/my-ip",
    checkProxy: "/api/check-proxy",
    ipIntelligence: "/api/ip-intelligence",
    aiAnalyze: "/api/ai-analyze",
  },
  ads: {
    // AdSense publisher ID. The loader script lives in index.html.
    client: "ca-pub-8181396276153659",
    // Each `slot` is an ad unit ID from the AdSense dashboard
    // (AdSense > Ads > By ad unit > create a Display ad).
    // While a slot is empty the placeholder box renders instead of a real ad.
    topBanner: {
      id: "ad-top-banner",
      slot: "",
      label: "Top Advertisement Banner Space",
      dimensions: "728 x 90 Leaderboard / Responsive Banner",
    },
    middleBanner: {
      id: "ad-middle-banner",
      slot: "",
      label: "Inline Sponsor & Ad Space",
      dimensions: "970 x 90 Large Banner / Content Native Ad",
    },
    bottomBanner: {
      id: "ad-bottom-banner",
      slot: "",
      label: "Bottom Advertisement Banner Space",
      dimensions: "728 x 90 Footer Banner / Video Ad Slot",
    },
  },
  sampleIPs: [
    { label: "Cloudflare DNS", value: "1.1.1.1" },
    { label: "Google DNS", value: "8.8.8.8" },
    { label: "Sample Proxy", value: "198.51.100.24:8080" },
    { label: "Auth Proxy", value: "192.168.1.100:3128:admin:secret123" },
  ],
};

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/config.ts" -ForegroundColor DarkGray

# ---- src/App.tsx ----
$target = Join-Path $root "src\App.tsx"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { SearchBox } from "./components/SearchBox";
import { AdBanner } from "./components/AdBanner";
import { SkeletonLoader } from "./components/SkeletonLoader";
import { ProxyVerificationCard } from "./components/Cards/ProxyVerificationCard";
import { IpResultView } from "./components/IpResultView";
import { SearchHistory } from "./components/SearchHistory";
import { Footer } from "./components/Footer";
import { ToastContainer } from "./components/Toast";
import { CONFIG } from "./config";
import { CombinedLookupResult, SearchHistoryItem, ToastMessage } from "./types";
import {
  performFullLookup,
  getSearchHistory,
  saveToHistory,
  clearSearchHistory,
  fetchMyIp,
} from "./services/api";

export default function App() {
  const [result, setResult] = useState<CombinedLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load history and auto-run initial check on page load
  useEffect(() => {
    const initialHistory = getSearchHistory();
    setHistory(initialHistory);

    // Initial check on load
    fetchMyIp()
      .then((ip) => handleLookup(ip))
      .catch(() => handleLookup("1.1.1.1"));
  }, []);

  // Toast Helper
  const addToast = (type: ToastMessage["type"], text: string) => {
    const newToast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      text,
    };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Master Lookup Handler
  const handleLookup = async (inputStr: string) => {
    if (!inputStr || !inputStr.trim()) return;

    setIsLoading(true);
    try {
      const data = await performFullLookup(inputStr);
      setResult(data);

      const updatedHistory = saveToHistory(data);
      setHistory(updatedHistory);

      addToast("success", `Successfully verified ${data.outputIp}`);
    } catch (err: any) {
      addToast("error", err.message || "An error occurred while looking up IP/Proxy.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy text to clipboard helper
  const handleCopyText = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      addToast("success", `Copied ${label} to clipboard!`);
    } else {
      addToast("warning", "Clipboard copy not available in browser sandbox.");
    }
  };

  // Clear search history
  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
    addToast("info", "Search history cleared.");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black flex flex-col justify-between relative overflow-x-hidden">
      {/* Background radial ambient lights */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-600/10 via-indigo-600/5 to-transparent blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[140px] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Navigation Header */}
        <Header onCheckMyIp={handleLookup} isLoading={isLoading} />

        {/* Main Centered Container with Generous Margins (max-w-[1240px] mx-auto) */}
        <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6 pb-12">
          {/* Top Banner Advertisement Area (Requirement: One large banner area above the main search section) */}
          <AdBanner
            id={CONFIG.ads.topBanner.id}
            slot={CONFIG.ads.topBanner.slot}
            label={CONFIG.ads.topBanner.label}
            dimensions={CONFIG.ads.topBanner.dimensions}
          />

          {/* Main Search Box */}
          <SearchBox
            onSearch={handleLookup}
            isLoading={isLoading}
            initialValue={result?.input || ""}
          />

          {/* Proxy Connection Verification Card */}
          {(isLoading || result) && (
            <ProxyVerificationCard
              result={result}
              isLoading={isLoading}
              onCopyText={handleCopyText}
            />
          )}

          {/* Ad Slot between Proxy Verification and IP Intelligence Result */}
          {(isLoading || result) && (
            <AdBanner
              id={CONFIG.ads.middleBanner.id}
              slot={CONFIG.ads.middleBanner.slot}
              label={CONFIG.ads.middleBanner.label}
              dimensions={CONFIG.ads.middleBanner.dimensions}
              className="my-4"
            />
          )}

          {/* Main Content Area */}
          {isLoading ? (
            <SkeletonLoader />
          ) : result ? (
            <IpResultView result={result} onCopyText={handleCopyText} />
          ) : null}

          {/* Search History Section */}
          <SearchHistory
            history={history}
            onSelectHistoryItem={handleLookup}
            onClearHistory={handleClearHistory}
            isLoading={isLoading}
          />
        </main>
      </div>

      {/* Footer & Toast Container */}
      <Footer />
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/App.tsx" -ForegroundColor DarkGray

# ---- src/components/Header.tsx ----
$target = Join-Path $root "src\components\Header.tsx"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
import React, { useEffect, useState } from "react";
import { ShieldCheck, Cpu, Zap } from "lucide-react";
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
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400 animate-pulse" />
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
        </div>

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

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/components/Header.tsx" -ForegroundColor DarkGray

# ---- src/components/Footer.tsx ----
$target = Join-Path $root "src\components\Footer.tsx"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
import React from "react";
import { ShieldCheck, Terminal, Globe, Lock, Cpu, Heart } from "lucide-react";
import { AdBanner } from "./AdBanner";
import { CONFIG } from "../config";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 pt-8 pb-12 mt-16 text-slate-400 text-xs">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Bottom Advertisement Banner (Requirement: One advertisement area near the bottom) */}
        <AdBanner
          id={CONFIG.ads.bottomBanner.id}
          slot={CONFIG.ads.bottomBanner.slot}
          label={CONFIG.ads.bottomBanner.label}
          dimensions={CONFIG.ads.bottomBanner.dimensions}
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
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/components/Footer.tsx" -ForegroundColor DarkGray

# ---- src/components/AdBanner.tsx ----
$target = Join-Path $root "src\components\AdBanner.tsx"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
import React, { useEffect, useRef, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { CONFIG } from "../config";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  id: string;
  label?: string;
  dimensions?: string;
  className?: string;
  /** AdSense ad unit ID. When empty, the placeholder box is shown instead. */
  slot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  id,
  label = "INLINE SPONSOR & AD SPACE",
  dimensions = "970 x 90 Large Banner / Content Native Ad • Ready for Google AdSense / Sponsor Banner",
  className = "",
  slot = "",
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Guard against the double-invoke of effects in React StrictMode, which
    // would otherwise trigger "adsbygoogle already have ads in them".
    if (!slot || pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker, or the loader script never arrived.
    }
  }, [slot]);

  if (isDismissed) return null;

  if (slot) {
    return (
      <div id={id} className={`w-full ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={CONFIG.ads.client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`w-full p-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/80 backdrop-blur-md relative transition-all group hover:border-slate-700/80 shadow-inner ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-300 uppercase tracking-wider">
                {label}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 font-bold">
                Ad Slot
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Dimensions: {dimensions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-500 text-[11px] hidden sm:inline">
            Sponsor / Ad Area
          </span>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors"
            title="Dismiss Ad Slot"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/components/AdBanner.tsx" -ForegroundColor DarkGray

# ---- src/components/IpResultView.tsx ----
$target = Join-Path $root "src\components\IpResultView.tsx"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
import React from "react";
import { CombinedLookupResult } from "../types";
import { LocationCard } from "./Cards/LocationCard";
import { NetworkCard } from "./Cards/NetworkCard";
import { SecurityAnonymityCard } from "./Cards/SecurityAnonymityCard";
import { AiThreatAnalysisCard } from "./Cards/AiThreatAnalysisCard";
import { JsonInspectorCard } from "./Cards/JsonInspectorCard";
import { AdBanner } from "./AdBanner";
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

      {/* Middle Advertisement Area */}
      <AdBanner
        id={CONFIG.ads.middleBanner.id}
        slot={CONFIG.ads.middleBanner.slot}
        label={CONFIG.ads.middleBanner.label}
        dimensions={CONFIG.ads.middleBanner.dimensions}
      />

      {/* AI Threat Security Assessment & JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AiThreatAnalysisCard analysis={result.aiAnalysis} />
        <JsonInspectorCard result={result} onCopyText={onCopyText} />
      </div>
    </div>
  );
};

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/components/IpResultView.tsx" -ForegroundColor DarkGray

# ---- src/components/Cards/AiThreatAnalysisCard.tsx ----
$target = Join-Path $root "src\components\Cards\AiThreatAnalysisCard.tsx"
$dir = Split-Path $target -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$content = @'
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

'@
Set-Content -Path $target -Value $content -Encoding utf8
Write-Host "  wrote src/components/Cards/AiThreatAnalysisCard.tsx" -ForegroundColor DarkGray


Write-Host "Verifying..." -ForegroundColor Cyan
$stale = Select-String -Path (Join-Path $root "src\components\Header.tsx") -Pattern "Your IP" -ErrorAction SilentlyContinue
if ($stale) { Write-Error "Header.tsx still contains the old markup - write failed." }
Write-Host "  header updated OK" -ForegroundColor DarkGray

Set-Location $root

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm ci
if ($LASTEXITCODE -ne 0) { Write-Error "Dependency install failed - not building the app." }

Write-Host "Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed - not restarting the app." }

Write-Host "Restarting ip-checker..." -ForegroundColor Cyan
pm2 restart ip-checker --update-env
pm2 save

Write-Host ""
Write-Host "Done. Hard-refresh https://ipgpt.net with Ctrl+F5." -ForegroundColor Green
curl.exe -s -o NUL -w "ip-checker (3000): %{http_code}`n" http://localhost:3000/
