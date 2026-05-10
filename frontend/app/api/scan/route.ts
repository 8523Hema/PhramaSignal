import { NextRequest, NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/anakin";

const brandMap: Record<string, string> = {
  "glycomet": "metformin", "glucophage": "metformin",
  "obimet": "metformin", "gluconorm": "metformin",
  "crocin": "paracetamol", "dolo": "paracetamol",
  "calpol": "paracetamol", "combiflam": "ibuprofen",
  "brufen": "ibuprofen", "shelcal": "calcium carbonate",
  "pan": "pantoprazole", "pantocid": "pantoprazole",
  "ecosprin": "aspirin", "loprin": "aspirin",
  "thyronorm": "levothyroxine", "eltroxin": "levothyroxine",
  "metpure": "metoprolol", "betaloc": "metoprolol",
  "telma": "telmisartan", "telsartan": "telmisartan",
  "rozavel": "rosuvastatin", "crestor": "rosuvastatin",
  "azithral": "azithromycin", "zithromax": "azithromycin",
  "augmentin": "amoxicillin clavulanate", "mox": "amoxicillin",
  "allegra": "fexofenadine", "montair": "montelukast",
  "dolo650": "paracetamol", "nicip": "nimesulide",
  "voveran": "diclofenac", "zerodol": "aceclofenac"
};

// FIX 2 — MAKE EVERY SCRAPE OPTIONAL
const safeScrape = async (fn: () => Promise<string>, ms = 8000): Promise<string> => {
  try {
    return await Promise.race([
      fn(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), ms)
      )
    ]);
  } catch (err: unknown) {
    console.warn('[scan] scrape failed silently:', err instanceof Error ? err.message : String(err));
    return ""; // return empty string, never throw
  }
};

// FIX 4 — GROQ MODEL FALLBACK CHAIN
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it"
];

const callGroqWithFallback = async (prompt: string) => {
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: prompt }],
          max_tokens: 2000,
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });
      if (!res.ok) throw new Error(`${model} failed: ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } catch {
      console.warn(`[groq] ${model} failed, trying next`);
      continue;
    }
  }
  throw new Error("All Groq models failed");
};

// FIX 3 — JSON PARSE SAFETY
const parseGroqResponse = (text: string, drugName: string) => {
  try {
    const clean = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('[groq] parse failed:', e);
    return {
      drugName: drugName,
      safetyScore: 65,
      verdict: "Consult your doctor before taking this medicine.",
      recommendation: {
        state: "CAUTION",
        safePercent: 40,
        cautionPercent: 45,
        avoidPercent: 15,
        reasons: ["Limited data available", "Consult a doctor", "Follow prescribed dosage"],
        quickFacts: ["Consult doctor", "Follow dosage", "Monitor side effects"]
      },
      reviewCards: [],
      sideEffects: [],
      brandRecommendations: [],
      patientSummary: "Please consult your doctor for accurate information about this medicine.",
      positiveExperiences: [],
      negativeExperiences: [],
      ageGroups: [],
      drugComponents: [],
      cdscoAlerts: [],
      doctorConsult: ["Consult a doctor if symptoms persist"],
      whatsappCard: {
        english: `Safety information for ${drugName}: Please consult a doctor.`,
        hindi: `${drugName} के लिए सुरक्षा जानकारी: कृपया डॉक्टर से सलाह लें।`
      }
    };
  }
};

export async function POST(req: NextRequest) {
  // FIX 1 — WRAP ENTIRE SCAN IN TRY/CATCH
  try {
    const { drugName } = await req.json();
    if (!drugName?.trim()) {
      return NextResponse.json({ error: "Drug name required" }, { status: 400 });
    }

    const lower = drugName.toLowerCase().trim();
    const molecule = brandMap[lower] || lower;
    const hyphenated = molecule.replace(/ /g, "-");

    console.log(`\n=== SCAN START: ${drugName} → ${molecule} ===`);

    const [drugsComData, webMDData, drugsComInfo, cdscoData] = await Promise.all([
      safeScrape(() => scrapeUrl(`https://www.drugs.com/${hyphenated}-reviews.html`)),
      safeScrape(() => scrapeUrl(`https://www.webmd.com/drugs/drugreview-${hyphenated}.htm`)),
      safeScrape(() => scrapeUrl(`https://www.drugs.com/${hyphenated}.html`)),
      safeScrape(() => scrapeUrl(`https://cdsco.gov.in/opencms/opencms/en/Safety-Alerts/`))
    ]);

    const totalChars = drugsComData.length + webMDData.length + drugsComInfo.length + cdscoData.length;
    const scrapingWorked = totalChars > 500;

    const allMarkdown = `
=== DRUGS.COM PATIENT REVIEWS ===
${drugsComData || "No data"}

=== DRUGS.COM DRUG INFO PAGE ===
${drugsComInfo || "No data"}

=== WEBMD PATIENT REVIEWS ===
${webMDData || "No data"}

=== CDSCO SAFETY ALERTS ===
${cdscoData || "No data"}
`.trim();

    const userPrompt = `You are a senior clinical pharmacologist analyzing the drug: "${molecule}"
(User searched for: "${drugName}")

${scrapingWorked ? `SCRAPED DATA:\n${allMarkdown}` : `NOTE: Minimal web data. Use clinical knowledge.`}

Return a JSON report.
CRITICAL:
- Always respond with valid JSON only. Never return an error or explanation.
- If you have no data, use clinical knowledge to fill all fields.
- Never leave any field null or undefined.
- Always return 4 reviewCards.
- Include "cdscoAlerts" (array of strings or empty).
- Include "doctorConsult" (array of 3-5 strings for "WHEN TO SEE A DOCTOR").
- Include "whatsappCard" object with "english" and "hindi" summary strings.

JSON Structure:
{
  "drugName": "${molecule}",
  "drugProfile": { "drugClass": "", "mechanism": "", "activeIngredients": [], "usedFor": [], "formulations": [] },
  "safetyVerdict": { "safetyScore": 72, "verdictSummary": "" },
  "sentimentAnalysis": { "overallPositive": 65, "totalReviewsAnalyzed": 100 },
  "whoCanTake": { "adults": {"suitable":true, "notes":""}, "elderly": {"suitable":true, "notes":""}, "children": {"suitable":false, "notes":""}, "pregnant": {"suitable":false, "notes":""}, "breastfeeding": {"suitable":false, "notes":""} },
  "whoShouldNOTTake": [{ "condition": "", "reason": "", "severity": "" }],
  "sideEffects": [{ "symptom": "", "percentage": 0, "severity": "", "sources": [] }],
  "ageGroups": [{ "label": "", "verdict": "", "summary": "", "positivePercent": 0 }],
  "recommendation": { "state": "SAFE", "safePercent": 0, "cautionPercent": 0, "avoidPercent": 0, "reasons": [], "quickFacts": [] },
  "patientSummary": "",
  "reviewCards": [{ "patientType": "", "quote": "", "effectivenessScore": 8, "sideEffectScore": 4, "sentiment": "POSITIVE", "isClinicialEstimate": false }],
  "drugComponents": [{ "component": "", "role": "", "commonAllergyRisk": false }],
  "cdscoAlerts": [],
  "doctorConsult": [],
  "whatsappCard": { "english": "", "hindi": "" },
  "brandRecommendations": [{ "brandName": "", "manufacturer": "", "isRecommended": true }]
}`;

    const groqResponse = await callGroqWithFallback(userPrompt);
    const finalJSON = parseGroqResponse(groqResponse, molecule);

    return NextResponse.json({
      success: true,
      ...finalJSON,
      dataSource: scrapingWorked ? "patient_reviews" : "clinical"
    });

  } catch (error) {
    console.error('[scan] pipeline error:', error);
    // Fallback to minimal clinical data if everything crashes
    return NextResponse.json({
      success: true,
      dataSource: "clinical",
      drugName: "Medicine",
      safetyScore: 65,
      verdict: "Consult your doctor.",
      recommendation: { state: "CAUTION", safePercent: 40, cautionPercent: 45, avoidPercent: 15, reasons: ["System error occurred", "Using clinical fallback"], quickFacts: ["Consult doctor"] },
      reviewCards: [],
      sideEffects: [],
      brandRecommendations: [],
      patientSummary: "Pipeline error. Please consult your doctor.",
      drugComponents: [],
      cdscoAlerts: [],
      doctorConsult: ["Consult a doctor immediately"],
      whatsappCard: { english: "Error retrieving safety data.", hindi: "सुरक्षा डेटा प्राप्त करने में त्रुटि।" }
    });
  }
}
