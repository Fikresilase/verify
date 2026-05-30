import https from "https";
import { fetchWithTimeout, readTimeoutMs } from "../httpTimeout";

const browserHeaders = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
};

export async function fetchJson<T>(url: string, headers?: Record<string, string>) {
  const response = await fetchWithTimeout(url, { headers: { ...browserHeaders, ...headers } }, providerTimeoutMs());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchText(url: string) {
  const response = await fetchWithTimeout(url, { headers: browserHeaders }, providerTimeoutMs());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export async function fetchArrayBuffer(
  url: string,
  options: { accept?: string; authorization?: string; insecureHttps?: boolean } = {},
) {
  const response = await fetchWithTimeout(url, {
    headers: {
      ...browserHeaders,
      ...(options.accept ? { Accept: options.accept } : {}),
      ...(options.authorization ? { Authorization: options.authorization } : {}),
    },
    agent: options.insecureHttps ? new https.Agent({ rejectUnauthorized: false }) : undefined,
  }, providerTimeoutMs());
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function providerTimeoutMs() {
  return readTimeoutMs(process.env.PROVIDER_TIMEOUT_MS, 15000);
}
