import React from "react";

export interface TimelineData {
  symptom: string;
  onsetDays: number;
  peakDays: number;
  resolveDays: number;
  timeQuotes: string[];
  severity?: "mild" | "moderate" | "serious"; // I'll pass this from the main signal matching
}

export default function TimelineChart({ timeline }: { timeline: TimelineData[] }) {
  if (!timeline || timeline.length === 0) return null;

  const maxDays = 90;

  const getPosition = (days: number) => {
    return Math.min((days / maxDays) * 100, 100);
  };

  const severityColors = {
    mild: "bg-blue-500",
    moderate: "bg-orange-500",
    serious: "bg-red-500"
  };

  const lineColors = {
    mild: "bg-blue-500/30",
    moderate: "bg-orange-500/30",
    serious: "bg-red-500/30"
  };

  return (
    <div className="mt-12 bg-[#141414] rounded-lg p-6 border-t border-white/10">
      <h3 className="text-xl font-bold mb-1">When Do Side Effects Appear?</h3>
      <p className="text-sm text-gray-500 mb-6 uppercase tracking-widest">
        Based on patient-reported timing in reviews <span className="bg-gray-800 text-[10px] px-2 py-0.5 rounded text-gray-300 ml-2">AI ESTIMATED</span>
      </p>

      <div className="relative mt-8">
        {/* X-axis guide */}
        <div className="flex justify-between text-xs text-gray-500 mb-2 px-2 absolute -top-6 w-full">
          <span>Day 1</span>
          <span>Day 30</span>
          <span>Day 60</span>
          <span>Day 90+</span>
        </div>

        {/* X-axis lines */}
        <div className="absolute top-0 bottom-0 left-0 border-l border-gray-800" />
        <div className="absolute top-0 bottom-0 left-[33.33%] border-l border-gray-800 border-dashed" />
        <div className="absolute top-0 bottom-0 left-[66.66%] border-l border-gray-800 border-dashed" />
        <div className="absolute top-0 bottom-0 right-0 border-r border-gray-800" />

        <div className="flex flex-col gap-8 relative z-10 py-4">
          {timeline.map((item, idx) => {
            const onsetPos = getPosition(item.onsetDays);
            const peakPos = getPosition(item.peakDays);
            const resolvePos = getPosition(item.resolveDays);
            const width = resolvePos - onsetPos;
            const severityColor = item.severity ? severityColors[item.severity] : "bg-gray-500";
            const lineColor = item.severity ? lineColors[item.severity] : "bg-gray-500/30";

            return (
              <div key={idx} className="relative group">
                <div className="w-32 absolute -left-36 top-1/2 -translate-y-1/2 text-right">
                  <span className="text-sm font-semibold capitalize text-gray-300 block truncate">{item.symptom}</span>
                </div>

                <div className="relative h-6 w-full ml-2">
                  {/* Timeline Bar */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-full ${lineColor}`}
                    style={{ left: `${onsetPos}%`, width: `${Math.max(width, 1)}%` }}
                  />

                  {/* Onset Marker (Circle) */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${severityColor} z-10 border border-[#141414]`}
                    style={{ left: `${onsetPos}%`, transform: 'translate(-50%, -50%)' }}
                    title={`Onset: Day ${item.onsetDays}`}
                  />

                  {/* Peak Marker (Triangle) */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] z-20"
                    style={{ 
                      left: `${peakPos}%`, 
                      transform: 'translate(-50%, -50%)',
                      borderBottomColor: item.severity ? (item.severity === 'serious' ? '#ef4444' : item.severity === 'moderate' ? '#f97316' : '#3b82f6') : '#6b7280'
                    }}
                    title={`Peak: Day ${item.peakDays}`}
                  />

                  {/* Resolution Marker (Checkmark / Square) */}
                  <div 
                    className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 flex items-center justify-center bg-green-500 z-10 rounded-sm`}
                    style={{ left: `${resolvePos}%`, transform: 'translate(-50%, -50%)' }}
                    title={`Resolution: Day ${item.resolveDays}`}
                  >
                    <svg className="w-2 h-2 text-[#141414]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>

                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-900 text-xs text-gray-300 p-2 rounded shadow-xl border border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <p className="font-semibold text-white mb-1 capitalize">{item.symptom} Timeline</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {item.timeQuotes?.map((q, i) => (
                      <li key={i} className="italic">&quot;{q}&quot;</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
