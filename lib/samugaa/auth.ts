import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d"

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.samugaa_SUPABASE_JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET or samugaa_SUPABASE_JWT_SECRET is required")
  }

  return secret
}

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as JWTPayload
}

export function extractBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.slice(7)
}

export function getUserFromRequest(req: NextRequest) {
  const token = extractBearerToken(req)
  if (!token) return null

  try {
    return verifyToken(token)
  } catch {
    return null
  }
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
