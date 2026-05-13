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

const importLoadsLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'fretraq:import-loads',
    })
  : null

const importCarriersLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 h'),
      prefix: 'fretraq:import-carriers',
    })
  : null

const emailDraftLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      prefix: 'fretraq:email-draft',
    })
  : null

const emailSendLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'fretraq:email-send',
    })
  : null

const qboSyncLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'fretraq:qbo-sync',
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

export async function limitImportLoads(userId: string): Promise<{
  allowed: boolean
  configured: boolean
}> {
  if (!importLoadsLimiter) {
    return { allowed: false, configured: false }
  }

  const result = await importLoadsLimiter.limit(userId)
  return { allowed: result.success, configured: true }
}

export async function limitImportCarriers(userId: string): Promise<{
  allowed: boolean
  configured: boolean
}> {
  if (!importCarriersLimiter) {
    return { allowed: false, configured: false }
  }

  const result = await importCarriersLimiter.limit(userId)
  return { allowed: result.success, configured: true }
}

export async function limitEmailDraft(userId: string): Promise<{
  allowed: boolean
  configured: boolean
}> {
  if (!emailDraftLimiter) {
    return { allowed: false, configured: false }
  }

  const result = await emailDraftLimiter.limit(userId)
  return { allowed: result.success, configured: true }
}

export async function limitEmailSend(userId: string): Promise<{
  allowed: boolean
  configured: boolean
}> {
  if (!emailSendLimiter) {
    return { allowed: false, configured: false }
  }

  const result = await emailSendLimiter.limit(userId)
  return { allowed: result.success, configured: true }
}

export async function limitQboSync(userId: string): Promise<{
  allowed: boolean
  configured: boolean
}> {
  if (!qboSyncLimiter) {
    return { allowed: false, configured: false }
  }

  const result = await qboSyncLimiter.limit(userId)
  return { allowed: result.success, configured: true }
}
