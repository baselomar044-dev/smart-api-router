// ============================================
// API ROUTE: /api/deploy - Vercel Deployment
// ============================================
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter'
import { DeploymentManager, DeploymentConfig } from '@/lib/deployment'

export async function POST(request: Request) {
  const rateLimitResponse = await withRateLimit(rateLimiters.deploy)(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { config, vercelToken } = await request.json() as {
      config: DeploymentConfig
      vercelToken: string
    }

    if (!config || !vercelToken) {
      return Response.json({ error: 'Missing config or token' }, { status: 400 })
    }

    const manager = new DeploymentManager()
    const result = await manager.deployToVercel(config, vercelToken)
    
    return Response.json(result)

  } catch (error) {
    console.error('Deployment error:', error)
    return Response.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 })
  }
}

// Download ZIP endpoint
export async function GET(request: Request) {
  const url = new URL(request.url)
  const configParam = url.searchParams.get('config')
  
  if (!configParam) {
    return Response.json({ error: 'Missing config' }, { status: 400 })
  }

  try {
    const config = JSON.parse(decodeURIComponent(configParam)) as DeploymentConfig
    const manager = new DeploymentManager()
    const blob = await manager.createZip(config)
    
    return new Response(blob, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${config.projectName}.zip"`
      }
    })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 })
  }
}
