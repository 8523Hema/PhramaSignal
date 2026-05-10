"use client";

import { useState, useEffect, useRef } from "react";
import SignalCard, { SignalCardProps } from "@/components/SignalCard";
import SafetyBadge from "@/components/SafetyBadge";
import WhatsAppCard, { WhatsAppData } from "@/components/WhatsAppCard";
import BrandRecommendations, { BrandRecommendation } from "@/components/BrandRecommendations";
import {
  AlertTriangle, CheckCircle2, Shield, User, Users, Info,
  Search, Camera, Quote, Share2, ArrowUp, XCircle, ThumbsUp, ThumbsDown, ChevronRight, Pill, ArrowRight
} from "lucide-react";
import LandingPage from "@/components/LandingPage";
import CameraModal from "@/components/CameraModal";
import { SkeletonResults } from "@/components/SkeletonCard";
import { motion, AnimatePresence, useInView } from "framer-motion";
import confetti from "canvas-confetti";

interface ScanResult {
  drugName: string;
  searchedAs: string;
  dataSource?: string;
  scrapedChars?: number;
  dataFound: boolean;
  drugProfile: {
    drugClass: string;
    mechanism: string;
    activeIngredients: string[];
    commonBrandsIndia: string[];
    commonBrandsGlobal: string[];
    usedFor: string[];
    prescriptionRequired: boolean;
    formulations: string[];
  };
  whoCanTake: {
    adults: { suitable: boolean; notes: string };
    elderly: { suitable: boolean; caution?: boolean; notes: string };
    children: { suitable: boolean; minimumAge?: number; notes: string };
    pregnant: { suitable: boolean; notes: string };
    breastfeeding: { suitable: boolean; notes: string };
  };
  whoShouldNOTTake: Array<{
    condition: string;
    reason: string;
    severity: string;
  }>;
  safetyVerdict: {
    overallSafety: string;
    safetyScore: number;
    needsDoctorConsultation: boolean;
    consultationUrgency: string;
    verdictSummary: string;
    positiveNegativeRatio: string;
  };
  sentimentAnalysis: {
    overallPositive: number;
    overallNegative: number;
    neutral: number;
    totalReviewsAnalyzed: number;
    sourcesContributing: string[];
  };
  recommendation?: {
    state: "SAFE" | "CAUTION" | "AVOID";
    safePercent: number;
    cautionPercent: number;
    avoidPercent: number;
    reasons: string[];
    whoShouldConsult: string[];
    summaryLine: string;
    quickFacts: string[];
  };
  sideEffects: SignalCardProps[];
  unusualSignals: Array<{
    symptom: string;
    mentionCount: number;
    notInOfficialLabel: boolean;
    concernLevel: string;
    patientQuote: string;
    recommendation: string;
  }>;
  ageGroups?: Array<{
    group: string;
    label: string;
    verdict: string;
    summary: string;
    topSideEffect: string;
    positivePercent: number;
    reviewCount: number;
    dataSource: string;
  }>;
  drugComponents: Array<{
    component: string;
    role: string;
    commonAllergyRisk: boolean;
  }>;
  alternatives: Array<{
    molecule: string;
    reason: string;
    bestFor: string;
    indianBrands: string[];
    tradeoff: string;
  }>;
  brandRecommendations?: BrandRecommendation[];
  patientSummary?: string;
  reviewCards?: Array<{
    sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";
    ageGroup: string;
    condition: string;
    quote: string;
    effectivenessScore: number;
    sideEffectScore: number;
    isClinicialEstimate: boolean;
  }>;
  summaryPositiveExperiences?: string[];
  negativeExperiences?: string[];
  mostMentionedSideEffect?: string;
  mostPraisedBenefit?: string;
  cdscoAlerts: string[];
  doctorConsult: string[];
  whatsappCard: WhatsAppData;
  dataQuality: {
    totalSourcesScraped: number;
    sourcesWithData: number;
    dataConfidence: "high" | "medium" | "low";
    caveat: string;
  };
}

// ----------------------------------------------------
// Animated SVG Score Circle
// ----------------------------------------------------
function AnimatedScoreCircle({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let current = 0;
      const interval = setInterval(() => {
        if (current >= score) {
          clearInterval(interval);
        } else {
          current += Math.ceil((score - current) / 10) || 1;
          setDisplayScore(Math.min(current, score));
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isInView, score]);

  const getColor = (s: number) => {
    if (s >= 80) return "#16a34a"; // green
    if (s >= 60) return "#f59e0b"; // amber
    if (s >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  const color = getColor(score);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div ref={ref} className="relative w-32 h-32 flex flex-col items-center justify-center shrink-0">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <motion.circle 
          cx="50" cy="50" r="40" 
          fill="none" 
          stroke={color} 
          strokeWidth="8" 
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl font-black">{displayScore}</span>
      </div>
      <span className="absolute -bottom-6 text-white text-[10px] font-bold tracking-wider uppercase opacity-80 whitespace-nowrap">Safety Score</span>
    </div>
  );
}

// ----------------------------------------------------
// typing animation component
// ----------------------------------------------------
function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayed}</span>;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// ----------------------------------------------------
// Main Page Component
// ----------------------------------------------------
export default function Home() {
  const [query, setQuery] = useState("");
  const [appState, setAppState] = useState<"IDLE" | "LOADING" | "ERROR" | "RESULTS">("IDLE");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Confetti effect when results render with high score
  useEffect(() => {
    if (appState === "RESULTS" && result && result.safetyVerdict?.safetyScore >= 80) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#16a34a', '#22c55e', '#4ade80', '#ffffff']
        });
      }, 500);
    }
  }, [appState, result]);

  const handleScan = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setAppState("LOADING");
    setResult(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drugName: searchQuery }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        if (retryCount < 1) {
          setRetryCount(prev => prev + 1);
          console.log("Retrying scan automatically...");
          handleScan(searchQuery);
          return;
        }
        setErrorMessage(data.error || "Internal Server Error");
        setAppState("ERROR");
        return;
      }
      
      setRetryCount(0); // reset on success
      setResult(data);
      setAppState("RESULTS");
    } catch (err: unknown) {
      console.error(err);
      if (retryCount < 1) {
        setRetryCount(prev => prev + 1);
        handleScan(searchQuery);
        return;
      }
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
      setAppState("ERROR");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const getSentimentColors = (sentiment: string) => {
    if (sentiment === "POSITIVE") return "bg-[#dcfce7] text-[#16a34a]";
    if (sentiment === "NEGATIVE") return "bg-[#fee2e2] text-[#dc2626]";
    if (sentiment === "MIXED") return "bg-[#fef3c7] text-[#d97706]";
    return "bg-[#f3f4f6] text-[#6b7280]";
  };

  const getAvatarColor = (sentiment: string) => {
    if (sentiment === "POSITIVE") return "bg-[#16a34a]";
    if (sentiment === "NEGATIVE") return "bg-[#dc2626]";
    if (sentiment === "MIXED") return "bg-[#d97706]";
    return "bg-[#6b7280]";
  };

  return (
    <div className="w-full relative pb-20">
      
      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onExtracted={(extractedName) => {
          setQuery(extractedName);
          handleScan(extractedName);
        }}
      />

      <div className={`${appState === "IDLE" ? "" : "max-w-[1100px] mx-auto px-4 py-8"}`}>
        {appState === "IDLE" && (
          <LandingPage 
            searchQuery={query}
            setSearchQuery={setQuery}
            onSearch={handleScan}
            onOpenImageScan={() => setIsCameraOpen(true)}
          />
        )}

        {appState !== "IDLE" && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 sticky top-4 z-40"
          >
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan(query)}
                placeholder="Search another medicine..."
                className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 focus:border-[#16a34a] outline-none"
              />
              <button onClick={() => setIsCameraOpen(true)} className="p-2 text-slate-400 hover:text-[#16a34a] bg-slate-100 rounded-lg shrink-0 btn-scale">
                <Camera size={18} />
              </button>
              <button onClick={() => handleScan(query)} className="bg-[#16a34a] text-white p-2 rounded-lg shrink-0 btn-scale">
                <Search size={18} />
              </button>
            </div>
            {appState === "LOADING" && (
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-[#16a34a] uppercase tracking-wider mb-1">Scanning Patient Data</div>
                <div className="w-32 h-1.5 bg-green-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#16a34a] rounded-full"
                    animate={{ width: ["0%", "100%", "0%"], x: ["0%", "0%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {appState === "LOADING" && <SkeletonResults />}

        {appState === "ERROR" && (
          <div className="flex flex-col items-center justify-center mt-20 text-center animate-in fade-in duration-500">
            <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md shadow-card">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-amber-600" />
              </div>
              <p className="text-slate-800 font-semibold text-lg mb-2">{errorMessage || "Something went wrong"}</p>
              <p className="text-slate-500 text-sm mb-6">
                Please check your network and API keys, or try a different drug name.
              </p>
              <button
                onClick={() => handleScan(query)}
                className="bg-[#16a34a] hover:bg-green-700 text-white font-bold px-8 py-3 rounded-xl transition-colors btn-scale"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {appState === "RESULTS" && result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-10">
            
            {/* Sourced Data Banners */}
            {(result.dataSource === "medical_knowledge" || result.dataQuality?.dataConfidence === "low" || result.sentimentAnalysis?.totalReviewsAnalyzed === 0) && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex gap-3 shadow-sm">
                <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-800">Using medical knowledge base</p>
                  <p className="text-blue-700 text-sm">Limited patient review data found online. Information is based on established clinical knowledge.</p>
                </div>
              </motion.div>
            )}

            {/* IDENTITY CARD */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8 hover-lift">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 capitalize flex items-center gap-3">
                    <TypewriterText text={result.drugName} />
                  </h2>
                  <p className="text-xl text-slate-600 mt-2 font-medium">
                    {result.drugProfile?.drugClass || ""}{result.drugProfile?.mechanism ? ` • ${result.drugProfile.mechanism}` : ""}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="relative p-3 bg-slate-100 rounded-full text-slate-500 hover:text-[#0ea5e9] hover:bg-blue-50 transition-colors btn-scale"
                >
                  <Share2 size={20} />
                  <AnimatePresence>
                    {copied && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.8 }} 
                        animate={{ opacity: 1, y: -30, scale: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none"
                      >
                        Copied!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {(result.drugProfile?.formulations || []).map(f => (
                  <span key={f} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-semibold capitalize">{f}</span>
                ))}
                {result.drugProfile?.prescriptionRequired && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border border-red-200">Prescription Only</span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Used For</h4>
                  <div className="flex flex-wrap gap-2">
                    {(result.drugProfile?.usedFor || []).map(u => (
                      <span key={u} className="bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-semibold capitalize">{u}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Indian Brands</h4>
                  <div className="flex flex-wrap gap-2">
                    {(result.drugProfile?.commonBrandsIndia || []).map(b => (
                      <span key={b} className="bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 px-3 py-1.5 rounded-lg text-sm font-bold capitalize">{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SAFETY VERDICT SECTION */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-2xl shadow-xl overflow-hidden bg-[#111827] text-white flex flex-col md:flex-row relative"
            >
              {/* Background gradient subtle glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#16a34a]/20 to-transparent pointer-events-none" />
              
              <div className="flex-1 p-6 md:p-10 relative z-10 flex flex-col justify-center">
                <span className="text-[11px] font-bold tracking-[2px] opacity-70 mb-4 uppercase">Overall Safety Verdict</span>
                <h3 className="text-2xl md:text-3xl font-black mb-6">
                  {result.safetyVerdict?.overallSafety === "dangerous" && <AlertTriangle size={24} className="inline mr-2 text-red-500" />}
                  {result.safetyVerdict?.verdictSummary || "Analysis complete."}
                </h3>
                
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">{result.safetyVerdict?.positiveNegativeRatio || "Mixed signals"}</span>
                  <span className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-lg text-sm font-bold">Consult: {result.safetyVerdict?.consultationUrgency || "As needed"}</span>
                </div>

                {/* Animated progress bar for sentiment */}
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: `${result.sentimentAnalysis?.overallPositive || 50}%` }} 
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[#16a34a]"
                  />
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: `${result.sentimentAnalysis?.overallNegative || 50}%` }} 
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-[#ef4444] ml-auto"
                  />
                </div>
                
                <div className="mt-8 text-xs font-semibold opacity-60 flex gap-4">
                  <span>Based on: drugs.com · webmd · clinical data</span>
                </div>
              </div>

              <div className="w-full md:w-[30%] bg-black/30 p-8 md:p-10 flex flex-col items-center justify-center relative z-10 border-t md:border-t-0 md:border-l border-white/10">
                <AnimatedScoreCircle score={result.safetyVerdict?.safetyScore || 0} />
              </div>
            </motion.div>

            {/* SHOULD YOU TAKE THIS? */}
            {result.recommendation && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="space-y-6">
                <div className={`p-6 md:p-8 rounded-2xl shadow-card border-l-[6px] ${result.recommendation.state === "SAFE" ? "border-l-[#16a34a] bg-white" : result.recommendation.state === "CAUTION" ? "border-l-[#f59e0b] bg-white" : "border-l-[#ef4444] bg-[#fff5f5]"}`}>
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className={`flex items-center gap-3 mb-2 ${result.recommendation.state === "SAFE" ? "text-[#16a34a]" : result.recommendation.state === "CAUTION" ? "text-[#d97706]" : "text-[#dc2626]"}`}>
                        {result.recommendation.state === "SAFE" ? <CheckCircle2 size={24} /> : result.recommendation.state === "CAUTION" ? <AlertTriangle size={24} /> : <XCircle size={24} />}
                        <h2 className="text-2xl font-bold">{result.recommendation.summaryLine}</h2>
                      </div>
                      <p className="text-slate-600 mb-6 font-medium">
                        {result.recommendation.state === "SAFE" ? "for most healthy adults" : result.recommendation.state === "CAUTION" ? "consult your doctor before use" : "avoid without strict medical supervision"}
                      </p>

                      <div className="mb-6 flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-700 whitespace-nowrap">Safety Score: {result.safetyVerdict?.safetyScore || 0}/100</span>
                        <div className="w-full max-w-[200px] h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            whileInView={{ width: `${result.safetyVerdict?.safetyScore || 0}%` }} 
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full ${result.recommendation.state === "SAFE" ? "bg-[#16a34a]" : result.recommendation.state === "CAUTION" ? "bg-[#f59e0b]" : "bg-[#ef4444]"}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {(result.recommendation.reasons || []).map((reason, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {result.recommendation?.state === "AVOID" || reason.toLowerCase().includes("not") || reason.toLowerCase().includes("interact") 
                              ? <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                              : result.recommendation?.state === "CAUTION" && (reason.toLowerCase().includes("may") || reason.toLowerCase().includes("caution"))
                              ? <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                              : <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                            }
                            <span className="text-slate-700 font-medium">{reason}</span>
                          </div>
                        ))}
                      </div>

                      {(result.recommendation.whoShouldConsult || []).length > 0 && result.recommendation.state !== "SAFE" && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
                          <h4 className="font-bold text-slate-900 mb-2">Who should consult doctor first:</h4>
                          <ul className="space-y-2">
                            {(result.recommendation.whoShouldConsult || []).map((who, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> {who}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.recommendation.state !== "SAFE" && (
                    <div className="mt-4 pt-4 border-t border-slate-100/50 text-center">
                      <a href="https://www.practo.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-6 py-2.5 rounded-xl transition-colors btn-scale">
                        {result.recommendation.state === "AVOID" ? "Find a Doctor Near You" : "Book Doctor Consultation"} <ChevronRight size={18} />
                      </a>
                    </div>
                  )}
                </div>

                {/* Percentage Breakdown */}
                <div className="px-4">
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 px-1">
                    <span>TAKE FREELY</span>
                    <span>USE CAUTIOUSLY</span>
                    <span>AVOID</span>
                  </div>
                  <div className="w-full h-4 rounded-full flex overflow-hidden bg-slate-100 gap-0.5">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${result.recommendation.safePercent}%` }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="h-full bg-[#16a34a] relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">{result.recommendation.safePercent}% Safe</div>
                    </motion.div>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${result.recommendation.cautionPercent}%` }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="h-full bg-[#f59e0b] relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">{result.recommendation.cautionPercent}% Caution</div>
                    </motion.div>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: `${result.recommendation.avoidPercent}%` }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full bg-[#ef4444] relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap">{result.recommendation.avoidPercent}% Avoid</div>
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 px-1">
                    <span>{result.recommendation.safePercent}%</span>
                    <span>{result.recommendation.cautionPercent}%</span>
                    <span>{result.recommendation.avoidPercent}%</span>
                  </div>
                </div>

                {/* Quick Verdict Chips */}
                {(result.recommendation.quickFacts || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(result.recommendation.quickFacts || []).map((fact, i) => {
                      const isWarn = fact.toLowerCase().includes("caution") || fact.toLowerCase().includes("warning");
                      const isDanger = fact.toLowerCase().includes("avoid") || fact.toLowerCase().includes("not safe");
                      const chipColor = isDanger ? "bg-red-50 text-red-700 border-red-200" : isWarn ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-50 text-green-700 border-green-200";
                      const Icon = isDanger ? XCircle : isWarn ? AlertTriangle : CheckCircle2;
                      return (
                        <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${chipColor}`}>
                          <Icon size={12} /> {fact}
                        </span>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* WHAT PATIENTS ARE ACTUALLY SAYING */}
            <motion.div 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }} 
              variants={staggerContainer}
              className="space-y-6"
            >
              <h3 className="section-heading mb-6 flex items-center gap-2">
                <Quote size={20} className="text-[#16a34a]" /> What Patients Are Actually Saying
              </h3>

              {/* PART A: Top Summary Card */}
              <motion.div variants={cardVariant} className="bg-[#f0fdf4] rounded-2xl p-6 md:p-8 shadow-sm border border-green-100 relative overflow-hidden hover-lift">
                <Quote size={120} className="absolute -top-4 -left-4 text-green-500 opacity-[0.03] rotate-180 pointer-events-none" />
                <p className="text-lg md:text-xl text-green-900 font-medium leading-relaxed mb-6 relative z-10">
                  &quot;{result.patientSummary || "Patients generally report varying degrees of efficacy and tolerability."}&quot;
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`w-3 h-3 rounded-full ${i <= Math.round(((result.sentimentAnalysis?.overallPositive || 0) / 100) * 5) ? "bg-green-500" : "bg-green-200"}`} />
                    ))}
                  </div>
                  <span className="ml-2">Based on {result.sentimentAnalysis?.totalReviewsAnalyzed || 0} reviews</span>
                </div>
              </motion.div>

              {/* PART C: Sentiment Breakdown Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={cardVariant} className="bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] p-6 shadow-sm hover-lift flex flex-col">
                  <h4 className="flex items-center gap-2 text-[13px] uppercase tracking-widest font-black text-green-700 mb-4 border-b border-green-200 pb-3">
                    <ThumbsUp size={16} /> What People Love
                  </h4>
                  <ul className="space-y-4 mb-6 flex-1">
                    {((result.summaryPositiveExperiences?.length ? result.summaryPositiveExperiences : null) || ["Fast relief", "Easy to take", "Widely available"]).map((exp, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                        <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                        {exp}
                      </motion.li>
                    ))}
                  </ul>
                  <p className="text-[11px] italic text-slate-400 mt-auto">Based on patient reviews from drugs.com · webmd</p>
                </motion.div>
                
                <motion.div variants={cardVariant} className="bg-[#fff5f5] rounded-2xl border border-[#fecaca] p-6 shadow-sm hover-lift flex flex-col">
                  <h4 className="flex items-center gap-2 text-[13px] uppercase tracking-widest font-black text-red-700 mb-4 border-b border-red-200 pb-3">
                    <ThumbsDown size={16} /> Common Complaints
                  </h4>
                  <ul className="space-y-4 mb-6 flex-1">
                    {((result.negativeExperiences?.length ? result.negativeExperiences : null) || ["Nausea", "Drowsiness", "Upset stomach"]).map((exp, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                        <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                        {exp}
                      </motion.li>
                    ))}
                  </ul>
                  <p className="text-[11px] italic text-slate-400 mt-auto">Based on patient reviews from drugs.com · webmd</p>
                </motion.div>
              </div>

              {/* PART B: Voice Cards */}
              {(result.reviewCards && result.reviewCards.length > 0) && (
                <>
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-8 mb-4">Top Patient Experiences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {result.reviewCards.map((vc, i) => (
                      <motion.div 
                        key={i} 
                        variants={cardVariant} 
                        whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }} 
                        className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all group flex flex-col hover:border-${getSentimentColors(vc.sentiment).match(/text-\[([^\]]+)\]/)?.[1]?.replace('#','')}`}
                        style={{ borderBottomWidth: '3px' }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(vc.sentiment)}`}>
                              {vc.sentiment.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">Anonymous Patient</p>
                              <p className="text-xs text-slate-400">Age: {vc.ageGroup} · {vc.condition}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${getSentimentColors(vc.sentiment)}`}>
                            {vc.sentiment}
                          </span>
                        </div>
                        <p className="text-sm text-[#374151] mb-6 italic leading-[1.6] flex-1">&quot;{vc.quote}&quot;</p>
                        
                        <div className="space-y-3 mt-auto border-t border-slate-100 pt-4">
                          {/* Effectiveness Bar */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-semibold text-slate-500">Effectiveness</span>
                              <span className="font-bold text-slate-700">{vc.effectivenessScore}/10</span>
                            </div>
                            <div className="w-full h-[6px] rounded-[3px] bg-[#e5e7eb] overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                whileInView={{ width: `${(vc.effectivenessScore / 10) * 100}%` }} 
                                viewport={{ once: true }} 
                                transition={{ duration: 0.6, ease: "easeOut" }} 
                                className="h-full bg-[#16a34a] rounded-[3px]" 
                              />
                            </div>
                          </div>
                          {/* Side Effects Bar */}
                          <div>
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span className="font-semibold text-slate-500">Side Effects</span>
                              <span className="font-bold text-slate-700">{vc.sideEffectScore}/10</span>
                            </div>
                            <div className="w-full h-[6px] rounded-[3px] bg-[#e5e7eb] overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                whileInView={{ width: `${(vc.sideEffectScore / 10) * 100}%` }} 
                                viewport={{ once: true }} 
                                transition={{ duration: 0.6, ease: "easeOut" }} 
                                className="h-full bg-[#f59e0b] rounded-[3px]" 
                              />
                            </div>
                          </div>
                        </div>
                        
                        {vc.isClinicialEstimate && (
                          <div className="mt-4 text-center">
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              Clinical estimate — no reviews yet
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>

            {/* AGE GROUPS */}
            {(result.ageGroups && result.ageGroups.length > 0) && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <h3 className="section-heading mb-6 flex items-center gap-2">
                  <Users size={18} /> Experience By Age Group
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.ageGroups.map((ag, i) => {
                    const verdictColor = ag.verdict.includes("WELL") ? "green" : ag.verdict.includes("MIXED") ? "amber" : "red";
                    return (
                      <motion.div 
                        key={i} 
                        variants={cardVariant}
                        whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                        className={`bg-white rounded-xl p-5 border border-l-4 border-slate-200 shadow-sm border-l-${verdictColor}-500 hover-lift group cursor-pointer`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2">
                            <User size={14} className={`text-${verdictColor}-500`} />
                            {ag.label}
                          </h4>
                          <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full bg-${verdictColor}-50 text-${verdictColor}-700`}>
                            {ag.verdict}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Based on {ag.dataSource}</p>
                        
                        <p className="text-sm text-slate-600 mb-4 h-10 overflow-hidden text-ellipsis line-clamp-2 group-hover:line-clamp-none group-hover:h-auto transition-all">
                          {ag.summary}
                        </p>
                        
                        {ag.positivePercent > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                              <span>Positive Feedback</span>
                              <span>{ag.positivePercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                whileInView={{ width: `${ag.positivePercent}%` }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.8 }}
                                className={`h-full bg-${verdictColor}-500`}
                              />
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 font-medium">
                          <span className="font-bold text-slate-700">Top side effect:</span> {ag.topSideEffect}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* WHO SHOULD TAKE GRID (CSS Grid auto-fit) */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8">
              <h3 className="section-heading mb-6">Who Should Take This Medicine</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { title: "Adults", Icon: User, data: result.whoCanTake?.adults || { suitable: true, notes: "" } },
                  { title: "Elderly", Icon: Users, data: result.whoCanTake?.elderly || { suitable: true, notes: "" } },
                  { title: "Children", Icon: User, data: result.whoCanTake?.children || { suitable: false, notes: "" }, sub: result.whoCanTake?.children?.minimumAge ? `Min Age: ${result.whoCanTake.children.minimumAge}` : "" },
                  { title: "Pregnant", Icon: Shield, data: result.whoCanTake?.pregnant || { suitable: false, notes: "" } },
                  { title: "Breastfeeding", Icon: Shield, data: result.whoCanTake?.breastfeeding || { suitable: false, notes: "" } }
                ].map((group, idx) => {
                  const suitable = group.data.suitable;
                  const caution = 'caution' in group.data && group.data.caution;
                  const borderColor = suitable ? (caution ? "border-l-amber-400" : "border-l-green-500") : "border-l-red-400";
                  const bg = suitable ? (caution ? "bg-amber-50" : "bg-green-50") : "bg-red-50";
                  return (
                    <motion.div key={idx} variants={cardVariant} whileHover={{ y: -4 }} className={`p-4 rounded-xl border border-l-4 border-r-slate-200 border-t-slate-200 border-b-slate-200 ${bg} ${borderColor} flex flex-col h-full group`}>
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300 }}>
                          <group.Icon size={18} className={suitable ? (caution ? "text-amber-500" : "text-green-600") : "text-red-500"} />
                        </motion.div>
                        <h4 className="font-semibold text-slate-900">{group.title}</h4>
                      </div>
                      {group.sub && <span className="block text-xs font-bold text-slate-500 mb-2 uppercase">{group.sub}</span>}
                      <div className="mb-2">
                        {suitable ? (caution ? <SafetyBadge level="caution" /> : <SafetyBadge level="safe" label="Suitable" />) : <SafetyBadge level="danger" label="Not Suitable" />}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-auto">{group.data.notes}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* SIDE EFFECTS */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8">
              <h3 className="section-heading mb-2 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" /> Side Effects Patients Reported
              </h3>
              <p className="text-slate-500 mb-6 text-sm font-medium pl-3 border-l-2 border-transparent">What people actually experienced, according to online reviews.</p>
              
              {(result.sideEffects || []).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(result.sideEffects || []).map((effect, i) => (
                    <SignalCard key={i} {...effect} />
                  ))}
                </div>
              ) : (
                <div className="text-center p-10 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-slate-500 font-medium">No major side effects reported in the scraped sources.</p>
                </div>
              )}
            </motion.div>

            {/* BRANDS */}
            {(result.brandRecommendations || []).length > 0 && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <BrandRecommendations brands={result.brandRecommendations || []} />
              </motion.div>
            )}

            {/* WHAT'S INSIDE THIS MEDICINE */}
            {(result.drugComponents && result.drugComponents.length > 0) && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8">
                <h3 className="section-heading mb-6 flex items-center gap-2">
                  <Pill size={18} className="text-[#16a34a]" /> What&apos;s Inside This Medicine
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Component</th>
                        <th className="pb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Role</th>
                        <th className="pb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">Allergy Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {result.drugComponents.map((comp, i) => (
                        <tr key={i}>
                          <td className="py-4 text-sm font-bold text-slate-900">{comp.component}</td>
                          <td className="py-4 text-sm text-slate-600">{comp.role}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${comp.commonAllergyRisk ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                              {comp.commonAllergyRisk ? "High Risk" : "Low Risk"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* CDSCO ALERTS */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              {(result.cdscoAlerts && result.cdscoAlerts.length > 0) ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm flex gap-4 items-start">
                  <div className="bg-red-100 p-3 rounded-xl text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-red-900 text-lg mb-1">Government Safety Alerts Found</h4>
                    <p className="text-red-700 text-sm mb-4">CDSCO (India) has issued alerts regarding batches of this medicine.</p>
                    <ul className="space-y-2">
                      {result.cdscoAlerts.map((alert, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-red-800 font-medium">
                          <div className="w-1.5 h-1.5 bg-red-400 rounded-full" /> {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl text-green-600">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-900">No CDSCO Safety Alerts</h4>
                    <p className="text-green-700 text-sm">No active recalls or safety alerts found in Indian regulatory databases for this molecule.</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* WHEN TO SEE A DOCTOR */}
            {(result.doctorConsult && result.doctorConsult.length > 0) && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8">
                <h3 className="section-heading mb-6 flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} /> When To See A Doctor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  {result.doctorConsult.map((point, i) => (
                    <motion.div key={i} variants={cardVariant} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ArrowRight size={12} className="text-red-600" />
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* WHATSAPP CARD */}
            {result.whatsappCard && (
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
                <WhatsAppCard data={result.whatsappCard} />
              </motion.div>
            )}

          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 bg-white text-slate-600 border border-slate-200 shadow-xl rounded-full hover:bg-slate-50 hover:text-[#16a34a] transition-colors z-50 btn-scale"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {appState === "RESULTS" && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="fixed bottom-6 right-20 bg-[#16a34a] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 font-bold z-50"
            onAnimationComplete={() => {
              setTimeout(() => {
                const toast = document.getElementById("success-toast");
                if (toast) toast.style.display = "none";
              }, 3000);
            }}
            id="success-toast"
          >
            <CheckCircle2 size={18} />
            Scan Complete
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
