"use client";

import { useState } from "react";

interface InteractionCombination {
  drug1: string;
  drug2: string;
  effect: string;
  patientReports: number;
  mechanism: string;
  severity: "mild" | "moderate" | "severe";
  recommendation: string;
  sampleQuote: string;
}

interface InteractionResult {
  interactionLevel: "none" | "mild" | "moderate" | "severe";
  interactionColor: string;
  combinations: InteractionCombination[];
  safetySummary: string;
  doctorAdvice: string;
}

export default function InteractionsPage() {
  const [drugs, setDrugs] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [error, setError] = useState("");

  const handleScan = async () => {
    const validDrugs = drugs.filter(d => d.trim().length > 0);
    if (validDrugs.length < 2) {
      setError("Please enter at least 2 drugs to check interactions.");
      return;
    }
    
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugs: validDrugs })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze interactions.");
    } finally {
      setLoading(false);
    }
  };

  const updateDrug = (index: number, value: string) => {
    const newDrugs = [...drugs];
    newDrugs[index] = value;
    setDrugs(newDrugs);
  };

  return (
    <main className="max-w-4xl mx-auto p-6 md:p-12 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
          Drug Interaction Scanner
        </h1>
        <p className="text-lg text-gray-400">
          Check real patient reports and pharmacological data for dangerous combinations.
        </p>
      </div>

      <div className="bg-[#141414] border border-gray-800 rounded-2xl p-6 md:p-8 mb-12">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Drug 1 (Required)</label>
            <input 
              type="text" 
              placeholder="e.g. Metformin" 
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#00b5a5]"
              value={drugs[0]}
              onChange={(e) => updateDrug(0, e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center pt-8 text-gray-600 font-bold hidden md:block">+</div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Drug 2 (Required)</label>
            <input 
              type="text" 
              placeholder="e.g. Alcohol" 
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#00b5a5]"
              value={drugs[1]}
              onChange={(e) => updateDrug(1, e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center pt-8 text-gray-600 font-bold hidden md:block">+</div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Drug 3 (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. Lisinopril" 
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-[#00b5a5]"
              value={drugs[2]}
              onChange={(e) => updateDrug(2, e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <div className="text-center">
          <button 
            onClick={handleScan}
            disabled={loading}
            className="bg-[#00b5a5] hover:bg-[#009b8e] text-black font-bold rounded-full py-3 px-10 transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing Interactions..." : "Check Interactions"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00b5a5]"></div>
        </div>
      )}

      {result && (
        <div className="animate-in slide-in-from-bottom-8 duration-700">
          <div 
            className="rounded-xl p-8 mb-8 text-center"
            style={{ backgroundColor: `${result.interactionColor}20`, border: `2px solid ${result.interactionColor}` }}
          >
            <h2 
              className="text-4xl font-extrabold uppercase tracking-wider mb-3"
              style={{ color: result.interactionColor }}
            >
              {result.interactionLevel === 'none' ? 'SAFE' : result.interactionLevel === 'severe' ? 'DANGEROUS' : 'CAUTION'}
            </h2>
            <p className="text-xl text-white font-medium">{result.safetySummary}</p>
          </div>

          <h3 className="text-2xl font-bold mb-6">Interaction Details</h3>
          <div className="grid grid-cols-1 gap-6 mb-8">
            {result.combinations?.map((combo, idx) => (
              <div key={idx} className="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full ${combo.severity === 'severe' ? 'bg-red-500' : combo.severity === 'moderate' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                <div className="pl-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-white">
                      {combo.drug1} <span className="text-gray-500 mx-2">+</span> {combo.drug2}
                    </h4>
                    <span className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                      {combo.patientReports} patient reports
                    </span>
                  </div>

                  <p className="text-lg text-gray-200 mb-4">{combo.effect}</p>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#0a0a0a] p-4 rounded-lg">
                      <span className="text-xs uppercase text-gray-500 font-bold block mb-1">Mechanism</span>
                      <p className="text-sm text-gray-300">{combo.mechanism}</p>
                    </div>
                    <div className="bg-[#0a0a0a] p-4 rounded-lg">
                      <span className="text-xs uppercase text-gray-500 font-bold block mb-1">Recommendation</span>
                      <p className="text-sm font-medium" style={{ color: combo.severity === 'severe' ? '#ef4444' : combo.severity === 'moderate' ? '#f97316' : '#3b82f6' }}>
                        {combo.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/40 p-4 rounded border-l-2 border-gray-600">
                    <span className="text-xs uppercase text-gray-500 font-bold block mb-1">Patient Voice</span>
                    <p className="text-sm text-gray-300 italic">&quot;{combo.sampleQuote}&quot;</p>
                  </div>
                </div>
              </div>
            ))}
            
            {(!result.combinations || result.combinations.length === 0) && (
              <div className="bg-[#141414] p-8 text-center rounded-xl text-gray-400">
                No significant interactions found between these drugs in patient reports or clinical databases.
              </div>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 flex gap-4 items-start">
            <span className="text-3xl">👨‍⚕️</span>
            <div>
              <h4 className="font-bold text-blue-400 text-lg mb-1">What to tell your doctor</h4>
              <p className="text-blue-100">{result.doctorAdvice}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
