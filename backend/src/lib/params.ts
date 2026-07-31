import { z } from "zod";
import { ApiError } from "../middleware/errorHandler.js";

export function requireParam(value: string | string[] | undefined, name = "id"): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(400, `Missing or invalid parameter: ${name}`);
  }
  return value;
}

/// z.coerce.boolean() is a trap for multipart/form-data and query-string
/// input: every value arrives as a string, and JS's `Boolean(str)` treats
/// any non-empty string — including the literal text "false" — as truthy.
/// Use this instead anywhere a boolean can arrive as a string ("true"/"false")
/// as well as a real boolean (already-parsed JSON body).
export function zBoolean() {
  return z.union([z.boolean(), z.string()]).transform((val) => (typeof val === "string" ? val === "true" : val));
}
