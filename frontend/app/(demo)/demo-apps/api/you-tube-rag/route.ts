import { NextRequest, NextResponse } from 'next/server';

const baseUrl =
  process.env.YT_RAG_SERVICE_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8002';

  const targetUrl = `${baseUrl}/you-tube-rag`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const user_input = formData.get('user_input') as string;
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: JSON.stringify({ user_input }),
    });
    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
