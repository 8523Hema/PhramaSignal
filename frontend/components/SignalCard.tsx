"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SignalCardProps {
  symptom: string;
  mentionCount: number;
  percentage: number;
  severity: string;
  inOfficialLabel: boolean;
  onset?: string;
  duration?: string;
  ageGroupMostAffected?: string;
  trend?: string;
  sources?: string[];
  sampleQuotes?: string[];
  recommendation?: string;
}

export default function SignalCard(props: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getSeverityColor = (sev: string) => {
    const s = sev.toLowerCase();
    if (s.includes("severe") || s.includes("high") || s.includes("danger")) return "border-red-500 bg-red-50 text-red-700";
    if (s.includes("moderate") || s.includes("medium")) return "border-amber-500 bg-amber-50 text-amber-700";
    return "border-green-500 bg-green-50 text-green-700";
  };
  
  const getSeverityBorderOnly = (sev: string) => {
    const s = sev.toLowerCase();
    if (s.includes("severe") || s.includes("high") || s.includes("danger")) return "border-red-500";
    if (s.includes("moderate") || s.includes("medium")) return "border-amber-500";
    return "border-green-500";
  };
  
  const colorClass = getSeverityColor(props.severity || "");
  const borderClass = getSeverityBorderOnly(props.severity || "");
  
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl shadow-sm border-t-4 border-l border-r border-b border-slate-200 transition-colors cursor-pointer overflow-hidden ${expanded ? borderClass : "hover:border-slate-300"}`}
      style={{ borderTopColor: borderClass.replace("border-", "var(--") + ")" }} 
      onClick={() => setExpanded(!expanded)}
    >
      <div className={`h-[3px] w-full ${colorClass.split(" ")[0].replace("border-", "bg-")}`} />
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-lg font-bold text-slate-900 capitalize">{props.symptom}</h4>
          <div className="flex gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colorClass.replace("border-", "border border-")}`}>
              {props.severity}
            </span>
            {props.inOfficialLabel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                Official
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Frequency in reviews</span>
            <span>{props.percentage || Math.round((props.mentionCount / 100) * 100) || "RARE"}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
            {(props.percentage || Math.round((props.mentionCount / 100) * 100) || 0) > 0 ? (
              <motion.div 
                className={`h-full rounded-full ${colorClass.split(" ")[0].replace("border-", "bg-")}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${props.percentage || Math.round((props.mentionCount / 100) * 100) || 0}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ) : (
              <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Rare</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-600 mb-4">
          <div>
            <span className="block text-xs font-semibold text-slate-400">Onset</span>
            {props.onset || "Varies"}
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400">Duration</span>
            {props.duration || "Varies"}
          </div>
          <div className="col-span-2">
            <span className="block text-xs font-semibold text-slate-400">Most Affected</span>
            {props.ageGroupMostAffected || "All ages"}
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-100 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800 mt-auto">
          <Info size={16} className="shrink-0 mt-0.5 text-blue-500" />
          <p>{props.recommendation || `Monitor for signs of ${props.symptom.toLowerCase()} and consult doctor if persistent.`}</p>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50 p-5 overflow-hidden"
          >
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">How to Manage</span>
                <p className="text-sm text-slate-700">{props.recommendation || "Take with food to minimize effects. Stay hydrated."}</p>
              </div>
              
              {props.sampleQuotes && props.sampleQuotes.length > 0 && (
                <div>
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Quotes</span>
                  <p className="text-sm italic text-slate-600 border-l-2 border-slate-300 pl-3">
                    &quot;{props.sampleQuotes[0]}&quot;
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div 
        className="text-center py-2 border-t border-slate-100 text-xs font-bold text-[#0ea5e9] hover:bg-slate-50 transition-colors"
      >
        {expanded ? "Show less" : "Show more"}
      </div>
    </motion.div>
  );
}
