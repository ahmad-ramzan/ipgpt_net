import React from "react";
import { MapPin, Globe, Clock, Compass, ExternalLink, Flag } from "lucide-react";
import { IpIntelligenceResult } from "../../types";

interface LocationCardProps {
  intel: IpIntelligenceResult;
}

export const LocationCard: React.FC<LocationCardProps> = ({ intel }) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${intel.coordinates.lat},${intel.coordinates.lon}`;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl shadow-black/50 backdrop-blur-xl relative flex flex-col justify-between group hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-cyan-500/10 transition-all duration-300">
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-extrabold text-white tracking-widest uppercase">
              Geolocation & Location
            </h3>
          </div>
          <span className="text-3xl leading-none drop-shadow-md">{intel.flagEmoji}</span>
        </div>

        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Globe className="w-4 h-4 text-cyan-400" /> Country
            </span>
            <span className="font-extrabold text-white flex items-center gap-2 text-sm sm:text-base">
              {intel.countryCode && (
                <img
                  src={`https://flagcdn.com/w40/${intel.countryCode.toLowerCase()}.png`}
                  alt={intel.countryCode}
                  className="w-5 h-3.5 object-cover rounded shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-base">{intel.flagEmoji}</span>
              <span>{intel.country}</span>
              <span className="font-mono text-xs text-slate-400">({intel.countryCode})</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 font-medium text-sm">City / Metro</span>
            <span className="font-bold text-slate-100 text-sm sm:text-base">{intel.city}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 font-medium text-sm">Region / State</span>
            <span className="font-bold text-slate-100 text-sm sm:text-base">{intel.region}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 font-medium text-sm">Postal Code</span>
            <span className="font-mono font-bold text-slate-200 text-sm sm:text-base">{intel.postalCode}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Clock className="w-4 h-4 text-indigo-400" /> Timezone
            </span>
            <span className="font-mono font-bold text-cyan-300 text-sm sm:text-base">{intel.timezone}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
            <span className="text-slate-400 flex items-center gap-2 font-medium text-sm">
              <Compass className="w-4 h-4 text-purple-400" /> Coordinates
            </span>
            <span className="font-mono font-bold text-slate-200 text-sm sm:text-base">
              {intel.coordinates.lat.toFixed(4)}, {intel.coordinates.lon.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Live Visual Map Preview Section */}
        <div className="mt-3.5 rounded-xl overflow-hidden border border-slate-800/90 shadow-inner h-36 sm:h-40 relative group/map">
          <iframe
            title="Interactive Map Preview"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${intel.coordinates.lon - 0.04}%2C${intel.coordinates.lat - 0.04}%2C${intel.coordinates.lon + 0.04}%2C${intel.coordinates.lat + 0.04}&layer=mapnik&marker=${intel.coordinates.lat}%2C${intel.coordinates.lon}`}
            className="w-full h-full filter invert-[0.9] hue-rotate-[180deg] brightness-[0.8] contrast-[1.2] opacity-85 group-hover/map:opacity-100 transition-all duration-300 pointer-events-none"
          />
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800/80 text-[10px] sm:text-[11px] font-mono font-extrabold text-cyan-400 shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>MAP LOCATION PREVIEW</span>
          </div>
        </div>
      </div>

      {/* Visual Coordinates Map Link */}
      <div className="mt-5 pt-3.5 border-t border-slate-800/80">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all shadow-inner group/link"
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>
              Lat {intel.coordinates.lat.toFixed(2)}, Lon {intel.coordinates.lon.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover/link:underline">
            <span>View Map</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </a>
      </div>
    </div>
  );
};

