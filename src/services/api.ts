import { CONFIG } from "../config";
import { CombinedLookupResult, SearchHistoryItem } from "../types";
import { detectClientWebRtcLeak } from "./webrtc";

// Get user's own incoming IP
export async function fetchMyIp(): Promise<string> {
  try {
    const res = await fetch(CONFIG.apiEndpoints.myIp);
    const data = await res.json();
    return data.ip || "1.1.1.1";
  } catch (err) {
    return "1.1.1.1";
  }
}

// Master workflow execution function
export async function performFullLookup(input: string): Promise<CombinedLookupResult> {
  const cleanInput = input.trim();
  if (!cleanInput) {
    throw new Error("Please enter an IP address or proxy string.");
  }

  // Step 1: Check proxy / parse IP
  const proxyRes = await fetch(CONFIG.apiEndpoints.checkProxy, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: cleanInput }),
  });

  if (!proxyRes.ok) {
    throw new Error("Failed to connect to Proxy Verification engine.");
  }

  const proxyData = await proxyRes.json();
  const outputIp = proxyData.outputIp || cleanInput;

  // Step 2: Perform real client-side browser WebRTC detection via STUN candidates
  let webrtcData = null;
  try {
    webrtcData = await detectClientWebRtcLeak(outputIp);
  } catch (err) {
    webrtcData = null;
  }

  // Step 3: Obtain output IP and fetch IP Intelligence with client-side WebRTC data
  const ipIntelRes = await fetch(CONFIG.apiEndpoints.ipIntelligence, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ip: outputIp, webrtcData }),
  });

  if (!ipIntelRes.ok) {
    throw new Error(`Failed to retrieve IP Intelligence for IP: ${outputIp}`);
  }

  const ipIntelData = await ipIntelRes.json();

  // Step 4: AI Threat Analysis with Gemini
  let aiAnalysis: string | null = null;
  try {
    const aiRes = await fetch(CONFIG.apiEndpoints.aiAnalyze, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ipData: ipIntelData,
        proxyDetails: proxyData.proxyDetails,
        webrtcData,
      }),
    });
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      aiAnalysis = aiData.analysis;
    }
  } catch (e) {
    // Graceful fallback if AI endpoint fails
    aiAnalysis = null;
  }

  return {
    input: cleanInput,
    isProxyInput: proxyData.isProxyInput,
    isValidProxy: proxyData.isValidProxy,
    outputIp,
    proxyDetails: proxyData.proxyDetails,
    ipIntelligence: ipIntelData,
    aiAnalysis,
    latencyMs: proxyData.latencyMs || 24,
  };
}

// History LocalStorage Helpers
const HISTORY_KEY = "proxygpt_search_history_v1";

export function getSearchHistory(): SearchHistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveToHistory(result: CombinedLookupResult): SearchHistoryItem[] {
  try {
    const current = getSearchHistory();
    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      input: result.input,
      outputIp: result.outputIp,
      isProxy: result.isProxyInput,
      threatScore: result.ipIntelligence.threatScore,
      country: result.ipIntelligence.country,
      countryCode: result.ipIntelligence.countryCode,
      timestamp: new Date().toISOString(),
    };

    // Filter duplicates of same input to top
    const filtered = current.filter((item) => item.input !== result.input);
    const updated = [newItem, ...filtered].slice(0, 20); // Keep last 20
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (e) {}
}

// Export Helpers
export function exportToJsonFile(result: CombinedLookupResult) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `ipgpt-${result.outputIp.replace(/\./g, "_")}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportToCsvFile(result: CombinedLookupResult) {
  const intel = result.ipIntelligence;
  const rows = [
    ["Parameter", "Value"],
    ["Query Input", result.input],
    ["Output IP", result.outputIp],
    ["Is Proxy Input", result.isProxyInput ? "Yes" : "No"],
    ["Valid Proxy", result.isValidProxy ? "Yes" : "No"],
    ["Country", `${intel.country} (${intel.countryCode})`],
    ["City", intel.city],
    ["Region", intel.region],
    ["Postal Code", intel.postalCode],
    ["ISP", intel.isp],
    ["Organization", intel.organization],
    ["ASN", intel.asn],
    ["Hostname", intel.hostname],
    ["Network Type", intel.networkType],
    ["BGP Prefix", intel.bgpPrefix],
    ["Coordinates", `${intel.coordinates.lat}, ${intel.coordinates.lon}`],
    ["Residential Detection", intel.detection.isResidential ? "Yes" : "No"],
    ["Mobile Detection", intel.detection.isMobile ? "Yes" : "No"],
    ["Datacenter Detection", intel.detection.isDatacenter ? "Yes" : "No"],
    ["VPN Detection", intel.detection.isVpn ? "Yes" : "No"],
    ["Proxy Detection", intel.detection.isProxy ? "Yes" : "No"],
    ["Tor Detection", intel.detection.isTor ? "Yes" : "No"],
    ["Threat Score", `${intel.threatScore}/100`],
    ["Latency", `${result.latencyMs} ms`],
    ["Checked At", intel.checkedAt],
  ];

  const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", encodeURI(csvContent));
  downloadAnchor.setAttribute("download", `ipgpt-${result.outputIp.replace(/\./g, "_")}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
