// /app/api/generate/video/route.ts
// Video generation using available APIs (Gemini Veo, OpenAI Sora when available)

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, prompt, duration, imageUrl, aspectRatio } = body;

    // Validate required fields
    if (!prompt && !imageUrl) {
      return NextResponse.json({ 
        success: false, 
        error: 'Prompt or image URL is required' 
      }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'API key is required. Please configure it in Settings.' 
      }, { status: 400 });
    }

    // Handle different providers
    if (provider === 'gemini') {
      // Try Gemini Veo API
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateVideo?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: prompt,
              videoConfig: {
                aspectRatio: aspectRatio || '16:9',
                durationSeconds: Math.min(duration || 5, 8), // Veo max ~8s
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.video?.url || data.videoUri) {
            return NextResponse.json({
              success: true,
              url: data.video?.url || data.videoUri,
              provider: 'gemini-veo',
              duration: duration || 5
            });
          }
        }

        // If Veo not available, return helpful message
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404 || response.status === 400) {
          return NextResponse.json({
            success: false,
            error: 'Gemini Veo video generation is not yet available in your region or API tier. Try using Image Generation instead, or check Google AI Studio for access.'
          }, { status: 400 });
        }

        throw new Error(errorData.error?.message || 'Gemini video generation failed');
      } catch (error: any) {
        // Fallback message
        return NextResponse.json({
          success: false,
          error: error.message || 'Gemini Veo is not yet publicly available via API. Check Google AI Studio for early access.'
        }, { status: 400 });
      }
    }

    if (provider === 'openai') {
      // Try OpenAI Sora API (when available)
      try {
        // Note: Sora API endpoint is not publicly available yet
        // This is a placeholder for when it becomes available
        const response = await fetch('https://api.openai.com/v1/videos/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'sora-1',
            prompt: prompt,
            duration: Math.min(duration || 5, 60),
            size: aspectRatio === '9:16' ? '1080x1920' : aspectRatio === '1:1' ? '1080x1080' : '1920x1080'
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.[0]?.url) {
            return NextResponse.json({
              success: true,
              url: data.data[0].url,
              provider: 'openai-sora',
              duration: duration || 5
            });
          }
        }

        // If Sora not available
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          return NextResponse.json({
            success: false,
            error: 'OpenAI Sora is not yet publicly available via API. It is currently in limited beta access.'
          }, { status: 400 });
        }

        throw new Error(errorData.error?.message || 'OpenAI video generation failed');
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message || 'OpenAI Sora API is not yet publicly available. Check OpenAI website for early access.'
        }, { status: 400 });
      }
    }

    // Unknown provider
    return NextResponse.json({
      success: false,
      error: `Provider "${provider}" is not supported for video generation`
    }, { status: 400 });

  } catch (error: any) {
    console.error('Video generation error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate video. Video generation APIs are still in limited availability.'
    }, { status: 500 });
  }
}
