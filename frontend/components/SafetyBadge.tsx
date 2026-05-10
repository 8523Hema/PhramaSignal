import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from "lucide-react";

export type SafetyLevel = "safe" | "caution" | "warning" | "danger" | string;

export default function SafetyBadge({ level, label }: { level: SafetyLevel; label?: string }) {
  let style = "bg-slate-100 text-slate-700 border-slate-200";
  let Icon = AlertCircle;
  const text = label || level;

  switch (level.toLowerCase()) {
    case "safe":
    case "generally safe":
      style = "bg-green-100 text-green-700 border-green-200";
      Icon = CheckCircle2;
      break;
    case "caution":
    case "use with caution":
      style = "bg-yellow-100 text-yellow-700 border-yellow-200";
      Icon = AlertCircle;
      break;
    case "warning":
    case "serious risks":
      style = "bg-orange-100 text-orange-700 border-orange-200";
      Icon = AlertTriangle;
      break;
    case "danger":
    case "dangerous":
    case "absolute":
    case "absolute contraindication":
      style = "bg-red-100 text-red-700 border-red-200";
      Icon = XCircle;
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${style}`}>
      <Icon size={12} />
      {text}
    </span>
  );
}
