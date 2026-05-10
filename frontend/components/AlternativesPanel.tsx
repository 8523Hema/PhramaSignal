import React from "react";

export interface AlternativeData {
  molecule: string;
  forCondition: string;
  advantage: string;
  tradeoff: string;
  patientSentiment: "positive" | "neutral" | "negative";
  indianBrands: string[];
  suitableFor: string;
}

export default function AlternativesPanel({ alternatives }: { alternatives: AlternativeData[] }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="mt-12 pt-12 border-t border-white/10">
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
          Potentially Better Tolerated Alternatives
          <span className="bg-gray-800 text-[10px] px-2 py-0.5 rounded text-gray-300 align-middle">AI SUGGESTED</span>
        </h3>
        <p className="text-sm text-gray-500 uppercase tracking-widest">
          Based on comparative patient reports — discuss with your doctor
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alternatives.map((alt, idx) => (
          <div key={idx} className="bg-[#141414] border border-gray-800 rounded-xl p-6 relative overflow-hidden">
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="text-2xl font-bold text-white mb-2">{alt.molecule}</h4>
                <div className="flex flex-wrap gap-2">
                  {alt.indianBrands?.map((brand, i) => (
                    <span key={i} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded p-3 text-sm">
                <div className="flex gap-2 items-start text-green-400">
                  <span className="mt-0.5">👍</span>
                  <div>
                    <strong className="block mb-0.5">Patient Advantage</strong>
                    <span>{alt.advantage}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3 text-sm">
                <div className="flex gap-2 items-start text-orange-400">
                  <span className="mt-0.5">⚖️</span>
                  <div>
                    <strong className="block mb-0.5">Clinical Tradeoff</strong>
                    <span>{alt.tradeoff}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 border-t border-gray-800 pt-4">
                <span className="text-xs text-gray-500 font-semibold uppercase">Suitable for:</span>
                <span className="text-sm text-[#00b5a5]">{alt.suitableFor}</span>
              </div>
              
              {/* Sentiment Meter */}
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Patient Positivity</span>
                  <span className="capitalize text-gray-300">{alt.patientSentiment}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
                  <div className={`h-full ${alt.patientSentiment === 'positive' ? 'w-4/5 bg-green-500' : alt.patientSentiment === 'neutral' ? 'w-1/2 bg-yellow-500' : 'w-1/4 bg-red-500'}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="mt-6 text-xs text-gray-500 italic border-l-2 border-gray-700 pl-3">
        Disclaimer: This is not medical advice. These alternatives are generated based on aggregated patient symptom reports. Always consult your doctor before changing or stopping any medication.
      </p>
    </div>
  );
}
