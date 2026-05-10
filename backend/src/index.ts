import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { 
  scrapeUrl, 
  searchWeb, 
  crawlSite, 
  mapSite, 
  agenticSearch,
  scrapeWithSession 
} from "./anakin";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";

// Groq chat completion helper with fallback models
async function callGroq(systemPrompt: string, userPrompt: string, maxTokens = 4000): Promise<string> {
  const models = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
  ];

  for (const model of models) {
    console.log(`[groq] trying model: ${model}`);
    let res = await fetch(GROQ_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
      })
    });

    if (res.status === 429) {
      let retryMs = 10000;
      try {
        const retryHeader = res.headers.get("retry-after");
        if (retryHeader) retryMs = (parseFloat(retryHeader) + 1) * 1000;
      } catch { /* ignore */ }
      console.log(`[groq] 429 on ${model}, waiting ${retryMs}ms...`);
      await new Promise(r => setTimeout(r, retryMs));
      res = await fetch(GROQ_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: maxTokens,
        })
      });
    }

    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      console.log(`[groq] success with model: ${model}, chars: ${text.length}`);
      return text;
    }

    const errText = await res.text();
    console.error(`[groq] ${model} failed (${res.status}):`, errText.slice(0, 200));
  }

  throw new Error("Groq AI Error: All models exhausted or rate limited. Try again in a few minutes.");
}

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
  "augmentin": "amoxicillin-clavulanate", "mox": "amoxicillin",
  "allegra": "fexofenadine", "montair": "montelukast",
  "seroflo": "fluticasone-salmeterol", "foracort": "budesonide-formoterol"
};

app.post("/api/scan", async (req: Request, res: Response): Promise<void> => {
  try {
    const { drugName } = req.body;
    if (!drugName) {
      res.status(400).json({ error: "Missing drugName" });
      return;
    }
    
    const lower = drugName.toLowerCase().trim();
    const molecule = brandMap[lower] || lower;

    const [
      drugsComData,
      oneMgCrawl,
      pharmEasyData,
      webSearchData,
      agenticData,
      cdscoUrls,
      practoData
    ] = await Promise.all([
      scrapeUrl(`https://www.drugs.com/${molecule.replace(/ /g,"-")}-reviews.html`),
      crawlSite(`https://www.1mg.com/search/all?name=${encodeURIComponent(molecule)}`, 5),
      scrapeUrl(`https://pharmeasy.in/search/all?name=${encodeURIComponent(molecule)}`),
      searchWeb(`${molecule} side effects patients India reviews 2024 2025 adverse`),
      agenticSearch(`${molecule} unreported side effects pharmacovigilance India patient adverse drug reaction signal 2024 2025`),
      mapSite("https://cdsco.gov.in/opencms/opencms/en/Safety-Alerts/"),
      process.env.ANAKIN_SESSION_ID
        ? scrapeWithSession(
            `https://www.practo.com/medicine-info/${molecule.replace(/ /g,"-")}`,
            process.env.ANAKIN_SESSION_ID
          )
        : Promise.resolve("")
    ]);

    const cdscoAlertPages = cdscoUrls.slice(0, 3);
    const cdscoScraped = await Promise.all(cdscoAlertPages.map((url: string) => scrapeUrl(url)));
    const cdscoData = cdscoScraped.join("\n\n");

    const allMarkdown = `
## Source: drugs.com (Reviews)
${drugsComData}

## Source: 1mg (Full Crawl — All Review Pages)
${oneMgCrawl}

## Source: PharmEasy
${pharmEasyData}

## Source: Web Search (Dynamic — India patient reports)
${webSearchData}

## Source: Agentic Research (AI-synthesized from 20+ sources)
${agenticData}

## Source: CDSCO Safety Alerts (All alert pages)
${cdscoData}

## Source: Practo (Authenticated)
${practoData}
`;

    const sourceCount = [
      drugsComData, oneMgCrawl, pharmEasyData, 
      webSearchData, agenticData, cdscoData, practoData
    ].filter(d => d.length > 100).length;

    const prompt = `You are a senior pharmacovigilance analyst for the Indian drug market. Analyze patient reviews and safety data about the drug "${molecule}" (searched as "${drugName}").

Scraped data from ${sourceCount} sources:

${allMarkdown}

For each signal symptom, scan review text for gender clues (she, her, woman, female, he, him, male) 
and age clues (I am 45, 60 year old, young, elderly, teenager).
Estimate demographic breakdown as percentages. If no clues found, skip that symptom.
Add insight: one sentence about the most striking demographic pattern.

For each signal symptom, extract all timing language from reviews:
- "after X days/weeks/months" = onset
- "worst on day X" or "peaked at" = peak  
- "gone after" or "stopped after" = resolution
Convert all to days. If weeks mentioned multiply by 7. If months multiply by 30.
Return onsetDays, peakDays, resolveDays as integers. If timing not mentioned, omit that symptom from timeline.

Based on the top 3 most serious/frequent signals found, suggest 2-3 alternative molecules
that treat the same condition but have better patient-reported tolerability profiles.
For each alternative:
- Name common Indian brands
- Quantify the advantage if possible ("fewer reports of X")
- Name the tradeoff honestly
- State who it's most suitable for

Generate a WhatsApp-shareable safety summary in both English and Hindi.
Use emojis. Keep it under 200 words per language. 
Plain language only — no medical jargon.
Hindi must be in Devanagari script (not transliteration).
Include only the top 3 most important signals.
End with a doctor consultation reminder.

Also, for each source you list under a symptom's "sources" array, make sure to clearly map where you found it (e.g. "drugs.com", "1mg", "Agentic Research", "Web Search", "Practo", etc) so we can display the correct source badge. 
For "sourceType", infer it based on the name: "drugs.com"->scrape, "1mg"->crawl, "Web Search"->search, "Agentic Research"->agentic, "Practo"->session. Add a new field "sourceTypes": ["scrape", "crawl", "search", "agentic", "session"] corresponding to the sources array.

Return ONLY a valid JSON object in this exact format — no explanation, no markdown, no preamble:

{
  "molecule": "${molecule}",
  "brandsFound": ["Brand1", "Brand2"],
  "signals": [
    {
      "symptom": "hair loss",
      "mentions": 12,
      "sources": ["1mg", "Web Search"],
      "sourceTypes": ["crawl", "search"],
      "inOfficialLabel": false,
      "severity": "moderate",
      "trend": "rising",
      "sampleQuotes": ["patient said X", "user reported Y"]
    }
  ],
  "cdscAlert": null,
  "totalReviewsAnalyzed": 500,
  "sourcesScanned": ${sourceCount},
  "summary": "One sentence pharmacovigilance summary for Indian patients.",
  "officialLabelSymptoms": ["nausea", "vomiting", "headache"],
  "demographicSplits": [
    {
      "symptom": "hair loss",
      "femalePercent": 73,
      "malePercent": 27,
      "ageGroups": {
        "under30": 12,
        "30to50": 45,
        "above50": 43
      },
      "insight": "Hair loss reported 3x more in women over 40"
    }
  ],
  "timeline": [
    {
      "symptom": "nausea",
      "onsetDays": 2,
      "peakDays": 5,
      "resolveDays": 14,
      "timeQuotes": ["felt sick on day 2", "worst by day 5", "gone after 2 weeks"]
    }
  ],
  "alternatives": [
    {
      "molecule": "Glipizide",
      "forCondition": "Type 2 Diabetes",
      "advantage": "60% fewer GI complaints reported by patients",
      "tradeoff": "Less effective for weight loss",
      "patientSentiment": "positive",
      "indianBrands": ["Glynase", "Dibizide"],
      "suitableFor": "Patients with stomach sensitivity"
    }
  ],
  "whatsappCard": {
    "english": "⚠️ SAFETY ALERT: Metformin...",
    "hindi": "⚠️ सुरक्षा जानकारी: Metformin..."
  }
}

Rules:
- "molecule": the generic drug name
- "brandsFound": list every Indian brand name you found in the scraped data for this molecule
- "signals": only include symptoms mentioned 3 or more times across all sources
- "inOfficialLabel": true if the symptom is a well-known documented side effect, false if it seems undocumented
- "severity": mild | moderate | serious
- "trend": rising | stable | declining
- "sampleQuotes": 1-2 short anonymized patient quotes from reviews (paraphrased)
- "cdscAlert": if CDSCO data mentions any recall/alert for this drug, include that text; otherwise null
- "officialLabelSymptoms": list 5-8 commonly known documented side effects
- Return ONLY the JSON, nothing else`;

    const raw = await callGroq(
      "You are a pharmacovigilance analyst. Return only valid JSON, no markdown, no backticks.",
      prompt,
      4000
    );
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.post("/api/interactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const { drugs } = req.body;
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      res.status(400).json({ error: "Please provide at least 2 drugs." });
      return;
    }
    
    const molecules = drugs.map((d: string) => {
      const lower = d.toLowerCase().trim();
      return brandMap[lower] || lower;
    });

    const interactionData = await agenticSearch(
      `${drugs.join(" AND ")} drug interaction adverse effects patients reports clinical pharmacology contraindication India`
    );

    const prompt = `You are a clinical pharmacologist. Analyze dangerous interactions between these drugs: ${molecules.join(", ")}

Search your knowledge AND analyze these scraped patient reports and interaction data:
${interactionData}

Return ONLY valid JSON in this exact format, with no explanation:
{
  "interactionLevel": "none",
  "interactionColor": "#22c55e",
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

    const raw = await callGroq(
      "You are a clinical pharmacologist. Return only valid JSON.",
      prompt,
      3000
    );
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

app.post("/api/deep-search", async (req: Request, res: Response): Promise<void> => {
  try {
    const { drugName, researchType } = req.body;
    let data = "";

    if (researchType === "global") {
      data = await agenticSearch(
        `${drugName} FDA adverse event reporting FAERS EudraVigilance WHO VigiBase safety signal 2023 2024 2025`
      );
    } else if (researchType === "indian") {
      const [practoForum, reddit, medscape] = await Promise.all([
        searchWeb(`${drugName} side effects site:practo.com`),
        searchWeb(`${drugName} side effects India site:reddit.com`),
        crawlSite(`https://www.medindia.net/drug-price/${drugName.replace(/ /g,"-")}.htm`, 3)
      ]);
      data = [practoForum, reddit, medscape].join("\n\n");
    } else if (researchType === "clinical") {
      data = await agenticSearch(
        `${drugName} clinical trial adverse events systematic review meta-analysis PubMed 2020 2021 2022 2023 2024`
      );
    }

    const prompt = `Analyze this deep research data for ${drugName}:

${data}

Return JSON:
{
  "researchType": "${researchType}",
  "keyFindings": [
    {
      "finding": "description",
      "confidence": "high",
      "source": "where found",
      "clinicalSignificance": "why it matters"
    }
  ],
  "novelSignals": ["signals not in standard reviews"],
  "globalVsIndiaComparison": "how Indian patient experience differs",
  "evidenceGrade": "B",
  "researchSummary": "2-3 sentence summary"
}`;

    const raw = await callGroq(
      "You are a pharmacovigilance researcher. Return only valid JSON.",
      prompt,
      2000
    );
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
