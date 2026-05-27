import { NextRequest, NextResponse } from "next/server";
import { extractionJsonSchema, providerHints, type ExtractedReceipt } from "../../../lib/verification";

const model = "qwen/qwen3-vl-8b-instruct";

export async function POST(request: NextRequest) {
  const { image } = (await request.json()) as { image?: string };

  if (!image) {
    return NextResponse.json({ ok: false, error: "Missing receipt image" }, { status: 400 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: [
            {
              text: [
                "Extract Ethiopian payment receipt verification fields.",
                "Return only JSON matching the provided schema.",
                "Use empty strings for unreadable fields.",
                ...providerHints,
              ].join("\n"),
              type: "text",
            },
            {
              image_url: { url: image },
              type: "image_url",
            },
          ],
          role: "user",
        },
      ],
      model,
      response_format: {
        json_schema: {
          name: "ethiopian_receipt_extraction",
          schema: extractionJsonSchema,
          strict: true,
        },
        type: "json_schema",
      },
      temperature: 0,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Verification Hub",
    },
    method: "POST",
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, error: "OpenRouter extraction failed" }, { status: 502 });
  }

  const completion = await response.json();
  const content = completion.choices?.[0]?.message?.content;
  const extracted = JSON.parse(content) as ExtractedReceipt;

  return NextResponse.json({ ok: true, extracted });
}
