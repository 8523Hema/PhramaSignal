import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image, mediaType } = await req.json();

    if (!image || !mediaType) {
      return NextResponse.json({ success: false, error: "Missing image or mediaType" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({ success: false, error: "Groq API key is missing" }, { status: 500 });
    }

    const promptText = `This is an image of a medicine strip, box, 
or label from India. Look carefully at all text 
visible in the image.

Extract and return ONLY a JSON object with:
{
  "drugName": "generic drug name in English",
  "brandName": "brand name as printed on pack",
  "manufacturer": "company name",
  "strength": "dosage strength e.g. 500mg",
  "form": "tablet/syrup/capsule/injection",
  "confidence": "HIGH/MEDIUM/LOW"
}

For example, if you see PARACIP-500 by Cipla:
{
  "drugName": "Paracetamol",
  "brandName": "PARACIP-500",
  "manufacturer": "Cipla",
  "strength": "500mg",
  "form": "tablet",
  "confidence": "HIGH"
}

Return ONLY the JSON. No explanation. No markdown.
If you cannot read any text, return:
{ "error": "unreadable" }`;

    let extractedData = null;
    let extractedBy = null;
    let hasError = false;

    // STEP 2 — Try Groq Vision Model (PRIMARY)
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mediaType};base64,${image}`
                  }
                },
                {
                  type: "text",
                  text: promptText
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || "";
        const cleanJSON = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        try {
          const parsed = JSON.parse(cleanJSON);
          if (parsed.drugName && !parsed.error) {
            extractedData = parsed;
            extractedBy = "groq-vision";
          } else {
            hasError = true;
          }
        } catch {
          hasError = true;
        }
      } else {
        hasError = true;
      }
    } catch (e) {
      console.error("Groq vision failed:", e);
      hasError = true;
    }

    // STEP 4 — Claude Vision Fallback (if Groq fails)
    if ((hasError || !extractedData) && anthropicApiKey) {
      console.log("Falling back to Claude vision...");
      try {
        const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", 
          headers: { 
            "Content-Type": "application/json",
            "x-api-key": anthropicApiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514", // As requested by user
            max_tokens: 300,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: mediaType,
                      data: image
                    }
                  },
                  {
                    type: "text",
                    text: promptText
                  }
                ]
              }
            ]
          })
        });

        if (claudeResponse.ok) {
          const data = await claudeResponse.json();
          const rawText = data.content?.[0]?.text || "";
          const cleanJSON = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          
          try {
            const parsed = JSON.parse(cleanJSON);
            if (parsed.drugName && !parsed.error) {
              extractedData = parsed;
              extractedBy = "claude-vision";
            }
          } catch {
            // failed parsing
          }
        }
      } catch (e) {
        console.error("Claude fallback failed:", e);
      }
    }

    // STEP 5 — Return response to frontend
    if (extractedData) {
      return NextResponse.json({
        success: true,
        ...extractedData,
        extractedBy
      });
    }

    return NextResponse.json({
      success: false,
      error: "Could not read medicine label"
    });

  } catch (err: unknown) {
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : "Internal server error" 
    }, { status: 500 });
  }
}
