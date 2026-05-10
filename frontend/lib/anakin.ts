const ANAKIN_KEY = process.env.ANAKIN_API_KEY!;
const BASE = "https://api.anakin.io/v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJobId(json: any): string | null {
  // Try every possible field name
  return json?.jobId 
    || json?.id 
    || json?.job_id
    || json?.data?.id
    || json?.data?.jobId
    || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMarkdown(data: any): string {
  if (!data) return "";
  
  // Direct markdown/content fields
  if (data.markdown && data.markdown.length > 50) 
    return data.markdown;
  if (data.content && data.content.length > 50) 
    return data.content;
  if (data.text && data.text.length > 50) 
    return data.text;
  if (data.answer && data.answer.length > 50)
    return data.answer;
  if (data.result?.markdown) 
    return data.result.markdown;
  if (data.data?.markdown) 
    return data.data.markdown;
    
  // Array of pages (crawl result)
  if (Array.isArray(data.pages)) {
    return data.pages
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.markdown || p.content || "")
      .filter(Boolean)
      .join("\n\n---\n\n");
  }
  if (Array.isArray(data.results)) {
    return data.results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.markdown || p.content || p.text || "")
      .filter(Boolean)
      .join("\n\n---\n\n");
  }
  if (Array.isArray(data.data)) {
    return data.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.markdown || p.content || p.text || p.snippet || "")
      .filter(Boolean)
      .join("\n\n---\n\n");
  }
  if (Array.isArray(data.items)) {
    return data.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.markdown || p.content || p.text || p.snippet || p.description || "")
      .filter(Boolean)
      .join("\n\n---\n\n");
  }
  // Flatten any nested organic/web results array
  const organic = data.organic || data.webPages?.value || data.hits;
  if (Array.isArray(organic)) {
    return organic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.snippet || p.text || p.content || p.markdown || "")
      .filter(Boolean)
      .join("\n\n---\n\n");
  }

  return "";
}

async function pollJob(
  endpoint: string,
  jobId: string
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 4000));
    
    try {
      const res = await fetch(`${BASE}/${endpoint}/${jobId}`, {
        headers: { "X-API-Key": ANAKIN_KEY }
      });
      
      if (!res.ok) {
        console.error(`Poll HTTP ${res.status} for ${endpoint}/${jobId}`);
        continue;
      }
      
      const data = await res.json();
      const status = data.status || data.data?.status;
      console.log(`Poll ${i}: ${endpoint}/${jobId} = ${status}`);
      
      if (status === "completed" || status === "done" || status === "success") {
        const text = extractMarkdown(data);
        console.log(`Got ${text.length} chars from ${endpoint}/${jobId}`);
        return text;
      }
      
      if (status === "failed" || status === "error") {
        console.error(`Job failed: ${JSON.stringify(data).slice(0, 200)}`);
        return "";
      }
      
      // No status field — maybe result is returned directly
      const directText = extractMarkdown(data);
      if (directText.length > 100) {
        console.log(`Direct result ${directText.length} chars`);
        return directText;
      }
      
    } catch (err) {
      console.error(`Poll exception:`, err);
    }
  }
  return "";
}

export async function scrapeUrl(url: string): Promise<string> {
  try {
    console.log(`[anakin] scraping: ${url}`);
    const res = await fetch(`${BASE}/url-scraper`, {
      method: "POST",
      headers: {
        "X-API-Key": ANAKIN_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        format: "markdown",
        useBrowser: true
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[anakin] scrape submit ${res.status}: ${body}`);
      return "";
    }

    const json = await res.json();
    const jobId = getJobId(json);
    
    if (!jobId) {
      // Maybe result is synchronous
      const direct = extractMarkdown(json);
      if (direct.length > 50) return direct;
      console.error(`[anakin] no jobId: ${JSON.stringify(json).slice(0,200)}`);
      return "";
    }

    return pollJob("url-scraper", jobId);
  } catch (err) {
    console.error(`[anakin] scrapeUrl exception:`, err);
    return "";
  }
}

export async function searchWeb(query: string): Promise<string> {
  try {
    console.log(`[anakin] searching: ${query}`);
    const res = await fetch(`${BASE}/search`, {
      method: "POST",
      headers: {
        "X-API-Key": ANAKIN_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        prompt: query,
        limit: 10,
        format: "markdown",
        extractContent: true
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[anakin] search submit ${res.status}: ${body}`);
      // Fallback to agentic search if regular search fails
      return agenticSearch(query);
    }

    const json = await res.json();
    console.log(`[anakin] search raw keys: ${Object.keys(json).join(", ")}`);

    // /v1/search is SYNCHRONOUS — extract result directly, no polling
    const direct = extractMarkdown(json);
    if (direct.length > 50) {
      console.log(`[anakin] search sync result: ${direct.length} chars`);
      return direct;
    }

    // If somehow there's a jobId (shouldn't happen for /search), fall back to agenticSearch
    const jobId = getJobId(json);
    if (jobId) {
      console.log(`[anakin] search returned jobId unexpectedly, using agentic-search fallback`);
      return agenticSearch(query);
    }

    console.warn(`[anakin] search returned no usable content: ${JSON.stringify(json).slice(0, 200)}`);
    return agenticSearch(query);
  } catch (err) {
    console.error(`[anakin] searchWeb exception:`, err);
    return "";
  }
}

export async function agenticSearch(query: string): Promise<string> {
  try {
    console.log(`[anakin] agentic-search: ${query}`);
    const res = await fetch(`${BASE}/agentic-search`, {
      method: "POST",
      headers: {
        "X-API-Key": ANAKIN_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query,
        prompt: query,
        format: "markdown"
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[anakin] agentic-search submit ${res.status}: ${body}`);
      return "";
    }

    const json = await res.json();
    const jobId = getJobId(json);
    if (!jobId) {
      // Maybe synchronous result
      const direct = extractMarkdown(json);
      if (direct.length > 50) return direct;
      console.error(`[anakin] agentic-search no jobId: ${JSON.stringify(json).slice(0, 200)}`);
      return "";
    }

    // Poll at the correct endpoint: /v1/agentic-search/{jobId}
    return pollJob("agentic-search", jobId);
  } catch (err) {
    console.error(`[anakin] agenticSearch exception:`, err);
    return "";
  }
}
