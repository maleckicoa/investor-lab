import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const baseUrl =
  process.env.YT_RAG_SERVICE_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8002';
const targetUrl = `${baseUrl}/you-tube-rag-tts`;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    const url = `${targetUrl}?prompt=${encodeURIComponent(prompt ?? '')}`;
    const resp = await fetch(url, { method: 'POST' });
    if (!resp.ok) {
      return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
    }
    const body = await resp.arrayBuffer();
    return new NextResponse(body, {
      headers: { 'Content-Type': 'audio/mpeg' },
      status: 200,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

