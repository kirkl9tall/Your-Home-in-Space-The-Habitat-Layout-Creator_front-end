// src/lib/api.ts
import { z } from "zod";
import { LayoutSchema, Layout } from "./schemas";

/** ================================
 * Response Schemas
 * ================================ */

// /check_layout response
export const CheckResponseSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.object({
    id: z.string(),
    severity: z.enum(["info", "warn", "error"]),
    message: z.string(),
    moduleIds: z.array(z.string()).optional(),
    rule: z.string().optional()
  })),
  metrics: z.object({
    nhv_m3: z.number().optional(),
    pressurized_m3: z.number().optional(),
    utilization_ratio: z.number().optional(),
    corridor_clearance_ok: z.boolean().optional()
  }).optional(),
  suggestions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    patch: z.unknown()   // backend-defined patch payload
  })).optional()
});
export type CheckResponse = z.infer<typeof CheckResponseSchema>;

// /suggest_layout response
export const SuggestResponseSchema = z.object({
  suggestions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    patch: z.unknown()
  }))
});
export type SuggestResponse = z.infer<typeof SuggestResponseSchema>;

/** ================================
 * API Helpers
 * ================================ */

async function postJSON<T>(url: string, body: unknown, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`${url} failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return schema.parse(json);
}

/** ================================
 * Public API
 * ================================ */

/**
 * Validate layout against backend rules.
 */
export async function postCheckLayout(layout: Layout): Promise<CheckResponse> {
  // validate request before sending
  const parsed = LayoutSchema.parse(layout);
  return postJSON("/check_layout", parsed, CheckResponseSchema);
}

/**
 * Get backend suggestions for improving layout.
 */
export async function postSuggestLayout(layout: Layout): Promise<SuggestResponse> {
  const parsed = LayoutSchema.parse(layout);
  return postJSON("/suggest_layout", parsed, SuggestResponseSchema);
}
