import React from "react";

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="w-full max-w-[1240px] mx-auto my-8 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-2 w-full md:w-1/2">
          <div className="h-8 w-48 bg-slate-800 rounded-lg" />
          <div className="h-4 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-slate-800 rounded-xl" />
          <div className="h-10 w-24 bg-slate-800 rounded-xl" />
          <div className="h-10 w-24 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 bg-slate-800 rounded" />
              <div className="h-5 w-12 bg-slate-800/80 rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-slate-800/50 rounded" />
              <div className="h-3 w-3/4 bg-slate-800/50 rounded" />
              <div className="h-3 w-5/6 bg-slate-800/50 rounded" />
            </div>
            <div className="h-20 w-full bg-slate-800/40 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};
