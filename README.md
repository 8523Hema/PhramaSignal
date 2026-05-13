 Discharge Coordinator AgentDischarge Coordinator Agent
 Discharge Coordinator Agent

A multi-agent AI system that automates hospital discharge coordination, reducing discharge time from 6–8 hours to under 45 minutes.

## 🚀 What It Does

- **Manager Agent** orchestrates 4 specialist agents running in parallel
- **Pharmacy Agent** — checks medications, flags drug contraindications
- **Billing/Insurance Agent** — handles billing clearance and insurance verification
- **Discharge Summary Agent** — auto-generates discharge documents
- **OPD Follow-up Agent** — schedules post-discharge appointments

## ✨ Key Features

- IDEAL Discharge Readiness Score for real-time status tracking
- Automatic Metformin-contrast imaging contraindication flagging
- SLA timers with breach logging per agent
- Multilingual discharge summaries
- SHA-256 hash-chained audit trail for compliance
- Automated PDF summary generation

## 🛠️ Tech Stack

- **Orchestration:** Multi-Agent LLM, Lyzr Architect
- **Frontend:** Next.js
- **Backend:** Node.js
- **Database:** MongoDB

## 📊 Impact

| Before | After |
|--------|-------|
| 6–8 hours discharge time | Under 45 minutes |
| Manual department coordination | Fully automated parallel workflow |
| Manual drug conflict checks | Auto-flagged contraindications |
| Paper audit trail | SHA-256 hash-chained digital trail |

PharmaSignal
markdown# 💊 PharmaSignal

AI-powered drug safety platform built for Indian patients. Get plain-language medicine safety analysis, real patient reviews, and personalized risk assessment — in seconds.

## 🚀 What It Does

- **Drug Scanner** — search any medicine for safety info, side effects, and brand comparisons
- **Interaction Checker** — check if two or more medicines are safe to take together
- **Medicine Safety Advisor** — personalized 3-step safety assessment based on your age, conditions, symptoms, and current medications

## ✨ Key Features

- Personalized safety score (0–100) with plain-English verdict
- Age and condition-based risk flags
- Real patient reviews scraped from Reddit, WebMD, and Drugs.com with direct post links
- Progressive streaming responses via SSE for real-time rendering
- WhatsApp-shareable safety reports
- Indian pharmacy availability — 1mg, Apollo, MedPlus, PharmEasy, Netmeds

## 🛠️ Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **AI:** Groq API (LLaMA3)
- **Scraping:** Anakin API
- **Backend:** Next.js API Routes

## 📊 How It Works
User Input (age, conditions, symptoms, medicine)
↓
Anakin API scrapes real patient reviews
↓
Groq LLaMA3 analyzes safety via structured JSON prompt
↓
SSE streams results progressively to frontend
↓
WhatsApp-shareable safety card generated

## ⚠️ Disclaimer

PharmaSignal is for informational purposes only. Always consult a licensed healthcare professional before making any medical decisions.
