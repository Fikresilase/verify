import type { VerifyResult } from "./types";

export async function parsePdfText(buffer: Buffer | ArrayBuffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const parsed = await pdfParse(Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer));
  return parsed.text;
}

export function extractWithRegex(htmlContent: string, labelPattern: string) {
  const escapedLabel = labelPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedLabel}.*?<\\/td>\\s*<td[^>]*>\\s*([^<]+)`, "i");
  return matchText(htmlContent, pattern);
}

export function formatReceiptTime(value: string) {
  if (!value) return "";

  const dashDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dashDateMatch) {
    const [, year, month, day, hour, minute, second = "00"] = dashDateMatch;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  const slashYearFirstMatch = value.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (slashYearFirstMatch) {
    const [, year, month, day, hour, minute, second = "00"] = slashYearFirstMatch;
    return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
  }

  const dayFirstMatch = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (dayFirstMatch) {
    const [, day, month, year, rawHour, minute, second = "00", period] = dayFirstMatch;
    let hour = Number(rawHour);
    if (period?.toUpperCase() === "PM" && hour < 12) hour += 12;
    if (period?.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${day}-${month}-${year} ${String(hour).padStart(2, "0")}:${minute}:${second}`;
  }

  return value;
}

export function matchText(text: string, regex: RegExp, group = 1) {
  return text.match(regex)?.[group]?.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim() || "";
}

export function normalizeAccountSuffix(value?: string) {
  return value?.match(/\d{4,8}/)?.[0] || "";
}

export function parseAmount(value?: string) {
  const parsed = value ? Number.parseFloat(value.replace(/[^\d.]/g, "")) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function titleCase(str?: string) {
  return str ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "";
}

export function toFailure(error: unknown, fallback: string): VerifyResult {
  console.log("[provider.local] error", error);
  return { success: false, error: error instanceof Error ? error.message : fallback };
}
