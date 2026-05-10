import { NextRequest, NextResponse } from "next/server";
import { searchWeb } from "@/lib/anakin";
import Anthropic from "@anthropic-ai/sdk";

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

export async function POST(req: NextRequest) {
  try {
    const { drugs } = await req.json();
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return NextResponse.json({ error: "Please provide at least 2 drugs." }, { status: 400 });
    }
    
    const molecules = drugs.map(d => {
      const lower = d.toLowerCase().trim();
      return brandMap[lower] || lower;
    });

    const interactionData = await searchWeb(
      `${drugs.join(" AND ")} drug interaction adverse effects patients reports clinical pharmacology contraindication India`
    );

    const prompt = `You are a clinical pharmacologist. Analyze dangerous interactions between these drugs: ${molecules.join(", ")}

Search your knowledge AND analyze these scraped patient reports and interaction data:
${interactionData}

Return ONLY valid JSON in this exact format, with no explanation:
{
  "interactionLevel": "none" | "mild" | "moderate" | "severe",
  "interactionColor": "#green or #orange or #red hex",
  "combinations": [
    {
      "drug1": "Metformin",
      "drug2": "Alcohol",
      "effect": "Severe lactic acidosis risk",
      "patientReports": 23,
      "mechanism": "Both increase lactic acid production",
      "severity": "severe",
      "recommendation": "Avoid completely",
      "sampleQuote": "I had extreme dizziness mixing these two"
    }
  ],
  "safetySummary": "One sentence overall verdict",
  "doctorAdvice": "What to tell your doctor"
}
`;

    console.log("KEY EXISTS:", !!process.env.ANTHROPIC_API_KEY);

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json({ error: "Anthropic API key is missing" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey: anthropicKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: "You are a clinical pharmacologist. Return only valid JSON. No markdown fences.",
      messages: [{ role: "user", content: prompt }]
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(clean));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Internal Server Error", message: msg }, { status: 500 });
  }
}
