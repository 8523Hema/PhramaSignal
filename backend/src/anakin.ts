export async function scrapeUrl(url: string): Promise<string> {
  try {
    const submit = await fetch("https://api.anakin.io/v1/url-scraper", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url, format: "markdown", useBrowser: true })
    });
    const { jobId } = await submit.json();
    return pollJob("url-scraper", jobId);
  } catch {
    return "";
  }
}

export async function searchWeb(query: string): Promise<string> {
  try {
    const submit = await fetch("https://api.anakin.io/v1/search", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        query, 
        limit: 10,
        format: "markdown",
        extractContent: true 
      })
    });
    const { jobId } = await submit.json();
    return pollJob("search", jobId);
  } catch {
    return "";
  }
}

export async function crawlSite(url: string, maxPages = 5): Promise<string> {
  try {
    const submit = await fetch("https://api.anakin.io/v1/crawl", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        url, 
        maxPages,
        format: "markdown",
        useBrowser: true,
        followLinks: true
      })
    });
    const { jobId } = await submit.json();
    return pollJob("crawl", jobId);
  } catch {
    return "";
  }
}

export async function mapSite(url: string): Promise<string[]> {
  try {
    const submit = await fetch("https://api.anakin.io/v1/sitemap", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url })
    });
    const { jobId } = await submit.json();
    const result = await pollJob("sitemap", jobId);
    const parsed = JSON.parse(result);
    return parsed.urls || [];
  } catch {
    return [];
  }
}

export async function agenticSearch(query: string): Promise<string> {
  try {
    const submit = await fetch("https://api.anakin.io/v1/agentic-search", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        query,
        format: "markdown"
      })
    });
    const { jobId } = await submit.json();
    return pollJob("agentic-search", jobId);
  } catch {
    return "";
  }
}

export async function scrapeWithSession(
  url: string, 
  sessionId: string
): Promise<string> {
  try {
    const submit = await fetch("https://api.anakin.io/v1/url-scraper", {
      method: "POST",
      headers: {
        "X-API-Key": process.env.ANAKIN_API_KEY!,
        "Content-Type": "application/json",
        "X-Session-Id": sessionId
      },
      body: JSON.stringify({ url, format: "markdown", useBrowser: true })
    });
    const { jobId } = await submit.json();
    return pollJob("url-scraper", jobId);
  } catch {
    return "";
  }
}

async function pollJob(
  endpoint: string, 
  jobId: string, 
  maxAttempts = 20
): Promise<string> {
  if (!jobId) return "";
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const poll = await fetch(
        `https://api.anakin.io/v1/${endpoint}/${jobId}`,
        { headers: { "X-API-Key": process.env.ANAKIN_API_KEY! } }
      );
      const data = await poll.json();
      if (data.status === "completed") {
        return data.markdown || data.content || JSON.stringify(data.urls) || "";
      }
      if (data.status === "failed") return "";
    } catch {
      continue;
    }
  }
  return "";
}
