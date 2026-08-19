import React, { useEffect, useRef } from "react";

interface ScriptAdBannerProps {
  id: string;
  /** Ad network tag URL. */
  src: string;
  /** Network zone id passed through as data-zone. Omit for tags that embed it in the URL. */
  zone?: string;
  /** Some networks require data-cfasync="false" to bypass Cloudflare Rocket Loader. */
  cfasync?: boolean;
  /** Networks that inject into a named div need that div rendered for them. */
  containerId?: string;
  className?: string;
}

/**
 * Mounts a third-party ad network <script> tag inside this container.
 * React does not execute <script> elements written as JSX, so the tag has to
 * be created imperatively and appended to a real DOM node.
 */
export const ScriptAdBanner: React.FC<ScriptAdBannerProps> = ({
  id,
  src,
  zone,
  cfasync = false,
  containerId,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects; loading the tag twice would request
    // two ads for the same zone.
    if (!containerRef.current || loadedRef.current) return;
    loadedRef.current = true;

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (zone) script.dataset.zone = zone;
    if (cfasync) script.setAttribute("data-cfasync", "false");
    containerRef.current.appendChild(script);
  }, [src, zone, cfasync]);

  return (
    <div id={id} ref={containerRef} className={`w-full ${className}`}>
      {/* Kept as a sibling of the injected script so the network can find it. */}
      {containerId && <div id={containerId} />}
    </div>
  );
};
