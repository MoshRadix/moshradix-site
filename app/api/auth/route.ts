import { createHash, randomBytes } from "node:crypto"
import { type NextRequest } from "next/server"
import { z } from "zod"
import { comparePassword, getUserFromRequest, hashPassword, signToken } from "@/lib/samugaa/auth"
import { createId, jsonResponse, nowIso, optionsResponse, readJson, unauthorizedResponse } from "@/lib/samugaa/api"
import {
  buildPasswordResetUrl,
  isPasswordResetEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/samugaa/password-reset-email"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

const PlatformSchema = z.enum(["ios", "android", "electron", "web"])
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000
const PASSWORD_RESET_MESSAGE = "If an account exists for that email, a password reset link has been sent."

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  deviceName: z.string().default("Unknown Device"),
  platform: PlatformSchema.default("web"),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  platform: PlatformSchema.optional(),
  pushToken: z.string().optional(),
})

const RequestPasswordResetSchema = z.object({
  email: z.string().email(),
})

const ResetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SamugaaUser = {
  id: string
  email: string
  passwordHash: string
  name: string | null
  createdAt: string
}

type PasswordResetToken = {
  id: string
  userId: string
  expiresAt: string
  usedAt: string | null
}

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  if (!body) return jsonResponse({ error: "Invalid JSON" }, { status: 400 })

  const { action, ...rest } = body as { action?: string; [key: string]: unknown }

  if (action === "register") {
    const parsed = RegisterSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    const supabase = getSupabase()
    const { email, password, name, deviceName, platform } = parsed.data
    const existing = await supabase.from(tables.users).select("id").eq("email", email).maybeSingle()
    throwIfSupabaseError(existing.error)

    if (existing.data) {
      return jsonResponse({ error: "Email already registered" }, { status: 409 })
    }

    const timestamp = nowIso()
    const passwordHash = await hashPassword(password)
    const createdUser = await supabase
      .from(tables.users)
      .insert({
        id: createId(),
        email,
        passwordHash,
        name: name ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .select("id,email,name")
      .single()
    throwIfSupabaseError(createdUser.error)

    const user = createdUser.data as Pick<SamugaaUser, "id" | "email" | "name">
    const createdDevice = await supabase
      .from(tables.devices)
      .insert({
        id: createId(),
        userId: user.id,
        name: deviceName,
        platform,
        lastSeenAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .select("id")
      .single()
    throwIfSupabaseError(createdDevice.error)
    if (!createdDevice.data) {
      throw new Error("Device creation did not return a row")
    }

    return jsonResponse(
      {
        token: signToken({ userId: user.id, email: user.email }),
        user,
        deviceId: createdDevice.data.id,
      },
      { status: 201 },
    )
  }

  if (action === "login") {
    const parsed = LoginSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    const supabase = getSupabase()
    const { email, password, deviceId: incomingDeviceId, deviceName, platform, pushToken } = parsed.data
    const foundUser = await supabase.from(tables.users).select("*").eq("email", email).maybeSingle()
    throwIfSupabaseError(foundUser.error)

    const user = foundUser.data as SamugaaUser | null
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return jsonResponse({ error: "Invalid credentials" }, { status: 401 })
    }

    const timestamp = nowIso()
    let deviceId: string | undefined

    if (incomingDeviceId) {
      const updated = await supabase
        .from(tables.devices)
        .update({
          lastSeenAt: timestamp,
          updatedAt: timestamp,
          ...(pushToken && { pushToken }),
          ...(platform && { platform }),
        })
        .eq("id", incomingDeviceId)
        .eq("userId", user.id)
        .select("id")
      throwIfSupabaseError(updated.error)

      if (updated.data && updated.data.length > 0) {
        deviceId = incomingDeviceId
      }
    }

    if (!deviceId && deviceName) {
      const createdDevice = await supabase
        .from(tables.devices)
        .insert({
          id: createId(),
          userId: user.id,
          name: deviceName,
          platform: platform ?? "web",
          pushToken: pushToken ?? null,
          lastSeenAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .select("id")
        .single()
    throwIfSupabaseError(createdDevice.error)
      if (!createdDevice.data) {
        throw new Error("Device creation did not return a row")
      }
      deviceId = createdDevice.data.id
    }

    return jsonResponse({
      token: signToken({ userId: user.id, email: user.email }),
      user: { id: user.id, email: user.email, name: user.name },
      deviceId,
    })
  }

  if (action === "requestPasswordReset") {
    const parsed = RequestPasswordResetSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    if (!isPasswordResetEmailConfigured()) {
      return jsonResponse({ error: "Password reset email is not configured" }, { status: 503 })
    }

    const supabase = getSupabase()
    const email = parsed.data.email.trim().toLowerCase()
    const foundUser = await supabase.from(tables.users).select("id,email,name").eq("email", email).maybeSingle()
    throwIfSupabaseError(foundUser.error)

    const user = foundUser.data as Pick<SamugaaUser, "id" | "email" | "name"> | null
    if (!user) {
      return jsonResponse({ message: PASSWORD_RESET_MESSAGE })
    }

    const timestamp = nowIso()
    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString()

    const invalidated = await supabase
      .from(tables.passwordResetTokens)
      .update({ usedAt: timestamp })
      .eq("userId", user.id)
      .is("usedAt", null)
    throwIfSupabaseError(invalidated.error)

    const createdResetToken = await supabase.from(tables.passwordResetTokens).insert({
      id: createId(),
      userId: user.id,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: timestamp,
    })
    throwIfSupabaseError(createdResetToken.error)

    await sendPasswordResetEmail({
      resetUrl: buildPasswordResetUrl(token),
      to: user.email,
      userName: user.name,
    })

    return jsonResponse({ message: PASSWORD_RESET_MESSAGE })
  }

  if (action === "resetPassword") {
    const parsed = ResetPasswordSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    const supabase = getSupabase()
    const { token, password } = parsed.data
    const tokenHash = hashPasswordResetToken(token)
    const foundToken = await supabase
      .from(tables.passwordResetTokens)
      .select("id,userId,expiresAt,usedAt")
      .eq("tokenHash", tokenHash)
      .maybeSingle()
    throwIfSupabaseError(foundToken.error)

    const resetToken = foundToken.data as PasswordResetToken | null
    if (
      !resetToken ||
      resetToken.usedAt ||
      new Date(resetToken.expiresAt).getTime() <= Date.now()
    ) {
      return jsonResponse({ error: "Password reset link is invalid or expired" }, { status: 400 })
    }

    const timestamp = nowIso()
    const passwordHash = await hashPassword(password)
    const updatedUser = await supabase
      .from(tables.users)
      .update({ passwordHash, updatedAt: timestamp })
      .eq("id", resetToken.userId)
    throwIfSupabaseError(updatedUser.error)

    const usedToken = await supabase
      .from(tables.passwordResetTokens)
      .update({ usedAt: timestamp })
      .eq("id", resetToken.id)
    throwIfSupabaseError(usedToken.error)

    const invalidated = await supabase
      .from(tables.passwordResetTokens)
      .update({ usedAt: timestamp })
      .eq("userId", resetToken.userId)
      .is("usedAt", null)
    throwIfSupabaseError(invalidated.error)

    return jsonResponse({ success: true })
  }

  if (action === "devices") {
    return jsonResponse({ error: "Use GET /api/auth?action=devices" }, { status: 400 })
  }

  return jsonResponse(
    { error: "Unknown action. Use 'register', 'login', 'requestPasswordReset', or 'resetPassword'." },
    { status: 400 },
  )
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const supabase = getSupabase()
  const action = req.nextUrl.searchParams.get("action")

  if (action === "devices") {
    const devices = await supabase
      .from(tables.devices)
      .select("*")
      .eq("userId", user.userId)
      .order("lastSeenAt", { ascending: false })
    throwIfSupabaseError(devices.error)
    return jsonResponse({ devices: devices.data ?? [] })
  }

  if (action === "me") {
    const found = await supabase
      .from(tables.users)
      .select("id,email,name,createdAt")
      .eq("id", user.userId)
      .maybeSingle()
    throwIfSupabaseError(found.error)
    if (!found.data) return jsonResponse({ error: "Not found" }, { status: 404 })
    return jsonResponse({ user: found.data })
  }

  return jsonResponse({ error: "Unknown action" }, { status: 400 })
}

export function OPTIONS() {
  return optionsResponse()
}

function createPasswordResetToken() {
  return randomBytes(32).toString("base64url")
}

function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}
