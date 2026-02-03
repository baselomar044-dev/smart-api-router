/**
 * 📁 FILE PARSING API
 * Parses PDF, Word, Excel files on the server side
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fileType, fileName, base64Content } = await request.json();
    
    if (!base64Content) {
      return NextResponse.json({ error: 'No file content provided' }, { status: 400 });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Content, 'base64');
    
    let parsedContent = '';
    let metadata: Record<string, unknown> = {};
    
    switch (fileType) {
      case 'pdf':
        const pdfResult = await parsePDF(buffer);
        parsedContent = pdfResult.text;
        metadata = { pages: pdfResult.pages };
        break;
        
      case 'word':
        parsedContent = await parseWord(buffer);
        break;
        
      case 'excel':
        const excelResult = await parseExcel(buffer);
        parsedContent = excelResult.text;
        metadata = { sheets: excelResult.sheets };
        break;
        
      default:
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      content: parsedContent,
      metadata,
      fileName
    });
    
  } catch (error) {
    console.error('File parsing error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to parse file'
    }, { status: 500 });
  }
}

// Parse PDF using pdf-parse
async function parsePDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    // Dynamic import to avoid issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    
    return {
      text: data.text || '',
      pages: data.numpages || 0
    };
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to parse PDF. Make sure it\'s a valid PDF file.');
  }
}

// Parse Word document using mammoth
async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('Word parse error:', error);
    throw new Error('Failed to parse Word document. Make sure it\'s a valid .docx file.');
  }
}

// Parse Excel using xlsx
async function parseExcel(buffer: Buffer): Promise<{ text: string; sheets: string[] }> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const sheets = workbook.SheetNames;
    let text = '';
    
    for (const sheetName of sheets) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      
      if (data.length === 0) continue;
      
      text += `\n## Sheet: ${sheetName}\n\n`;
      
      // Get headers
      const headers = data[0] as string[];
      if (headers && headers.length > 0) {
        text += '| ' + headers.map(h => String(h || '')).join(' | ') + ' |\n';
        text += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        
        // Add data rows (limit to 500 rows per sheet)
        const maxRows = Math.min(data.length, 501);
        for (let i = 1; i < maxRows; i++) {
          const row = data[i] as unknown[];
          if (!row) continue;
          const cells = row.map(cell => {
            if (cell === null || cell === undefined) return '';
            return String(cell).replace(/\|/g, '\\|').replace(/\n/g, ' ').substring(0, 100);
          });
          text += '| ' + cells.join(' | ') + ' |\n';
        }
        
        if (data.length > 501) {
          text += `\n*... and ${data.length - 501} more rows*\n`;
        }
      }
    }
    
    return { text, sheets };
  } catch (error) {
    console.error('Excel parse error:', error);
    throw new Error('Failed to parse Excel file. Make sure it\'s a valid .xlsx file.');
  }
}
