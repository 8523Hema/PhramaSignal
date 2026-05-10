import React from "react";

export type SourceType = "scrape" | "crawl" | "search" | "agentic" | "session";

export default function SourceBadge({ sourceName, sourceType }: { sourceName: string, sourceType?: SourceType | string }) {
  let badgeClass = "bg-gray-800 text-gray-300";
  let label = "Scraped";
  let icon = "";

  if (sourceType === "crawl") {
    badgeClass = "bg-blue-900/50 text-blue-300 border border-blue-800";
    label = "Deep Crawl";
  } else if (sourceType === "search") {
    badgeClass = "bg-purple-900/50 text-purple-300 border border-purple-800";
    label = "Web Search";
  } else if (sourceType === "agentic") {
    badgeClass = "bg-yellow-900/50 text-yellow-300 border border-yellow-800";
    label = "AI Research";
    icon = "✨ ";
  } else if (sourceType === "session") {
    badgeClass = "bg-green-900/50 text-green-300 border border-green-800";
    label = "Authenticated";
  } else {
    badgeClass = "bg-gray-800 text-gray-300";
    label = "Scraped";
  }

  return (
    <div className="flex items-center gap-1.5" title={sourceName}>
      <span className="text-xs text-gray-400 max-w-[100px] truncate">{sourceName}</span>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${badgeClass}`}>
        {icon}{label}
      </span>
    </div>
  );
}
