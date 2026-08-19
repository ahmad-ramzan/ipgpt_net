export interface WebRtcDetails {
  localIPs: string[];
  publicIPs: string[];
  hasLeak: boolean;
  leakedIps: string[];
  rawCandidates: string[];
}

export interface ProxyDetails {
  inputPort: number;
  protocol: string;
  authenticated: boolean;
  type: string;
  pingMs: number;
  anonymityLevel: string;
}

export interface DetectionFlags {
  isResidential: boolean;
  isMobile: boolean;
  isDatacenter: boolean;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isWebRtcLeak?: boolean;
}

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface IpIntelligenceResult {
  ip: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  city: string;
  region: string;
  postalCode: string;
  timezone: string;
  isp: string;
  organization: string;
  asn: string;
  hostname: string;
  coordinates: Coordinates;
  networkType: string;
  bgpPrefix: string;
  abuseContact: string;
  detection: DetectionFlags;
  threatScore: number;
  detectionSignals: string[];
  webrtcDetails?: WebRtcDetails;
  checkedAt: string;
}

export interface CombinedLookupResult {
  input: string;
  isProxyInput: boolean;
  isValidProxy: boolean;
  outputIp: string;
  proxyDetails: ProxyDetails | null;
  ipIntelligence: IpIntelligenceResult;
  aiAnalysis: string | null;
  latencyMs: number;
}

export interface SearchHistoryItem {
  id: string;
  input: string;
  outputIp: string;
  isProxy: boolean;
  threatScore: number;
  country: string;
  countryCode: string;
  timestamp: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}
