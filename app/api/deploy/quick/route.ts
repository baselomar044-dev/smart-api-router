// ============================================
// API ROUTE: /api/deploy/quick - Quick Deploy (No tokens needed)
// Creates a shareable preview without external services
// ============================================
import { NextResponse } from 'next/server';

// In-memory storage for quick deploys (in production, use Redis/database)
const deployments = new Map<string, { html: string; created: number }>();

// Clean old deployments (older than 1 hour)
const cleanOldDeployments = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, data] of deployments.entries()) {
    if (data.created < oneHourAgo) {
      deployments.delete(id);
    }
  }
};

// Generate short ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 10);
};

export async function POST(request: Request) {
  try {
    const { html, projectName } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'Missing HTML content' }, { status: 400 });
    }

    // Clean old deployments
    cleanOldDeployments();

    // Generate unique ID
    const id = generateId();
    
    // Store the deployment
    deployments.set(id, {
      html,
      created: Date.now()
    });

    // Return the preview URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const previewUrl = `${baseUrl}/api/deploy/quick?id=${id}`;

    return NextResponse.json({
      success: true,
      url: previewUrl,
      id,
      expiresIn: '1 hour',
      message: 'Quick deploy successful! Link expires in 1 hour.'
    });

  } catch (error) {
    console.error('Quick deploy error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}

// Serve the deployed HTML
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response('<h1>Missing deployment ID</h1>', {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  const deployment = deployments.get(id);

  if (!deployment) {
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deployment Not Found</title>
        <style>
          body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: white; }
          .container { text-align: center; padding: 40px; }
          h1 { font-size: 48px; margin-bottom: 20px; }
          p { color: #888; }
          a { color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>😕</h1>
          <h2>Deployment Not Found</h2>
          <p>This preview link has expired or doesn't exist.</p>
          <p>Quick deploys expire after 1 hour.</p>
          <p><a href="/">Create a new project →</a></p>
        </div>
      </body>
      </html>
    `, {
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Serve the HTML with proper headers
  return new Response(deployment.html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-cache'
    }
  });
}
