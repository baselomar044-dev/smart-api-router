// ============================================
// SOLVE IT! - Image Generation API Route (DALL-E)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/lib/ai/providers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, apiKey, options } = body as {
      prompt: string;
      apiKey: string;
      options?: {
        size?: '1024x1024' | '1792x1024' | '1024x1792';
        quality?: 'standard' | 'hd';
        style?: 'vivid' | 'natural';
      };
    };
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'وصف الصورة مطلوب' },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح OpenAI API مطلوب لتوليد الصور' },
        { status: 400 }
      );
    }
    
    const response = await generateImage(prompt, apiKey, options);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Image generation API error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في توليد الصورة' },
      { status: 500 }
    );
  }
}
