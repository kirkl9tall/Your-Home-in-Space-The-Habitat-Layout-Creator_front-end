// src/lib/validation.ts
import { z } from "zod";
import { LayoutSchema, Layout } from "./schemas";

/**
 * Validate a layout object strictly.
 * Throws if invalid.
 */
export function validateLayout(payload: unknown): Layout {
  return LayoutSchema.parse(payload);
}

/**
 * Safe parse: returns result object without throwing.
 */
export function safeParseLayout(payload: unknown): {
  success: boolean;
  data?: Layout;
  errors?: string[];
} {
  const result = LayoutSchema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`)
  };
}

/**
 * Pretty-print validation errors (for logging/UI).
 */
export function formatValidationErrors(errors: string[] | undefined): string {
  if (!errors || errors.length === 0) return "No validation errors.";
  return errors.map((err, i) => `#${i + 1} ${err}`).join("\n");
}

/**
 * Try validating and throw a descriptive error if invalid.
 * Useful for API boundary checks.
 */
export function assertValidLayout(payload: unknown): asserts payload is Layout {
  const result = LayoutSchema.safeParse(payload);
  if (!result.success) {
    const message = result.error.errors
      .map(e => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid layout payload:\n${message}`);
  }
}
