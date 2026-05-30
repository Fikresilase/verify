import { fetchWithTimeout, readTimeoutMs } from "../httpTimeout";
import { formatReceiptTime, parseAmount, toFailure } from "./parsers";
import type { VerifyResult } from "./types";

export async function verifyTelebirr(reference: string): Promise<VerifyResult> {
  const apiKey = process.env.VERIFY_API_KEY;
  const baseUrl = process.env.VERIFY_API_BASE_URL || "https://verifyapi.leulzenebe.pro";

  if (!apiKey) {
    return { success: false, error: "Missing VERIFY_API_KEY for Telebirr verifier API" };
  }

  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/verify-telebirr`,
      {
        body: JSON.stringify({ reference }),
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        method: "POST",
      },
      readTimeoutMs(process.env.PROVIDER_TIMEOUT_MS, 15000),
    );

    if (!response.ok) {
      return { success: false, error: `Telebirr verifier API HTTP ${response.status}` };
    }

    const payload = await response.json();
    const data = payload.data || payload;

    if (!payload.success && !data.receiptNo) {
      return { success: false, error: "Telebirr verifier API returned invalid response" };
    }

    return {
      amount: parseAmount(data.totalPaidAmount || data.totalAmount || data.settledAmount),
      payer: data.payerName,
      payerAccount: data.payerTelebirrNo,
      receiver: data.creditedPartyName,
      receiverAccount: data.creditedPartyAccountNo,
      reference: data.receiptNo || reference,
      success: true,
      time: formatReceiptTime(data.paymentDate || ""),
    };
  } catch (error) {
    return toFailure(error, "Telebirr verifier API failed");
  }
}
