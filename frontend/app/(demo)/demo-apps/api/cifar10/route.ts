import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    
    if (action === 'download-test-images') {

      const API_BASE = process.env.NODE_ENV === 'production'
      ? 'https://maleckicoa.com/demo-api'
      : 'http://localhost:8001';
      console.log('API_BASE', process.env.NODE_ENV);

      const response = await fetch(`${API_BASE}/download-test-images`);

      // Forward to demo-service
      //const response = await fetch('http://localhost:8001/download-test-images');
      
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="test-images.zip"',
          },
        });
      } else {
        return NextResponse.json({ error: 'Failed to download from demo-service' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error reading test images:', error);
    return NextResponse.json({ error: 'Failed to read test images' }, { status: 500 });
  }
}
