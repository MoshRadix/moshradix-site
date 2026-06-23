import { type NextRequest } from "next/server"
import { z } from "zod"
import { comparePassword, getUserFromRequest, hashPassword, signToken } from "@/lib/samugaa/auth"
import { createId, jsonResponse, nowIso, optionsResponse, readJson, unauthorizedResponse } from "@/lib/samugaa/api"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

const PlatformSchema = z.enum(["ios", "android", "electron", "web"])

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

type SamugaaUser = {
  id: string
  email: string
  passwordHash: string
  name: string | null
  createdAt: string
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

  if (action === "devices") {
    return jsonResponse({ error: "Use GET /api/auth?action=devices" }, { status: 400 })
  }

  return jsonResponse({ error: "Unknown action. Use 'register' or 'login'." }, { status: 400 })
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
