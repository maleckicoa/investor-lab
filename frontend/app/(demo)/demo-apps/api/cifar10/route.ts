import { NextRequest, NextResponse } from 'next/server';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const baseUrl =
  process.env.DEMO_SERVICE_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Forward to FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append('file', file, file.name);

    const targetUrl = `${baseUrl}/demo-api/predict/`;
    console.log('cifar10 proxy request', {
      baseUrl,
      requestUrl: request.url,
      targetUrl,
    });
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: backendFormData,
    });
    
    const result = await response.json();
    console.log('cifar10 proxy response', {
      status: response.status,
      ok: response.ok,
      result,
    });
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

      const response = await fetch(`${baseUrl}/demo-api/download-test-images`);

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
