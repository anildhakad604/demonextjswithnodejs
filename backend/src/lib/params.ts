import { ApiError } from "../middleware/errorHandler.js";

export function requireParam(value: string | string[] | undefined, name = "id"): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(400, `Missing or invalid parameter: ${name}`);
  }
  return value;
}
