import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { initData } = (await request.json()) as { initData?: string };

  if (!initData) {
    return NextResponse.json({ ok: false, error: "Missing initData" }, { status: 400 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  const result = verifyTelegramInitData(initData, botToken);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Invalid Telegram signature" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user: result.user });
}

function verifyTelegramInitData(initData: string, botToken: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return { ok: false };
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");

  if (hashBuffer.length !== calculatedBuffer.length || !timingSafeEqual(hashBuffer, calculatedBuffer)) {
    return { ok: false };
  }

  const userParam = params.get("user");
  const user = userParam ? JSON.parse(userParam) : null;

  return { ok: true, user };
}
