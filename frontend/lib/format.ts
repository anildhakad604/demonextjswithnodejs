export function formatINR(value: string | number): string {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}
