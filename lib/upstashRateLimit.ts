import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null

const datPostLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'fretraq:dat-post',
    })
  : null

export async function limitDatPost(userId: string): Promise<{
  allowed: boolean
  configured: boolean
}> {
  if (!datPostLimiter) {
    return { allowed: false, configured: false }
  }

  const result = await datPostLimiter.limit(userId)
  return { allowed: result.success, configured: true }
}
