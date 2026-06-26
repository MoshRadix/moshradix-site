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
import {
  buildVerificationUrl,
  isVerificationEmailConfigured,
  sendVerificationEmail,
} from "@/lib/samugaa/verification-email"
import { deleteExpiredUnverifiedUsers } from "@/lib/samugaa/email-verification-cleanup"

const PlatformSchema = z.enum(["ios", "android", "electron", "web"])
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000
const EMAIL_VERIFICATION_TTL_MS = 60 * 60 * 1000
const PASSWORD_RESET_MESSAGE = "If an account exists for that email, a password reset link has been sent."
const VERIFICATION_MESSAGE = "Check your email to verify your Samugaa account. The link expires in 1 hour."

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
  deviceId: z.string().optional(),
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

const ResendVerificationSchema = z.object({
  email: z.string().email(),
})

const ResetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

const VerifyEmailSchema = z.object({
  token: z.string().min(32),
})

type SamugaaUser = {
  id: string
  email: string
  passwordHash: string
  name: string | null
  createdAt: string
  emailVerifiedAt: string | null
  verificationExpiresAt: string | null
}

type PasswordResetToken = {
  id: string
  userId: string
  expiresAt: string
  usedAt: string | null
}

type EmailVerificationToken = {
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

    if (!isVerificationEmailConfigured()) {
      return jsonResponse({ error: "Email verification is not configured" }, { status: 503 })
    }

    const supabase = getSupabase()
    await deleteExpiredUnverifiedUsers(supabase)

    const { password, name, deviceId: incomingDeviceId, deviceName, platform } = parsed.data
    const email = parsed.data.email.trim().toLowerCase()
    const existing = await supabase.from(tables.users).select("id").eq("email", email).maybeSingle()
    throwIfSupabaseError(existing.error)

    if (existing.data) {
      return jsonResponse({ error: "Email already registered" }, { status: 409 })
    }

    const timestamp = nowIso()
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS).toISOString()
    const passwordHash = await hashPassword(password)
    const createdUser = await supabase
      .from(tables.users)
      .insert({
        id: createId(),
        email,
        passwordHash,
        name: name ?? null,
        emailVerifiedAt: null,
        verificationExpiresAt: expiresAt,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .select("id,email,name")
      .single()
    throwIfSupabaseError(createdUser.error)

    const user = createdUser.data as Pick<SamugaaUser, "id" | "email" | "name">
    let registeredDeviceId: string
    try {
      registeredDeviceId = await createAuthDevice({
        userId: user.id,
        incomingDeviceId,
        deviceName,
        platform,
        timestamp,
      })

      const verificationToken = createEmailVerificationToken()
      const createdVerificationToken = await supabase.from(tables.emailVerificationTokens).insert({
        id: createId(),
        userId: user.id,
        tokenHash: hashEmailVerificationToken(verificationToken),
        expiresAt,
        usedAt: null,
        createdAt: timestamp,
      })
      throwIfSupabaseError(createdVerificationToken.error)

      await sendVerificationEmail({
        verificationUrl: buildVerificationUrl(verificationToken),
        to: user.email,
        userName: user.name,
      })
    } catch (error) {
      const deletedUser = await supabase.from(tables.users).delete().eq("id", user.id)
      throwIfSupabaseError(deletedUser.error)
      throw error
    }

    return jsonResponse(
      {
        success: true,
        requiresVerification: true,
        message: VERIFICATION_MESSAGE,
        user,
        deviceId: registeredDeviceId,
      },
      { status: 201 },
    )
  }

  if (action === "login") {
    const parsed = LoginSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    const supabase = getSupabase()
    await deleteExpiredUnverifiedUsers(supabase)

    const { password, deviceId: incomingDeviceId, deviceName, platform, pushToken } = parsed.data
    const email = parsed.data.email.trim().toLowerCase()
    const foundUser = await supabase.from(tables.users).select("*").eq("email", email).maybeSingle()
    throwIfSupabaseError(foundUser.error)

    const user = foundUser.data as SamugaaUser | null
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return jsonResponse({ error: "Invalid credentials" }, { status: 401 })
    }

    const timestamp = nowIso()
    if (!user.emailVerifiedAt && !user.verificationExpiresAt) {
      const verifiedLegacyUser = await supabase
        .from(tables.users)
        .update({ emailVerifiedAt: timestamp, updatedAt: timestamp })
        .eq("id", user.id)
      throwIfSupabaseError(verifiedLegacyUser.error)
      user.emailVerifiedAt = timestamp
    }

    if (!user.emailVerifiedAt) {
      if (user.verificationExpiresAt && new Date(user.verificationExpiresAt).getTime() <= Date.now()) {
        const deletedUser = await supabase.from(tables.users).delete().eq("id", user.id)
        throwIfSupabaseError(deletedUser.error)
        return jsonResponse({ error: "Email verification expired. Create a new account to continue." }, { status: 410 })
      }

      return jsonResponse(
        {
          error: "Email verification required. Check your email for the verification link.",
          requiresVerification: true,
        },
        { status: 403 },
      )
    }

    let deviceId: string | undefined
    let newDeviceId = incomingDeviceId

    if (incomingDeviceId) {
      const existingDevice = await supabase
        .from(tables.devices)
        .select("id,userId")
        .eq("id", incomingDeviceId)
        .maybeSingle()
      throwIfSupabaseError(existingDevice.error)

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

      if (!deviceId && existingDevice.data && existingDevice.data.userId !== user.id) {
        newDeviceId = createId()
      }
    }

    if (!deviceId && deviceName) {
      const createdDevice = await supabase
        .from(tables.devices)
        .insert({
          id: newDeviceId ?? createId(),
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
    await deleteExpiredUnverifiedUsers(supabase)

    const email = parsed.data.email.trim().toLowerCase()
    const foundUser = await supabase
      .from(tables.users)
      .select("id,email,name,emailVerifiedAt,verificationExpiresAt")
      .eq("email", email)
      .maybeSingle()
    throwIfSupabaseError(foundUser.error)

    const user = foundUser.data as Pick<
      SamugaaUser,
      "id" | "email" | "name" | "emailVerifiedAt" | "verificationExpiresAt"
    > | null
    if (!user || (!user.emailVerifiedAt && user.verificationExpiresAt)) {
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

  if (action === "resendVerification") {
    const parsed = ResendVerificationSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    if (!isVerificationEmailConfigured()) {
      return jsonResponse({ error: "Email verification is not configured" }, { status: 503 })
    }

    const supabase = getSupabase()
    await deleteExpiredUnverifiedUsers(supabase)

    const timestamp = nowIso()
    const email = parsed.data.email.trim().toLowerCase()
    const foundUser = await supabase
      .from(tables.users)
      .select("id,email,name,emailVerifiedAt")
      .eq("email", email)
      .maybeSingle()
    throwIfSupabaseError(foundUser.error)

    const user = foundUser.data as Pick<SamugaaUser, "id" | "email" | "name" | "emailVerifiedAt"> | null
    if (!user) {
      return jsonResponse({ message: VERIFICATION_MESSAGE })
    }

    if (user.emailVerifiedAt) {
      return jsonResponse({ message: "This email is already verified. You can sign in." })
    }

    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS).toISOString()
    const invalidated = await supabase
      .from(tables.emailVerificationTokens)
      .update({ usedAt: timestamp })
      .eq("userId", user.id)
      .is("usedAt", null)
    throwIfSupabaseError(invalidated.error)

    const updatedUser = await supabase
      .from(tables.users)
      .update({ verificationExpiresAt: expiresAt, updatedAt: timestamp })
      .eq("id", user.id)
    throwIfSupabaseError(updatedUser.error)

    const verificationToken = createEmailVerificationToken()
    const createdVerificationToken = await supabase.from(tables.emailVerificationTokens).insert({
      id: createId(),
      userId: user.id,
      tokenHash: hashEmailVerificationToken(verificationToken),
      expiresAt,
      usedAt: null,
      createdAt: timestamp,
    })
    throwIfSupabaseError(createdVerificationToken.error)

    await sendVerificationEmail({
      verificationUrl: buildVerificationUrl(verificationToken),
      to: user.email,
      userName: user.name,
    })

    return jsonResponse({ message: VERIFICATION_MESSAGE })
  }

  if (action === "verifyEmail") {
    const parsed = VerifyEmailSchema.safeParse(rest)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    const supabase = getSupabase()
    await deleteExpiredUnverifiedUsers(supabase)

    const timestamp = nowIso()
    const tokenHash = hashEmailVerificationToken(parsed.data.token)
    const foundToken = await supabase
      .from(tables.emailVerificationTokens)
      .select("id,userId,expiresAt,usedAt")
      .eq("tokenHash", tokenHash)
      .maybeSingle()
    throwIfSupabaseError(foundToken.error)

    const verificationToken = foundToken.data as EmailVerificationToken | null
    if (
      !verificationToken ||
      verificationToken.usedAt ||
      new Date(verificationToken.expiresAt).getTime() <= Date.now()
    ) {
      if (verificationToken?.userId) {
        const deletedUser = await supabase
          .from(tables.users)
          .delete()
          .eq("id", verificationToken.userId)
          .is("emailVerifiedAt", null)
        throwIfSupabaseError(deletedUser.error)
      }

      return jsonResponse({ error: "Verification link is invalid or expired" }, { status: 400 })
    }

    const updatedUser = await supabase
      .from(tables.users)
      .update({
        emailVerifiedAt: timestamp,
        verificationExpiresAt: null,
        updatedAt: timestamp,
      })
      .eq("id", verificationToken.userId)
      .is("emailVerifiedAt", null)
      .select("id,email,name")
      .maybeSingle()
    throwIfSupabaseError(updatedUser.error)

    if (!updatedUser.data) {
      return jsonResponse({ error: "Verification link is invalid or expired" }, { status: 400 })
    }

    const usedToken = await supabase
      .from(tables.emailVerificationTokens)
      .update({ usedAt: timestamp })
      .eq("id", verificationToken.id)
    throwIfSupabaseError(usedToken.error)

    const invalidated = await supabase
      .from(tables.emailVerificationTokens)
      .update({ usedAt: timestamp })
      .eq("userId", verificationToken.userId)
      .is("usedAt", null)
    throwIfSupabaseError(invalidated.error)

    return jsonResponse({
      success: true,
      message: "Email verified. You can now sign in to Samugaa.",
      user: updatedUser.data,
    })
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
    {
      error:
        "Unknown action. Use 'register', 'login', 'verifyEmail', 'resendVerification', 'requestPasswordReset', or 'resetPassword'.",
    },
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

function createEmailVerificationToken() {
  return randomBytes(32).toString("base64url")
}

function hashEmailVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

async function createAuthDevice({
  userId,
  incomingDeviceId,
  deviceName,
  platform,
  timestamp,
}: {
  userId: string
  incomingDeviceId?: string
  deviceName: string
  platform: z.infer<typeof PlatformSchema>
  timestamp: string
}) {
  const supabase = getSupabase()
  let deviceId = incomingDeviceId ?? createId()

  if (incomingDeviceId) {
    const existingDevice = await supabase
      .from(tables.devices)
      .select("id,userId")
      .eq("id", incomingDeviceId)
      .maybeSingle()
    throwIfSupabaseError(existingDevice.error)

    if (existingDevice.data && existingDevice.data.userId !== userId) {
      deviceId = createId()
    }
  }

  const createdDevice = await supabase
    .from(tables.devices)
    .insert({
      id: deviceId,
      userId,
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

  return createdDevice.data.id
}
