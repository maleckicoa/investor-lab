import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TtsChunk = {
  index: number;
  text: string;
};

function splitLongSentence(sentence: string, maxLen: number): string[] {
  const parts: string[] = [];
  let remaining = sentence.trim();
  while (remaining.length > maxLen) {
    // Try to break at last space before maxLen
    const slice = remaining.slice(0, maxLen + 1);
    const lastSpace = slice.lastIndexOf(" ");
    const cut = lastSpace > 50 ? lastSpace : maxLen; // avoid tiny trailing piece
    parts.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

function chunkTextBySentences(text: string, maxLen = 300): string[] {
  if (!text) return [];
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  // Match sentences with trailing punctuation . ! ? possibly followed by quote/bracket and space
  const sentenceRegex = /[^.!?]+[.!?]+(?=\s|$)/g;
  const sentences = normalized.match(sentenceRegex) || [normalized];

  const chunks: string[] = [];
  let current = "";

  for (const sentenceRaw of sentences) {
    const sentence = sentenceRaw.trim();
    if (sentence.length > maxLen) {
      // Flush current if any
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      // Break overly long sentence into smaller parts
      const parts = splitLongSentence(sentence, maxLen);
      for (const p of parts) {
        chunks.push(p);
      }
      continue;
    }

    if ((current + " " + sentence).trim().length <= maxLen) {
      current = (current ? current + " " : "") + sentence;
    } else {
      if (current) chunks.push(current.trim());
      current = sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text: string | undefined = body.text ?? body.prompt;
    const voice: string = body.voice ?? "echo";
    const model: string = body.model ?? "gpt-4o-mini-tts";
    const format: string = body.format ?? "mp3";

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const chunks = chunkTextBySentences(text, 200);
    if (chunks.length === 0) {
      return NextResponse.json({ segments: [] });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing OPENAI_API_KEY" }, { status: 500 });
    }

    const requests = chunks.map(async (chunk, index) => {
      const resp = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          voice,
          input: chunk,
          format
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text().catch(() => "");
        throw new Error(`TTS failed for chunk ${index}: ${resp.status} ${errorText}`);
      }

      const arrayBuf = await resp.arrayBuffer();
      const base64 = Buffer.from(arrayBuf).toString("base64");
      const mime = format === "wav" ? "audio/wav" : "audio/mpeg";
      return { index, audioBase64: base64, mime };
    });

    // Execute all TTS requests in parallel
    const results = await Promise.all(requests);

    // Ensure ordered by index
    results.sort((a, b) => a.index - b.index);

    return NextResponse.json({ segments: results }, { status: 200 });
  } catch (err: any) {
    console.error("you-tube-rag-tts-multi error:", err?.message || err);
    return NextResponse.json({ error: "TTS processing failed" }, { status: 500 });
  }
}


