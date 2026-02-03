// FIXED: /app/api/generate/image/route.ts
// Added error handling and proper provider mapping

import { NextRequest, NextResponse } from 'next/server';
import { imageProviders } from '@/lib/media-generation';

// Map frontend provider names to backend keys
const PROVIDER_MAP: Record<string, keyof typeof imageProviders> = {
  'pollinations': 'pollinations',
  'free': 'pollinations',
  'dall-e': 'dalle',
  'dalle': 'dalle',
  'openai': 'dalle',
  'gemini': 'gemini',
  'google': 'gemini',
  'stability': 'stability',
  'midjourney': 'replicate',
  'imagen': 'gemini',
  'replicate': 'replicate',
  'flux': 'replicate'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, prompt, size, quality, n } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt is required' 
      }, { status: 400 });
    }

    // Map provider to backend key
    const backendProvider = PROVIDER_MAP[provider] || 'pollinations';
    
    // Pollinations is FREE - no API key needed!
    if (!apiKey && backendProvider !== 'pollinations') {
      return NextResponse.json({ 
        success: false, 
        error: 'API key is required for this provider. Use "pollinations" for free generation or configure API key in Settings.' 
      }, { status: 400 });
    }
    
    // Check if provider exists
    if (!imageProviders[backendProvider]) {
      return NextResponse.json({ 
        success: false, 
        error: `Provider "${provider}" is not supported` 
      }, { status: 400 });
    }

    // Parse size to width/height
    let width = 1024;
    let height = 1024;
    if (size) {
      const [w, h] = size.split('x').map(Number);
      if (w && h) {
        width = w;
        height = h;
      }
    }

    // Generate image
    const url = await imageProviders[backendProvider].generate(
      { 
        prompt, 
        width, 
        height,
        steps: quality ? Math.round(quality / 3) : 30 // Map quality % to steps
      }, 
      apiKey
    );

    return NextResponse.json({ 
      success: true, 
      url,
      provider: backendProvider,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Return user-friendly error messages
    let errorMessage = 'Failed to generate image';
    
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      errorMessage = 'Invalid API key. Please check your API key in Settings.';
    } else if (error.message?.includes('429') || error.message?.includes('rate')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('400')) {
      errorMessage = 'Invalid request. Please check your prompt and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
