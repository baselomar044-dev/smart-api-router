// ============================================
// SOLVE IT! - Tool Execution API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { Tool, ToolParameter } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, parameters } = body as {
      tool: Tool;
      parameters: Record<string, any>;
    };
    
    if (!tool) {
      return NextResponse.json(
        { error: 'الأداة مطلوبة' },
        { status: 400 }
      );
    }
    
    // Validate required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        return NextResponse.json(
          { error: `المعامل "${param.name}" مطلوب` },
          { status: 400 }
        );
      }
    }
    
    let result: any;
    
    if (tool.type === 'http') {
      // Execute HTTP tool
      result = await executeHttpTool(tool, parameters);
    } else if (tool.type === 'function') {
      // Execute function tool
      result = await executeFunctionTool(tool, parameters);
    } else {
      return NextResponse.json(
        { error: 'نوع أداة غير مدعوم' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      result,
      tool: tool.name,
    });
  } catch (error: any) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'حدث خطأ في تنفيذ الأداة' 
      },
      { status: 500 }
    );
  }
}

async function executeHttpTool(tool: Tool, parameters: Record<string, any>): Promise<any> {
  if (!tool.url) {
    throw new Error('URL الأداة غير محدد');
  }
  
  let url = tool.url;
  const method = tool.method || 'GET';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...tool.headers,
  };
  
  // Replace URL parameters
  for (const [key, value] of Object.entries(parameters)) {
    url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  
  // Add body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    fetchOptions.body = JSON.stringify(parameters);
  }
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

async function executeFunctionTool(tool: Tool, parameters: Record<string, any>): Promise<any> {
  if (!tool.code) {
    throw new Error('كود الدالة غير محدد');
  }
  
  // Create a safe execution context
  // WARNING: This is simplified - in production use a proper sandbox
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  
  try {
    // Wrap the code to return the result
    const wrappedCode = `
      const params = arguments[0];
      ${tool.code}
    `;
    
    const fn = new AsyncFunction(wrappedCode);
    const result = await fn(parameters);
    return result;
  } catch (error: any) {
    throw new Error(`خطأ في تنفيذ الدالة: ${error.message}`);
  }
}
