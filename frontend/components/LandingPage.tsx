import React from "react";
import { Search, Camera, CheckCircle2, Brain, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage({
  onSearch,
  onOpenImageScan,
  searchQuery,
  setSearchQuery
}: {
  onSearch: (q: string) => void;
  onOpenImageScan: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {

  return (
    <div className="w-full pb-20">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-slate-900 pt-32 pb-40">
        <div className="absolute inset-0 bg-gradient-to-br from-[#16a34a]/20 to-[#0ea5e9]/20 animate-pulse" style={{ animationDuration: "8s" }}></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white/90 text-sm font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm border border-white/20">
              India&apos;s Drug Safety Platform
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-6 leading-tight">
              Know Your Medicine.<br />
              <span className="text-[#16a34a]">Trust the Data.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Real patient signals. Indian brands. Your language. Get instant AI-powered safety insights before taking any drug.
            </p>

            <div className="relative max-w-2xl mx-auto flex items-center group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search size={24} className="text-slate-400 group-focus-within:text-[#16a34a] transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch(searchQuery)}
                placeholder="Enter medicine name (e.g. Paracetamol)"
                className="w-full pl-16 pr-32 py-5 rounded-full border-2 border-transparent bg-white/10 text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:border-[#16a34a] focus:ring-4 focus:ring-[#16a34a]/30 outline-none transition-all text-lg font-medium backdrop-blur-md"
              />
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  onClick={onOpenImageScan}
                  className="p-3 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors group-focus-within:text-slate-500 group-focus-within:bg-slate-100 group-focus-within:hover:text-[#16a34a] group-focus-within:hover:bg-green-50"
                  title="Scan Medicine Label"
                >
                  <Camera size={20} />
                </button>
                <button
                  onClick={() => onSearch(searchQuery)}
                  className="bg-[#16a34a] hover:bg-green-600 text-white font-bold rounded-full py-3 px-6 transition-transform hover:scale-105 shadow-lg"
                >
                  Scan
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-medium text-slate-400">
              <span className="hidden sm:inline">Try searching:</span>
              {["Metformin", "Aspirin", "Ibuprofen", "Amoxicillin"].map((drug) => (
                <button
                  key={drug}
                  onClick={() => { setSearchQuery(drug); onSearch(drug); }}
                  className="hover:text-white hover:underline transition-colors"
                >
                  {drug}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100">
            <div className="text-center px-4">
              <p className="text-3xl font-black text-slate-900 mb-1">500+</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Drugs Analyzed</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-black text-slate-900 mb-1">11</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Indian Languages</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-black text-slate-900 mb-1">100K+</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Patient Reviews</p>
            </div>
            <div className="text-center px-4">
              <p className="text-3xl font-black text-slate-900 mb-1 flex items-center justify-center gap-2">
                <CheckCircle2 className="text-[#16a34a]" /> CDSCO
              </p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Safety Alerts</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[#f9fafb]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Our AI reads thousands of real patient reviews and clinical guidelines to give you a simple, understandable safety report.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -8 }} className="bg-white rounded-3xl p-8 shadow-card border border-slate-200 text-center relative">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <Search size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Search or Scan</h3>
              <p className="text-slate-600 leading-relaxed">Type the name of any medicine or simply snap a photo of the strip using your camera.</p>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} className="bg-white rounded-3xl p-8 shadow-card border border-slate-200 text-center relative">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-3">
                <Brain size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. AI Analysis</h3>
              <p className="text-slate-600 leading-relaxed">Our system analyzes real patient experiences across the internet and checks CDSCO databases.</p>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} className="bg-white rounded-3xl p-8 shadow-card border border-slate-200 text-center relative">
              <div className="w-16 h-16 bg-[#16a34a]/10 text-[#16a34a] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                <Globe size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Get Insights</h3>
              <p className="text-slate-600 leading-relaxed">Read the safety summary in your preferred Indian language and share it directly on WhatsApp.</p>
            </motion.div>
          </div>
        </div>
      </section>

    </div>
  );
}
