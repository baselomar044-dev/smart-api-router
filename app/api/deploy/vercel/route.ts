'use server';

import { NextRequest, NextResponse } from 'next/server';

// Vercel Deployment API
export async function POST(request: NextRequest) {
  try {
    const { projectName, files, framework = 'nextjs', token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Vercel token is required' },
        { status: 400 }
      );
    }

    if (!projectName || !files || files.length === 0) {
      return NextResponse.json(
        { error: 'Project name and files are required' },
        { status: 400 }
      );
    }

    // Convert files to Vercel format
    const vercelFiles = files.map((file: { path: string; content: string }) => ({
      file: file.path.startsWith('/') ? file.path.slice(1) : file.path,
      data: Buffer.from(file.content).toString('base64'),
      encoding: 'base64'
    }));

    // Create deployment
    const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        files: vercelFiles,
        projectSettings: {
          framework: framework,
          buildCommand: framework === 'nextjs' ? 'next build' : null,
          outputDirectory: framework === 'nextjs' ? '.next' : 'dist',
          installCommand: 'npm install',
        },
        target: 'production',
      }),
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.json();
      return NextResponse.json(
        { error: error.error?.message || 'Deployment failed', details: error },
        { status: deployResponse.status }
      );
    }

    const deployment = await deployResponse.json();

    return NextResponse.json({
      success: true,
      url: `https://${deployment.url}`,
      deploymentId: deployment.id,
      projectId: deployment.projectId,
      status: deployment.readyState,
      inspectorUrl: deployment.inspectorUrl,
    });
  } catch (error) {
    console.error('Vercel deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy to Vercel' },
      { status: 500 }
    );
  }
}

// Check deployment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');
    const token = searchParams.get('token');

    if (!deploymentId || !token) {
      return NextResponse.json(
        { error: 'Deployment ID and token are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get deployment status' },
        { status: response.status }
      );
    }

    const deployment = await response.json();

    return NextResponse.json({
      status: deployment.readyState,
      url: deployment.url ? `https://${deployment.url}` : null,
      createdAt: deployment.createdAt,
      buildingAt: deployment.buildingAt,
      ready: deployment.readyState === 'READY',
      error: deployment.readyState === 'ERROR' ? deployment.errorMessage : null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check deployment status' },
      { status: 500 }
    );
  }
}
