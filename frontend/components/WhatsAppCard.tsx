"use client";

import React, { useState, useRef } from "react";
import { Globe, Copy, Share2, Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";

export interface WhatsAppData {
  english: string;
  hindi: string;
}

const LANGUAGES = [
  { code: "english", label: "English", native: "English" },
  { code: "hindi", label: "Hindi", native: "हिंदी" },
  { code: "tamil", label: "Tamil", native: "தமிழ்" },
  { code: "telugu", label: "Telugu", native: "తెలుగు" },
  { code: "kannada", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "malayalam", label: "Malayalam", native: "മലയാളം" },
  { code: "bengali", label: "Bengali", native: "বাংলা" },
  { code: "marathi", label: "Marathi", native: "मराठी" },
  { code: "gujarati", label: "Gujarati", native: "ગુજરાતી" },
  { code: "punjabi", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "odia", label: "Odia", native: "ଓଡ଼ିଆ" },
];

export default function WhatsAppCard({ data }: { data: WhatsAppData }) {
  const [langCode, setLangCode] = useState("english");
  const [translatedText, setTranslatedText] = useState<Record<string, string>>({
    english: data.english,
    hindi: data.hindi,
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Text");
  const cardRef = useRef<HTMLDivElement>(null);

  if (!data || !data.english) return null;

  const currentText = translatedText[langCode] || data.english;

  const handleLangChange = async (code: string) => {
    setLangCode(code);
    if (translatedText[code]) return; // already cached
    if (code === "english") return;
    if (code === "hindi" && data.hindi) {
      setTranslatedText(prev => ({ ...prev, hindi: data.hindi }));
      return;
    }

    setIsTranslating(true);
    try {
      const lang = LANGUAGES.find(l => l.code === code);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: data.english,
          targetLanguage: lang?.label || code,
        }),
      });
      const result = await res.json();
      setTranslatedText(prev => ({ ...prev, [code]: result.translated || data.english }));
    } catch {
      setTranslatedText(prev => ({ ...prev, [code]: data.english }));
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentText);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy Text"), 2000);
  };

  const handleShare = () => {
    const url = `whatsapp://send?text=${encodeURIComponent(currentText)}`;
    window.open(url, "_blank");
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#f8fafc" });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `PharmaSignal-Alert-${Date.now()}.png`;
      link.click();
    } catch {
      alert("Failed to save image.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8">
      <div className="mb-5">
        <h3 className="section-heading flex items-center gap-2">
          <Share2 size={18} className="text-[#0ea5e9]" />
          Share Safety Information
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Share with family members who take this medicine
        </p>
      </div>

      {/* Language Dropdown */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Select Language
        </label>
        <div className="relative">
          <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={langCode}
            onChange={(e) => handleLangChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#0ea5e9] appearance-none cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* The Card Preview */}
        <div className="w-full md:w-1/2">
          <div
            ref={cardRef}
            className="bg-[#dcf8c6] text-slate-900 p-5 rounded-2xl rounded-tr-sm shadow-md font-sans relative border border-[#c1ebb2] min-h-[120px] flex items-center justify-center"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {isTranslating ? (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Loader2 size={24} className="animate-spin text-[#0ea5e9]" />
                <span className="text-sm">Translating...</span>
              </div>
            ) : (
              <>
                {currentText}
                <div className="absolute top-0 right-[-8px] w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-r-[10px] border-r-transparent" />
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <button
            onClick={handleCopy}
            disabled={isTranslating}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Copy size={16} />
            {copyLabel}
          </button>
          <button
            onClick={handleShare}
            disabled={isTranslating}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors shadow-sm w-full disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </button>
          <button
            onClick={handleSaveImage}
            disabled={isTranslating}
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={16} />
            Save as Image
          </button>
        </div>
      </div>
    </div>
  );
}
