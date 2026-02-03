// ============================================
// 4. RATE LIMITING SYSTEM
// ============================================

interface RateLimitConfig {
  windowMs: number        // Time window in milliseconds
  maxRequests: number     // Max requests per window
  keyPrefix?: string      // Prefix for storage keys
  onLimitReached?: (key: string) => void
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (for single server deployment)
class MemoryStore {
  private store = new Map<string, RateLimitEntry>()

  get(key: string): RateLimitEntry | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }
    return entry
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const existing = this.get(key)
    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    }
    const newEntry = { count: 1, resetTime: Date.now() + windowMs }
    this.store.set(key, newEntry)
    return newEntry
  }
}

// Redis store (for distributed deployment)
class RedisStore {
  private redis: any // Redis client

  constructor(redisClient: any) {
    this.redis = redisClient
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const multi = this.redis.multi()
    multi.incr(key)
    multi.pttl(key)
    const results = await multi.exec()
    
    const count = results[0][1]
    let ttl = results[1][1]
    
    if (ttl === -1) {
      await this.redis.pexpire(key, windowMs)
      ttl = windowMs
    }

    return { count, resetTime: Date.now() + ttl }
  }
}

// Rate Limiter class
export class RateLimiter {
  private config: RateLimitConfig
  private store: MemoryStore | RedisStore

  constructor(config: RateLimitConfig, redisClient?: any) {
    this.config = {
      keyPrefix: 'rl:',
      windowMs: config.windowMs || 60 * 1000,  // Default: 1 minute
      maxRequests: config.maxRequests || 60,   // Default: 60 requests
    }
    this.store = redisClient ? new RedisStore(redisClient) : new MemoryStore()
  }

  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
    const fullKey = `${this.config.keyPrefix}${key}`
    const entry = this.store instanceof MemoryStore 
      ? this.store.increment(fullKey, this.config.windowMs)
      : await this.store.increment(fullKey, this.config.windowMs)

    const allowed = entry.count <= this.config.maxRequests
    const remaining = Math.max(0, this.config.maxRequests - entry.count)
    const resetIn = Math.max(0, entry.resetTime - Date.now())

    if (!allowed && this.config.onLimitReached) {
      this.config.onLimitReached(key)
    }

    return { allowed, remaining, resetIn }
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // API calls - 100 per minute
  api: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'api:' }),
  
  // AI generation - 30 per minute
  ai: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'ai:' }),
  
  // File uploads - 10 per minute
  upload: new RateLimiter({ windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'upload:' }),
  
  // Authentication - 5 attempts per 15 minutes
  auth: new RateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5, keyPrefix: 'auth:' }),
  
  // Deployments - 5 per hour
  deploy: new RateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 5, keyPrefix: 'deploy:' })
}

// Middleware for Next.js API routes
export function withRateLimit(limiter: RateLimiter, getKey?: (req: Request) => string) {
  return async function rateLimitMiddleware(req: Request): Promise<Response | null> {
    const key = getKey?.(req) || getClientIP(req) || 'anonymous'
    const result = await limiter.check(key)

    if (!result.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(result.resetIn / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(limiter['config'].maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetIn / 1000)),
          'Retry-After': String(Math.ceil(result.resetIn / 1000))
        }
      })
    }

    return null // Continue to handler
  }
}

// Helper to get client IP
function getClientIP(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  return realIP
}

