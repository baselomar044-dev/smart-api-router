import { NextRequest, NextResponse } from 'next/server';
import { PluginManager } from '@/lib/plugin-system';

const pluginManager = new PluginManager();

export async function GET() {
  const plugins = pluginManager.listPlugins();
  return NextResponse.json({ plugins });
}

export async function POST(req: NextRequest) {
  try {
    const plugin = await req.json();
    await pluginManager.registerPlugin(plugin);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
