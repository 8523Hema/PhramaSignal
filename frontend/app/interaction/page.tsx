"use client";

import { useState } from "react";
import { Search, Loader2, AlertTriangle, AlertCircle, ShieldAlert, Activity, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function InteractionChecker() {
  const [drugs, setDrugs] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const handleAddDrug = () => {
    if (drugs.length < 5) {
      setDrugs([...drugs, ""]);
    }
  };

  const handleDrugChange = (index: number, value: string) => {
    const newDrugs = [...drugs];
    newDrugs[index] = value;
    setDrugs(newDrugs);
  };

  const handleRemoveDrug = (index: number) => {
    if (drugs.length > 2) {
      const newDrugs = drugs.filter((_, i) => i !== index);
      setDrugs(newDrugs);
    }
  };

  const handleCheck = async () => {
    const filledDrugs = drugs.filter(d => d.trim().length > 0);
    if (filledDrugs.length < 2) {
      setError("Please enter at least 2 drugs to check interactions.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs: filledDrugs })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "MAJOR": return <div className="bg-red-100 text-red-700 border-2 border-red-500 rounded-xl px-6 py-2 font-black tracking-widest uppercase flex items-center gap-2 animate-pulse"><AlertTriangle /> MAJOR INTERACTION</div>;
      case "MODERATE": return <div className="bg-orange-100 text-orange-700 border-2 border-orange-400 rounded-xl px-6 py-2 font-black tracking-widest uppercase flex items-center gap-2"><AlertCircle /> MODERATE INTERACTION</div>;
      case "MINOR": return <div className="bg-amber-50 text-amber-600 border-2 border-amber-300 rounded-xl px-6 py-2 font-bold tracking-wider uppercase flex items-center gap-2"><Activity /> MINOR INTERACTION</div>;
      default: return <div className="bg-green-100 text-green-700 border-2 border-green-500 rounded-xl px-6 py-2 font-black tracking-widest uppercase flex items-center gap-2"><CheckCircle2 /> NO MAJOR INTERACTIONS</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[80vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 text-center">Drug Interaction Checker</h1>
        <p className="text-center text-slate-500 mb-10 max-w-2xl mx-auto">
          Enter 2 or more medicines to check for potential dangerous interactions, mechanism of action, and who is most at risk.
        </p>

        <div className="bg-white rounded-3xl shadow-card border border-slate-200 p-6 md:p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          
          <div className="space-y-4">
            {drugs.map((drug, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={drug}
                    onChange={(e) => handleDrugChange(index, e.target.value)}
                    placeholder={`Medicine ${index + 1} (e.g. ${index === 0 ? "Aspirin" : "Warfarin"})`}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/10 outline-none transition-all font-medium text-lg"
                  />
                </div>
                {drugs.length > 2 && (
                  <button onClick={() => handleRemoveDrug(index)} className="text-slate-400 hover:text-red-500 p-2 transition-colors shrink-0">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {drugs.length < 5 && (
              <button onClick={handleAddDrug} className="text-[#16a34a] font-bold text-sm hover:bg-green-50 px-4 py-2 rounded-lg transition-colors">
                + Add another medicine
              </button>
            )}
            
            <button
              onClick={handleCheck}
              disabled={loading}
              className="w-full sm:w-auto bg-[#16a34a] hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-full py-4 px-10 transition-transform btn-scale shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Check Interactions"}
            </button>
          </div>
          
          {error && <p className="text-red-500 mt-4 text-center font-medium bg-red-50 p-3 rounded-xl">{error}</p>}
        </div>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-8">
          <div className="flex justify-center mb-8">
            {getSeverityBadge(result.severity as string)}
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-3 border-l-4 border-[#16a34a] pl-3">Interaction Summary</h3>
            <p className="text-slate-700 leading-relaxed text-lg">{result.summary as string}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity size={20} className="text-[#16a34a]"/> What Happens in the Body</h3>
              <p className="text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">{result.mechanismExplained as string}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2"><ShieldAlert size={20}/> Specific Risks</h3>
              <ul className="space-y-3">
                {((result.risks || []) as { risk: string, description: string }[]).map((r, i) => (
                  <li key={i} className="flex gap-3 bg-red-50 p-3 rounded-xl border border-red-100">
                    <span className="text-red-500 mt-0.5">•</span>
                    <div>
                      <strong className="block text-red-900">{r.risk}</strong>
                      <span className="text-sm text-red-700">{r.description}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-orange-700 mb-4">Who is most at risk?</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-700">
                {((result.whoAtRisk || []) as string[]).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>

            <div className="bg-[#16a34a]/10 rounded-2xl shadow-card border border-[#16a34a]/20 p-6">
              <h3 className="text-xl font-bold text-[#16a34a] mb-4">What to do</h3>
              <ul className="space-y-3">
                {((result.whatToDo || []) as string[]).map((w, i) => (
                  <li key={i} className="flex items-start gap-2 bg-white p-3 rounded-xl shadow-sm text-slate-800">
                    <CheckCircle2 size={18} className="text-[#16a34a] shrink-0 mt-0.5" />
                    <span className="font-medium">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </motion.div>
      )}
    </div>
  );
}
