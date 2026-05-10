"use client";

import React, { useState } from "react";
import { Pill, Droplets, Syringe, Star, ShoppingBag, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface BrandRecommendation {
  brandName: string;
  manufacturer: string;
  bestFor: string;
  form: string;
  priceRange: "₹" | "₹₹" | "₹₹₹";
  availability: string[];
  whyThisBrand: string;
  isRecommended: boolean;
}

function PriceDots({ range }: { range: string }) {
  const count = range.length; // ₹=1, ₹₹=2, ₹₹₹=3
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className={`w-2 h-2 rounded-full ${i <= count ? "bg-[#0ea5e9]" : "bg-slate-200"}`}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1">{range}</span>
    </div>
  );
}

function FormIcon({ form }: { form: string }) {
  const lower = form.toLowerCase();
  if (lower.includes("syrup") || lower.includes("liquid") || lower.includes("drop")) {
    return <Droplets size={14} className="text-blue-500" />;
  }
  if (lower.includes("inject") || lower.includes("iv")) {
    return <Syringe size={14} className="text-purple-500" />;
  }
  return <Pill size={14} className="text-slate-500" />;
}

function BuyLinks({ brand }: { brand: BrandRecommendation }) {
  const links = [
    { label: "1mg", url: `https://www.1mg.com/search/all?name=${encodeURIComponent(brand.brandName)}` },
    { label: "Netmeds", url: `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(brand.brandName)}` },
    { label: "Apollo 24/7", url: `https://www.apollo247.com/search?query=${encodeURIComponent(brand.brandName)}` },
    { label: "PharmEasy", url: `https://pharmeasy.in/search/all?name=${encodeURIComponent(brand.brandName)}` },
  ];
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-[#0ea5e9] border border-[#0ea5e9]/30 px-3 py-1.5 rounded-lg hover:bg-[#0ea5e9]/10 transition-colors group"
        >
          <ExternalLink size={11} className="group-hover:scale-110 transition-transform" />
          <span className="group-hover:underline">{l.label}</span>
        </a>
      ))}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 }
  })
};

export default function BrandRecommendations({ brands }: { brands: BrandRecommendation[] }) {
  const [modalBrand, setModalBrand] = useState<BrandRecommendation | null>(null);

  if (!brands || brands.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 md:p-8 mb-6 overflow-hidden">
        <motion.h3 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="section-heading flex items-center gap-2 mb-6"
        >
          <ShoppingBag size={18} className="text-[#0ea5e9]" />
          Which Brand Should You Choose?
        </motion.h3>

        {/* Mobile: horizontal scroll, Desktop: 3-col grid */}
        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
          {brands.map((brand, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              whileHover={{ y: -6, boxShadow: "0 12px 32px rgba(0,0,0,0.12)", scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setModalBrand(brand)}
              className={`snap-center shrink-0 w-[280px] md:w-auto relative rounded-2xl border cursor-pointer transition-all p-5 ${
                brand.isRecommended
                  ? "border-t-[3px] border-t-green-500 border-slate-200 bg-green-50/30 hover:border-green-500"
                  : "border-slate-200 bg-white hover:border-green-400"
              }`}
            >
              {brand.isRecommended && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                  <Star size={9} fill="white" className="relative z-10" />
                  <span className="relative z-10">Top Pick</span>
                </div>
              )}

              <div className="mb-3">
                <h4 className="text-lg font-bold text-slate-900">{brand.brandName}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{brand.manufacturer}</p>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <FormIcon form={brand.form} />
                <span className="text-xs font-medium text-slate-600 capitalize">{brand.form}</span>
                <span className="text-slate-300">•</span>
                <PriceDots range={brand.priceRange} />
              </div>

              <p className="text-sm text-slate-700 mb-3">
                <span className="font-semibold text-slate-500">Best for:</span> {brand.bestFor}
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-slate-600 italic">{brand.whyThisBrand}</p>
              </div>

              {brand.availability && brand.availability.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {brand.availability.map((place, j) => (
                    <span key={j} className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
                      {place}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalBrand && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm" 
            onClick={() => setModalBrand(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-lg p-6 relative" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 md:hidden" />
              <button
                onClick={() => setModalBrand(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors hidden md:block"
              >
                <X size={20} />
              </button>

              {modalBrand.isRecommended && (
                <span className="inline-flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider mb-3">
                  <Star size={9} fill="white" /> Top Pick
                </span>
              )}

              <h3 className="text-2xl font-bold text-slate-900 mb-1">{modalBrand.brandName}</h3>
              <p className="text-sm text-slate-400 mb-4">{modalBrand.manufacturer}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Form</p>
                  <div className="flex items-center gap-1.5">
                    <FormIcon form={modalBrand.form} />
                    <span className="text-sm font-medium capitalize">{modalBrand.form}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Price</p>
                  <PriceDots range={modalBrand.priceRange} />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Best For</p>
                <p className="text-sm text-slate-700">{modalBrand.bestFor}</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                <p className="text-xs text-blue-500 font-semibold uppercase mb-1">Why This Brand</p>
                <p className="text-sm text-blue-800">{modalBrand.whyThisBrand}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-2">Where to Buy Online</p>
                <BuyLinks brand={modalBrand} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
