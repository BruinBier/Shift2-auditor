import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/tests/documentation?testName=ImgMissingAltTest
 * Retrieves the documentation for a specific test
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const testName = searchParams.get('testName');

    if (!testName) {
      return NextResponse.json(
        { error: 'testName parameter is required' },
        { status: 400 }
      );
    }

    // Read the test-documentation.ts file
    const filePath = path.join(process.cwd(), 'lib', 'crawler', 'test-documentation.ts');
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Extract the documentation for the specific test using regex
    const regex = new RegExp(`'${testName}':\\s*\`([\\s\\S]*?)\`,`, 'g');
    const match = regex.exec(fileContent);

    if (match && match[1]) {
      return NextResponse.json({
        testName,
        documentation: match[1].trim()
      });
    }

    return NextResponse.json({
      testName,
      documentation: null
    });
  } catch (error) {
    console.error('Error reading documentation:', error);
    return NextResponse.json(
      { error: 'Failed to read documentation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tests/documentation
 * Updates the documentation for a specific test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testName, documentation } = body;

    if (!testName || documentation === undefined) {
      return NextResponse.json(
        { error: 'testName and documentation are required' },
        { status: 400 }
      );
    }

    // Read the current file
    const filePath = path.join(process.cwd(), 'lib', 'crawler', 'test-documentation.ts');
    let fileContent = await fs.readFile(filePath, 'utf-8');

    // Check if the test already exists
    const existingRegex = new RegExp(`'${testName}':\\s*\`[\\s\\S]*?\`,`, 'g');
    const hasExisting = existingRegex.test(fileContent);

    if (hasExisting) {
      // Replace existing documentation
      const replaceRegex = new RegExp(`('${testName}':\\s*\`)[\\s\\S]*?(\`,)`, 'g');
      fileContent = fileContent.replace(
        replaceRegex,
        `$1${documentation}$2`
      );
    } else {
      // Add new entry before the closing brace
      const insertRegex = /(\n};[\s\S]*?export function getTestDocumentation)/;
      const newEntry = `\n  '${testName}': \`${documentation}\`,\n`;

      fileContent = fileContent.replace(
        /(\nexport const TEST_DOCUMENTATION: Record<string, string> = \{)/,
        `$1${newEntry}`
      );
    }

    // Write the updated content back to the file
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return NextResponse.json({
      success: true,
      testName,
      message: 'Documentation updated successfully'
    });
  } catch (error) {
    console.error('Error updating documentation:', error);
    return NextResponse.json(
      { error: 'Failed to update documentation' },
      { status: 500 }
    );
  }
}