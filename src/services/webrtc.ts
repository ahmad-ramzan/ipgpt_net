export interface WebRtcDetails {
  localIPs: string[];
  publicIPs: string[];
  hasLeak: boolean;
  leakedIps: string[];
  rawCandidates: string[];
}

export async function detectClientWebRtcLeak(expectedPublicIp?: string): Promise<WebRtcDetails> {
  return new Promise((resolve) => {
    const localIPs: string[] = [];
    const publicIPs: string[] = [];
    const rawCandidates: string[] = [];

    if (typeof window === "undefined" || !window.RTCPeerConnection) {
      resolve({
        localIPs: [],
        publicIPs: [],
        hasLeak: false,
        leakedIps: [],
        rawCandidates: [],
      });
      return;
    }

    let isDone = false;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    });

    try {
      pc.createDataChannel("webrtc-leak-detector");
    } catch (e) {}

    const finish = () => {
      if (isDone) return;
      isDone = true;
      try {
        pc.close();
      } catch (e) {}

      const uniqueLocal = Array.from(new Set(localIPs));
      const uniquePublic = Array.from(new Set(publicIPs));
      const allDiscovered = Array.from(new Set([...uniqueLocal, ...uniquePublic]));

      let hasLeak = false;

      // Leak conditions:
      // 1. Any local or public IPs discovered via STUN/ICE candidates are exposed by browser WebRTC APIs
      if (uniqueLocal.length > 0 || uniquePublic.length > 0) {
        hasLeak = true;
      }

      // 2. If an expected public IP was passed (e.g. proxy IP), and STUN discovers a public IP that differs from it
      if (expectedPublicIp && uniquePublic.length > 0) {
        const matchesExpected = uniquePublic.includes(expectedPublicIp);
        if (!matchesExpected) {
          hasLeak = true;
        }
      }

      resolve({
        localIPs: uniqueLocal,
        publicIPs: uniquePublic,
        hasLeak,
        leakedIps: allDiscovered,
        rawCandidates,
      });
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !event.candidate.candidate) {
        finish();
        return;
      }

      const candidateStr = event.candidate.candidate;
      rawCandidates.push(candidateStr);

      const parts = candidateStr.split(" ");
      if (parts.length >= 5) {
        const ip = parts[4];
        if (ip && ip !== "0.0.0.0") {
          const isIpv4 = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip);
          const isIpv6 = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(ip);
          const isLocal =
            /^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\.|^127\.|^fc00:|^fe80:|\.local$/i.test(ip) ||
            ip.endsWith(".local");

          if (isIpv4 || isIpv6 || ip.endsWith(".local")) {
            if (isLocal) {
              if (!localIPs.includes(ip)) localIPs.push(ip);
            } else {
              if (!publicIPs.includes(ip)) publicIPs.push(ip);
            }
          }
        }
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {})
      .catch(() => finish());

    setTimeout(() => {
      finish();
    }, 2800);
  });
}
