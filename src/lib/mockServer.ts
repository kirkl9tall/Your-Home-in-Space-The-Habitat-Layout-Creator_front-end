// src/lib/mockServer.ts
/**
 * A tiny mock server to intercept fetch() calls for demo/testing.
 * You can mount this in dev mode before rendering your app.
 */

import { Layout } from "./schemas";
import { CheckResponse, SuggestResponse } from "./api";

// --- Sample responses ---

const sampleCheckResponse: CheckResponse = {
  valid: false,
  issues: [
    {
      id: "ISS-001",
      severity: "error",
      message: "FOOD_PREP adjacent to HYGIENE violates separation rule.",
      moduleIds: ["galley-01", "hyg-01"],
      rule: "adjacency.food_hygiene"
    },
    {
      id: "ISS-002",
      severity: "warn",
      message: "EXERCISE area below recommended minimum per crew.",
      moduleIds: ["ex-01"],
      rule: "area.exercise.min"
    }
  ],
  metrics: {
    nhv_m3: 298.0,
    pressurized_m3: 400.0,
    utilization_ratio: 0.74,
    corridor_clearance_ok: true
  },
  suggestions: [
    {
      id: "SUG-101",
      label: "Move galley away from hygiene",
      description: "Prevents cross-contamination and noise issues.",
      patch: { op: "move", moduleId: "galley-01", position: [2.5, 3.2] }
    },
    {
      id: "SUG-102",
      label: "Increase EXERCISE area",
      description: "Meets target per crew.",
      patch: { op: "resize", moduleId: "ex-01", size: { w_m: 3.5, l_m: 4.5, h_m: 2.5 } }
    }
  ]
};

const sampleSuggestResponse: SuggestResponse = {
  suggestions: [
    {
      id: "SUG-201",
      label: "Swap WORKSTATION and STOWAGE",
      description: "Improves workflow and noise separation.",
      patch: { op: "swap", moduleA: "ws-01", moduleB: "stow-01" }
    }
  ]
};

// --- Mock server ---

export function enableMockServer() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    if (url.endsWith("/check_layout") && init?.method === "POST") {
      // you could inspect body here to customize response
      return new Response(JSON.stringify(sampleCheckResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.endsWith("/suggest_layout") && init?.method === "POST") {
      return new Response(JSON.stringify(sampleSuggestResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // fall back to real fetch for everything else
    return originalFetch(input, init);
  };

  console.info("✅ Mock server enabled for /check_layout and /suggest_layout");
}

export function disableMockServer() {
  // restore original fetch
  delete (window as any).fetch;
  console.info("❌ Mock server disabled");
}
