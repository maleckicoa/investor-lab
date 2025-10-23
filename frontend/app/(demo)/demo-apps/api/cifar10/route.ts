import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    
    const response = await fetch('http://localhost:8001/predict', {
      method: 'POST',
      body: backendFormData,
    });
    
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
