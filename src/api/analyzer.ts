export type AnalyzerResult = {
  results: { rule: string; valid: boolean; explanation: string }[];
  suggestions: string[];
};

function normalizeAnalyzerResponse(raw: unknown): AnalyzerResult {
  // If the server returns a stringified JSON, parse it
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeAnalyzerResponse(parsed);
    } catch {
      // Try to unescape common cases like quoted JSON blocks
      const trimmed = raw.trim();
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        try {
          return JSON.parse(trimmed);
        } catch {}
      }
      throw new Error("Analyzer returned an unexpected string; could not parse JSON.");
    }
  }
  // If already an object, try to shape it
  const obj = raw as any;
  const results = Array.isArray(obj?.results) ? obj.results : [];
  const suggestions = Array.isArray(obj?.suggestions) ? obj.suggestions : [];
  return { results, suggestions };
}

/** Posts any JSON-ish payload. Uses NASA API through proxy server. */
export async function postAnalyzeRaw(payload: unknown): Promise<AnalyzerResult> {
  // Try proxy server first (bypasses CORS), then direct API, then mock
  const PROXY_URL = "http://localhost:3001/nasa-analysis";
  const DIRECT_URL = "https://amine759--nasa-habitat-validator-api.modal.run/agent";
  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.";
  
  let response;
  
  try {
    // Try proxy server first
    console.log('🔄 Trying proxy server...');
    response = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Proxy server error: ${response.status}`);
    }
    
    console.log('✅ Proxy server responded successfully');
  } catch (proxyError) {
    console.warn('⚠️ Proxy server failed, trying direct API...', proxyError);
    
    try {
      // Fallback to direct API (will likely fail due to CORS in browser)
      response = await fetch(DIRECT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-API-Key": API_KEY
        },
        body: typeof payload === "string" ? payload : JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`NASA API error: ${response.status}`);
      }
      
      console.log('✅ Direct API responded successfully');
    } catch (directError) {
      console.warn('⚠️ Direct API also failed, using mock data...', directError);
      
      // Return mock data as fallback
      return Promise.resolve({
        results: [
          { rule: "global_rules.nhv_per_crew_m3", valid: true, explanation: "Mock: NHV per crew is above threshold." },
          { rule: "habitat_rules.fairing_fit", valid: false, explanation: "Mock: Diameter exceeds fairing envelope." },
          { rule: "destination_rules.MARS_SURFACE", valid: false, explanation: "Mock: Missing redundant modules for Mars mission." },
        ],
        suggestions: ["Reduce habitat diameter", "Add redundant medical and exercise modules", "Cluster HYGIENE/WASTE/EXERCISE together"],
      });
    }
  }
  
  const text = await response.text();
  // Try JSON.parse first, then fall back to normalized string handling
  try {
    return normalizeAnalyzerResponse(JSON.parse(text));
  } catch {
    return normalizeAnalyzerResponse(text);
  }
}