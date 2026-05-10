import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { drugs } = await req.json();

    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return NextResponse.json({ error: "Please provide at least 2 drugs." }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "Groq API key missing" }, { status: 500 });
    }

    const prompt = `You are a senior clinical pharmacologist. Analyze potential interactions between these drugs: ${drugs.join(", ")}

Return ONLY valid JSON in this exact structure, with no markdown fences or extra text:
{
  "severity": "MINOR" | "MODERATE" | "MAJOR",
  "summary": "1-2 sentence plain English summary of the interaction.",
  "mechanismExplained": "Simple explanation of what happens in the body when these are combined.",
  "risks": [
    {
      "risk": "Name of risk (e.g. Increased Bleeding)",
      "description": "Short explanation",
      "severityIcon": "AlertTriangle" | "AlertCircle" | "Info"
    }
  ],
  "whoAtRisk": ["Elderly patients", "People with kidney issues"],
  "whatToDo": ["Monitor blood pressure", "Consult doctor before combining"],
  "disclaimer": "Always consult a doctor before changing your medication."
}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert pharmacologist. Return only JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Interaction analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "{}";
    
    return NextResponse.json(JSON.parse(rawText));
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal error" }, { status: 500 });
  }
}
