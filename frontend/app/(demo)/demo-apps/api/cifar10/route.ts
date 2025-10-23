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
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        // Create zip file
        await execAsync(`cd /Users/aleksamihajlovic/Documents/investor-lab/demo-service/cifar10/test_images && zip -r /tmp/test-images.zip .`);
        
        const zipBuffer = readFileSync('/tmp/test-images.zip');
        await execAsync(`rm /tmp/test-images.zip`);
        
        return new NextResponse(zipBuffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="test-images.zip"',
          },
        });
      } catch (error) {
        return NextResponse.json({ error: 'Failed to create zip' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error reading test images:', error);
    return NextResponse.json({ error: 'Failed to read test images' }, { status: 500 });
  }
}
