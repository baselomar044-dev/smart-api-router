// ============================================
// SOLVE IT! - Web Search API Route (Tavily)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { searchWeb } from '@/lib/ai/providers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, apiKey, options } = body as {
      query: string;
      apiKey: string;
      options?: {
        maxResults?: number;
        searchDepth?: 'basic' | 'advanced';
      };
    };
    
    if (!query) {
      return NextResponse.json(
        { error: 'استعلام البحث مطلوب' },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'مفتاح Tavily API مطلوب' },
        { status: 400 }
      );
    }
    
    const response = await searchWeb(query, apiKey, options);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في البحث' },
      { status: 500 }
    );
  }
}
