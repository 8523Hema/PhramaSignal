"use client";

import React from "react";
import { motion } from "framer-motion";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded-xl ${className}`} />
  );
}

export function SkeletonResults() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto px-4 py-8 space-y-10"
    >
      {/* Search Header Skeleton */}
      <div className="flex gap-4">
        <SkeletonCard className="h-12 flex-1 rounded-xl" />
        <SkeletonCard className="h-12 w-12 rounded-xl" />
        <SkeletonCard className="h-12 w-12 rounded-xl" />
      </div>

      {/* Progress Bar Skeleton */}
      <div className="flex flex-col gap-2">
        <SkeletonCard className="h-2 w-full rounded-full" />
        <SkeletonCard className="h-4 w-48 rounded-full self-center" />
      </div>

      {/* Title Skeleton */}
      <div className="flex items-center gap-4">
        <SkeletonCard className="h-10 w-64 rounded-full" />
        <SkeletonCard className="h-6 w-24 rounded-full" />
      </div>

      {/* Verdict Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard className="h-40 md:col-span-2 rounded-2xl" />
        <SkeletonCard className="h-40 md:col-span-1 rounded-2xl" />
      </div>

      {/* Review Voice Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard className="h-48 rounded-2xl" />
        <SkeletonCard className="h-48 rounded-2xl" />
      </div>

      {/* Side Effects Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SkeletonCard className="h-32 rounded-2xl" />
        <SkeletonCard className="h-32 rounded-2xl" />
        <SkeletonCard className="h-32 rounded-2xl" />
      </div>
    </motion.div>
  );
}
