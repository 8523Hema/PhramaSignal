"use client";

import React, { useEffect, useState } from "react";

interface SentimentBarProps {
  positive: number;
  negative: number;
  neutral: number;
}

export default function SentimentBar({ positive, negative, neutral }: SentimentBarProps) {
  const [width, setWidth] = useState({ pos: 0, neg: 0, neu: 0 });

  useEffect(() => {
    // Animate on mount
    const timer = setTimeout(() => {
      setWidth({ pos: positive, neg: negative, neu: neutral });
    }, 100);
    return () => clearTimeout(timer);
  }, [positive, negative, neutral]);

  return (
    <div className="w-full">
      <div className="flex h-6 w-full rounded-full overflow-hidden bg-slate-100 shadow-inner">
        <div 
          className="bg-[#16a34a] h-full transition-all duration-1000 ease-out"
          style={{ width: `${width.pos}%` }}
          title={`${positive}% Positive`}
        />
        <div 
          className="bg-slate-300 h-full transition-all duration-1000 ease-out"
          style={{ width: `${width.neu}%` }}
          title={`${neutral}% Neutral`}
        />
        <div 
          className="bg-[#dc2626] h-full transition-all duration-1000 ease-out"
          style={{ width: `${width.neg}%` }}
          title={`${negative}% Negative`}
        />
      </div>
      <div className="flex justify-between text-xs font-semibold mt-2">
        <span className="text-[#16a34a]">{positive}% Positive</span>
        <span className="text-slate-500">{neutral}% Neutral</span>
        <span className="text-[#dc2626]">{negative}% Negative</span>
      </div>
    </div>
  );
}
