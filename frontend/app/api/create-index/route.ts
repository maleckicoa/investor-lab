import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      indexSize,
      indexCurrency,
      indexStartDate,
      indexEndDate,
      selectedCountries,
      selectedSectors,
      selectedIndustries,
      selectedKPIs,
      selectedStocks
    } = body;

    // Validate required parameters
    if (!indexSize || !indexCurrency || !indexStartDate || !indexEndDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Prepare the command to run index_maker.py
    const stockServicePath = path.join(process.cwd(), '..', 'stock-service');
    const scriptPath = path.join(stockServicePath, 'src', 'index_maker.py');
    
    // Create a Python script that will be executed with the parameters
    const pythonScript = `
import sys
import json
import os

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Import the index maker
from index_maker import create_custom_index

# Parse the parameters from command line arguments
params = json.loads('''${JSON.stringify({
      indexSize,
      indexCurrency,
      indexStartDate,
      indexEndDate,
      selectedCountries,
      selectedSectors,
      selectedIndustries,
      selectedKPIs,
      selectedStocks
    })}''')

# Create the custom index
result = create_custom_index(
    index_size=params['indexSize'],
    currency=params['indexCurrency'],
    start_date=params['indexStartDate'],
    end_date=params['indexEndDate'],
    countries=params['selectedCountries'],
    sectors=params['selectedSectors'],
    industries=params['selectedIndustries'],
    kpis=params['selectedKPIs'],
    stocks=params['selectedStocks']
)

# Ensure we only print the JSON result, not any debug prints
print(json.dumps(result))
`;

    // Write the temporary Python script
    const tempScriptPath = path.join(stockServicePath, 'temp_index_creator.py');
    const fs = require('fs');
    fs.writeFileSync(tempScriptPath, pythonScript);

    // Execute the Python script
    const { stdout, stderr } = await execAsync(
      `cd "${stockServicePath}" && python temp_index_creator.py`,
      { timeout: 300000 } // 5 minute timeout
    );

    // Clean up temporary file
    try {
      fs.unlinkSync(tempScriptPath);
    } catch (cleanupError) {
      console.warn('Could not clean up temporary script:', cleanupError);
    }

    // Log all output for debugging
    console.log('Python stdout:', stdout);
    if (stderr) {
      console.warn('Python script stderr:', stderr);
    }

    // Parse the result
    let result;
    let jsonLine = '';
    try {
      // Find the last line that contains JSON (in case there are other prints)
      const lines = stdout.trim().split('\n');
      
      // Look for the last line that might contain JSON
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line && (line.startsWith('{') || line.startsWith('['))) {
          jsonLine = line;
          break;
        }
      }
      
      if (!jsonLine) {
        throw new Error('No JSON output found in Python script');
      }
      
      result = JSON.parse(jsonLine);
    } catch (parseError) {
      console.error('Failed to parse Python output:', parseError);
      console.log('Raw output:', stdout);
      console.log('Attempted to parse:', jsonLine || 'No JSON line found');
      return NextResponse.json(
        { error: 'Failed to parse index creation result', details: parseError instanceof Error ? parseError.message : 'Unknown error', rawOutput: stdout },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Index created successfully',
      result
    });

  } catch (error) {
    console.error('Index creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create index', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
