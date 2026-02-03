import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const { files, projectName } = await request.json();
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 });
    }

    const zip = new JSZip();
    const rootFolder = projectName?.toLowerCase().replace(/\s+/g, '-') || 'project';

    // Add each file to the zip
    files.forEach((file: { path: string; content: string }) => {
      // Remove leading slash and add to root folder
      const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
      zip.file(`${rootFolder}/${filePath}`, file.content);
    });

    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    // Return as downloadable file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${rootFolder}.zip"`,
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
