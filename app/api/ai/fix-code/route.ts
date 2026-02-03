import { NextRequest, NextResponse } from 'next/server';

const PROVIDER_CONFIGS: Record<string, { url: string; modelKey: string; models: Record<string, string> }> = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    modelKey: 'model',
    models: {
      default: 'llama-3.3-70b-versatile',
      fast: 'llama-3.1-8b-instant'
    }
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    modelKey: 'model',
    models: {
      default: 'gemini-1.5-pro'
    }
  },
  deepseek: {
    url: 'https://api.deepseek.com/v1/chat/completions',
    modelKey: 'model',
    models: {
      default: 'deepseek-coder',
      chat: 'deepseek-chat'
    }
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    modelKey: 'model',
    models: {
      default: 'gpt-4-turbo-preview',
      fast: 'gpt-3.5-turbo'
    }
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    modelKey: 'model',
    models: {
      default: 'claude-3-sonnet-20240229',
      best: 'claude-3-opus-20240229'
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files, error, prompt, apiKey, provider } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const config = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.groq;
    
    // System Prompt for Fixing Code
    const systemPrompt = `You are an expert software engineer and debugger. 
You are given a dictionary of files (path -> content) and an error message or user request.
Your task is to FIX the code to resolve the error or fulfill the request.

IMPORTANT RULES:
1. Return ONLY valid JSON array of objects.
2. Each object must have "path" and "content" keys.
3. ONLY return the files that need to be changed or created.
4. Do not return markdown formatting, just the raw JSON.
5. Analyze the dependencies and imports carefully.
6. If the error is about missing modules, create a mock or shim implementation if possible, or fix the import path.

The JSON format must be:
[
  { "path": "src/App.tsx", "content": "..." },
  { "path": "package.json", "content": "..." }
]`;

    const userPrompt = `
CONTEXT:
The user is running a web application in a browser-based sandbox.
Files:
${JSON.stringify(files, null, 2)}

ERROR / REQUEST:
${error || prompt}

Please fix the code.`;

    let result = null;

    if (provider === 'gemini') {
      // Gemini API handling
      const response = await fetch(`${config.url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
          }]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates[0].content.parts[0].text;
      // Extract JSON from markdown code block if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      result = jsonMatch ? jsonMatch[1] : text;

    } else if (provider === 'anthropic') {
       // Anthropic API handling
       const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: config.models.default,
          max_tokens: 4096,
          messages: [
             { role: 'user', content: systemPrompt + "\n\n" + userPrompt }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content[0].text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      result = jsonMatch ? jsonMatch[1] : text;

    } else {
      // OpenAI / Groq / Deepseek (OpenAI-compatible)
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.models.default,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1
        })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.choices[0].message.content;
      // Extract JSON
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      result = jsonMatch ? jsonMatch[1] : text;
    }

    // Parse and Validate JSON
    let parsedFiles;
    try {
       parsedFiles = JSON.parse(result);
       if (!Array.isArray(parsedFiles)) throw new Error("Result is not an array");
    } catch (e) {
       console.error("Failed to parse AI response:", result);
       return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ files: parsedFiles });

  } catch (error: any) {
    console.error('Error generating fix:', error);
    return NextResponse.json({ error: error.message || 'Failed to fix code' }, { status: 500 });
  }
}
