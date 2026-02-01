import crypto from 'crypto'
import { prisma } from '~~/server/utils/db'

interface AdminSessionPayload {
  uid: string
  role: 'ADMIN' | 'OWNER'
  exp: number
  ver: 1
}

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function sign(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function parseToken(token: string, secret: string): AdminSessionPayload | null {
  const [payloadPart, signature] = token.split('.')
  if (!payloadPart || !signature) return null

  const expectedSignature = sign(payloadPart, secret)
  if (!safeEqual(signature, expectedSignature)) return null

  try {
    const parsed = JSON.parse(base64UrlDecode(payloadPart)) as AdminSessionPayload
    if (parsed.ver !== 1) return null
    if (typeof parsed.uid !== 'string' || typeof parsed.role !== 'string') return null
    if (typeof parsed.exp !== 'number') return null
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null
    return parsed
  } catch {
    return null
  }
}

export function getAdminSessionTtlSeconds() {
  return TOKEN_TTL_SECONDS
}

export function createAdminSessionToken(input: { uid: string; role: 'ADMIN' | 'OWNER' }, secret: string): string {
  const payload: AdminSessionPayload = {
    uid: input.uid,
    role: input.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    ver: 1
  }
  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const signature = sign(payloadPart, secret)
  return `${payloadPart}.${signature}`
}

export async function getAdminFromEvent(event: any) {
  const config = useRuntimeConfig()
  const secret = config.adminSessionSecret
  if (!secret) return null

  const token = getCookie(event, 'admin_session')
  if (!token) return null

  const payload = parseToken(token, secret)
  if (!payload) return null

  const admin = await prisma.user.findFirst({
    where: {
      id: payload.uid,
      role: { in: ['ADMIN', 'OWNER'] },
      isActive: true
    }
  })

  return admin
}

export async function requireAdminAuth(event: any) {
  const admin = await getAdminFromEvent(event)
  if (!admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
  return admin
}
