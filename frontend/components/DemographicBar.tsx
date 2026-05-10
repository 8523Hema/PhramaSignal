import React from "react";

export type DemographicSplit = {
  symptom: string;
  femalePercent: number;
  malePercent: number;
  ageGroups: {
    under30: number;
    "30to50": number;
    above50: number;
  };
  insight: string;
};

export default function DemographicBar({ split }: { split: DemographicSplit }) {
  if (!split) return null;

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="uppercase tracking-widest text-xs text-gray-500 font-semibold" title="AI estimated gender breakdown based on patient reports">
          Gender Split 🤖
        </span>
        <div className="flex gap-2 text-xs">
          <span className="text-pink-400">{split.femalePercent}% F</span>
          <span className="text-blue-400">{split.malePercent}% M</span>
        </div>
      </div>
      
      <div className="w-full h-2 rounded-full flex overflow-hidden mb-4">
        <div className="bg-pink-500/80" style={{ width: `${split.femalePercent}%` }} />
        <div className="bg-blue-500/80" style={{ width: `${split.malePercent}%` }} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="uppercase tracking-widest text-xs text-gray-500 font-semibold" title="AI estimated age breakdown based on patient reports">
          Age Groups 🤖
        </span>
      </div>
      <div className="flex items-end gap-3 h-8 mb-3">
        <div className="flex flex-col items-center justify-end w-1/3">
          <div className="bg-purple-500/80 w-full rounded-t-sm" style={{ height: `${Math.max(10, split.ageGroups.under30)}%` }} />
          <span className="text-[10px] text-gray-500 mt-1">&lt;30 ({split.ageGroups.under30}%)</span>
        </div>
        <div className="flex flex-col items-center justify-end w-1/3">
          <div className="bg-purple-400/80 w-full rounded-t-sm" style={{ height: `${Math.max(10, split.ageGroups["30to50"])}%` }} />
          <span className="text-[10px] text-gray-500 mt-1">30-50 ({split.ageGroups["30to50"]}%)</span>
        </div>
        <div className="flex flex-col items-center justify-end w-1/3">
          <div className="bg-purple-300/80 w-full rounded-t-sm" style={{ height: `${Math.max(10, split.ageGroups.above50)}%` }} />
          <span className="text-[10px] text-gray-500 mt-1">&gt;50 ({split.ageGroups.above50}%)</span>
        </div>
      </div>

      <p className="text-sm text-gray-400 italic">
        &quot;{split.insight}&quot;
      </p>
    </div>
  );
}
