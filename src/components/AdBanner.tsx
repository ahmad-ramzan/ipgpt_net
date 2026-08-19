import React, { useEffect, useRef } from "react";
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
  /** AdSense ad unit ID from the dashboard (data-ad-slot). */
  slot?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ id, className = "", slot = "" }) => {
  const pushedRef = useRef(false);

  useEffect(() => {
    // Guard against the double-invoke of effects in React StrictMode, which
    // would otherwise trigger "adsbygoogle already have ads in them".
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker, or the loader script never arrived.
    }
  }, []);

  return (
    <div id={id} className={`w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CONFIG.ads.client}
        {...(slot ? { "data-ad-slot": slot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};
