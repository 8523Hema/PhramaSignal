"use client";

import React, { useRef, useState, useCallback } from "react";
import { Camera, Upload, X, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraModal({
  isOpen,
  onClose,
  onExtracted
}: {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (drugName: string) => void;
}) {
  const [tab, setTab] = useState<"UPLOAD" | "CAMERA">("UPLOAD");
  const [image, setImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  
  // New Vision states
  const [visionResult, setVisionResult] = useState<{
    success: boolean;
    drugName?: string;
    brandName?: string;
    manufacturer?: string;
    strength?: string;
    form?: string;
    confidence?: string;
    error?: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const handleClose = () => {
    stopCamera();
    setImage(null);
    setError("");
    setVisionResult(null);
    onClose();
  };

  const startCamera = async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      setError("Camera access denied or unavailable. " + (err instanceof Error ? err.message : ""));
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        setImage(canvas.toDataURL("image/jpeg", 0.8));
        stopCamera();
        setVisionResult(null);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setVisionResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const scanImage = async () => {
    if (!image) return;
    setScanning(true);
    setError("");
    setVisionResult(null);
    
    try {
      // Split the data URI to get base64 string and media type
      // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      const [header, base64Image] = image.split(',');
      const mediaType = header.split(';')[0].split(':')[1];

      const res = await fetch("/api/scan-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image, mediaType })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        setVisionResult({ success: false, error: data.error || "Could not read medicine label" });
        return;
      }
      
      if (data.drugName) {
        setVisionResult({
          success: true,
          ...data
        });
      } else {
        setVisionResult({ success: false, error: "Could not read medicine label" });
      }
    } catch (err: unknown) {
      setVisionResult({ success: false, error: err instanceof Error ? err.message : "An error occurred" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
          >
            <style jsx>{`
              @keyframes scan {
                from { top: 0%; }
                to { top: 100%; }
              }
              .animate-scan-line {
                animation: scan 1.5s ease-in-out infinite alternate;
              }
            `}</style>
            
            <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full p-2 z-10">
              <X size={20} />
            </button>

            <div className="p-6">
              
              {/* If no result yet, show normal header */}
              {!visionResult && <h2 className="text-2xl font-bold text-slate-900 mb-6">Scan Medicine</h2>}

              {/* TABS */}
              {!image && (
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                  <button
                    className={`flex-1 py-2 font-semibold text-sm rounded-lg transition-colors ${tab === "UPLOAD" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
                    onClick={() => { setTab("UPLOAD"); stopCamera(); }}
                  >
                    Upload Image
                  </button>
                  <button
                    className={`flex-1 py-2 font-semibold text-sm rounded-lg transition-colors ${tab === "CAMERA" ? "bg-white text-slate-900 shadow" : "text-slate-500"}`}
                    onClick={() => { setTab("CAMERA"); startCamera(); }}
                  >
                    Use Camera
                  </button>
                </div>
              )}

              {error && !visionResult && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

              {/* UPLOAD VIEW */}
              {!image && tab === "UPLOAD" && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                  <Upload size={32} className="text-slate-400 mb-3" />
                  <p className="text-slate-600 font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-slate-400 text-xs mb-4">SVG, PNG, JPG or GIF (max 5MB)</p>
                  <label className="bg-[#16a34a] hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold cursor-pointer transition-colors">
                    Browse Files
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )}

              {/* CAMERA VIEW */}
              {!image && tab === "CAMERA" && (
                <div className="flex flex-col items-center">
                  <div className="w-full bg-black rounded-xl overflow-hidden aspect-[4/3] relative mb-4 flex items-center justify-center">
                    {!stream && <p className="text-slate-400 absolute">Requesting camera...</p>}
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  </div>
                  <button onClick={captureImage} className="bg-[#16a34a] hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition-colors">
                    <Camera size={20} /> Capture Photo
                  </button>
                </div>
              )}

              {/* IMAGE PREVIEW AND SCANNING STATE */}
              {image && !visionResult && (
                <div className="flex flex-col items-center">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-6 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Captured medicine" className="w-full h-full object-cover" />
                    
                    {scanning && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-[#16a34a]">
                        <p className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md mb-2 bg-slate-900/80 px-4 py-1.5 rounded-full z-10">Reading medicine label...</p>
                        <div className="absolute top-0 left-0 w-full h-[3px] bg-[#16a34a] shadow-[0_0_15px_#16a34a] animate-scan-line"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 w-full">
                    <button onClick={() => setImage(null)} disabled={scanning} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                      Retake
                    </button>
                    {!scanning && (
                      <button onClick={scanImage} disabled={scanning} className="flex-[2] bg-[#16a34a] hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover-lift">
                        Scan Medicine
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* SUCCESS STATE */}
              {visionResult && visionResult.success && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Medicine Detected</h2>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                      <CheckCircle2 className="text-[#16a34a]" size={28} />
                    </motion.div>
                  </div>
                  
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image!} alt="Preview" className="w-full h-[120px] object-cover rounded-xl border border-slate-200 mb-6 opacity-80" />

                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    {visionResult.drugName && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex border-b border-slate-200 pb-2">
                        <span className="w-1/3 text-slate-500 font-semibold">Drug Name</span>
                        <span className="w-2/3 text-slate-900 font-bold capitalize">{visionResult.drugName}</span>
                      </motion.div>
                    )}
                    {visionResult.brandName && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex border-b border-slate-200 pb-2">
                        <span className="w-1/3 text-slate-500 font-semibold">Brand</span>
                        <span className="w-2/3 text-slate-900 font-bold">{visionResult.brandName}</span>
                      </motion.div>
                    )}
                    {visionResult.manufacturer && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex border-b border-slate-200 pb-2">
                        <span className="w-1/3 text-slate-500 font-semibold">Manufacturer</span>
                        <span className="w-2/3 text-slate-900 font-semibold">{visionResult.manufacturer}</span>
                      </motion.div>
                    )}
                    {visionResult.strength && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex border-b border-slate-200 pb-2">
                        <span className="w-1/3 text-slate-500 font-semibold">Strength</span>
                        <span className="w-2/3 text-slate-900">{visionResult.strength}</span>
                      </motion.div>
                    )}
                    {visionResult.form && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex">
                        <span className="w-1/3 text-slate-500 font-semibold">Form</span>
                        <span className="w-2/3 text-slate-900 capitalize">{visionResult.form}</span>
                      </motion.div>
                    )}
                  </div>

                  {visionResult.confidence && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mb-6">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                        <span>Confidence</span>
                        <span className={visionResult.confidence === "HIGH" ? "text-[#16a34a]" : "text-amber-500"}>{visionResult.confidence}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: visionResult.confidence === "HIGH" ? "90%" : visionResult.confidence === "MEDIUM" ? "60%" : "30%" }} 
                          transition={{ duration: 0.5, delay: 0.7 }}
                          className={`h-full rounded-full ${visionResult.confidence === "HIGH" ? "bg-[#16a34a]" : "bg-amber-500"}`}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => { setImage(null); setVisionResult(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                      Retake
                    </button>
                    <button 
                      onClick={() => {
                        onExtracted(visionResult.drugName || "");
                        handleClose();
                      }} 
                      className="flex-[2] bg-[#16a34a] hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      Scan This Drug <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {visionResult && !visionResult.success && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Could Not Read Label</h2>
                    <XCircle className="text-red-500" size={28} />
                  </div>
                  
                  <div className="bg-red-50 border border-red-100 rounded-xl p-5 mb-6 text-sm text-red-800">
                    <h3 className="font-bold mb-2">Tips for better results:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Hold camera steady, good lighting</li>
                      <li>Make sure drug name text is visible</li>
                      <li>Try a closer shot of the label</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => { setImage(null); setVisionResult(null); }} className="flex-[1] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors">
                      Retake
                    </button>
                    <button 
                      onClick={handleClose} 
                      className="flex-[2] bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center"
                    >
                      Type Name Instead
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
