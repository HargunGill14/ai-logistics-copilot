import 'server-only'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export function encryptToken(token: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  })
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [iv, authTag, encrypted].map((part) => part.toString('base64url')).join('.')
}

export function decryptToken(payload: string): string {
  const [ivValue, authTagValue, encryptedValue] = payload.split('.')

  if (!ivValue || !authTagValue || !encryptedValue) {
    throw new Error('Invalid encrypted token payload')
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64url'),
    { authTagLength: AUTH_TAG_LENGTH },
  )
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

function getEncryptionKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY

  if (!secret) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured')
  }

  if (/^[a-f0-9]{64}$/i.test(secret)) {
    return Buffer.from(secret, 'hex')
  }

  const base64Key = Buffer.from(secret, 'base64')
  if (base64Key.length === 32) {
    return base64Key
  }

  return createHash('sha256').update(secret).digest()
}
