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
