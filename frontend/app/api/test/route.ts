import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const ANAKIN_KEY = process.env.ANAKIN_API_KEY;
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const report: any = {
    timestamp: new Date().toISOString(),
    env: {
      ANAKIN_KEY_EXISTS: !!ANAKIN_KEY,
      ANAKIN_KEY_PREFIX: ANAKIN_KEY?.slice(0, 12) || "MISSING",
      ANTHROPIC_KEY_EXISTS: !!ANTHROPIC_KEY,
      ANTHROPIC_KEY_PREFIX: ANTHROPIC_KEY?.slice(0, 15) || "MISSING"
    }
  };

  // TEST 1: Submit a scrape job
  try {
    const submitRes = await fetch(
      "https://api.anakin.io/v1/url-scraper",
      {
        method: "POST",
        headers: {
          "X-API-Key": ANAKIN_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: "https://www.drugs.com/aspirin.html",
          format: "markdown",
          useBrowser: false
        })
      }
    );

    const submitText = await submitRes.text();
    report.scrape_submit = {
      http_status: submitRes.status,
      raw_response: submitText.slice(0, 300)
    };

    if (submitRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let submitJson: any = {};
      try { submitJson = JSON.parse(submitText); } catch {}
      
      const jobId = submitJson.jobId 
        || submitJson.id 
        || submitJson.job_id
        || submitJson.data?.id;

      report.scrape_submit.jobId_found = jobId || "NOT FOUND";
      report.scrape_submit.all_keys = Object.keys(submitJson);

      if (jobId) {
        await new Promise(r => setTimeout(r, 5000));
        
        const pollRes = await fetch(
          `https://api.anakin.io/v1/url-scraper/${jobId}`,
          { headers: { "X-API-Key": ANAKIN_KEY! } }
        );
        const pollText = await pollRes.text();
        report.scrape_poll = {
          http_status: pollRes.status,
          raw_response: pollText.slice(0, 500)
        };
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    report.scrape_submit = { exception: err.message };
  }

  // TEST 2: Try search endpoint
  try {
    const searchRes = await fetch(
      "https://api.anakin.io/v1/search",
      {
        method: "POST",
        headers: {
          "X-API-Key": ANAKIN_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: "aspirin side effects",
          prompt: "aspirin side effects",
          limit: 3
        })
      }
    );
    const searchText = await searchRes.text();
    report.search_test = {
      http_status: searchRes.status,
      raw_response: searchText.slice(0, 300)
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    report.search_test = { exception: err.message };
  }

  // TEST 3: Claude API
  try {
    if (!ANTHROPIC_KEY) throw new Error("ANTHROPIC_API_KEY not set");
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16,
      messages: [{ role: "user", content: "Reply with OK only" }]
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    report.claude_test = {
      http_status: 200,
      response: text
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    report.claude_test = { exception: err.message };
  }

  return NextResponse.json(report, { status: 200 });
}
