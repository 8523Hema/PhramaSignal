import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, targetLanguage } = await req.json();
  if (!text || !targetLanguage) {
    return NextResponse.json({ error: "Missing text or targetLanguage" }, { status: 400 });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json({ error: "Groq API key missing" }, { status: 500 });
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a medical translator. Translate the following drug safety message into ${targetLanguage}.
Keep all emojis exactly as they are. Keep all numbers and drug names unchanged.
Use plain language appropriate for a patient. Return ONLY the translated text, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ translated: text });
  }

  const data = await res.json();
  const translated = data.choices?.[0]?.message?.content || text;
  return NextResponse.json({ translated });
}
