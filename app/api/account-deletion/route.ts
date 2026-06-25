import { type NextRequest } from "next/server"
import { getUserFromRequest } from "@/lib/samugaa/auth"
import { createId, jsonResponse, nowIso, optionsResponse, unauthorizedResponse } from "@/lib/samugaa/api"
import {
  isAccountDeletionEmailConfigured,
  sendAccountDeletionRequestEmail,
} from "@/lib/samugaa/account-deletion-email"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

type AccountDeletionRequest = {
  id: string
  userId: string
  email: string
  status: string
  requestedAt: string
  adminNotifiedAt: string | null
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const supabase = getSupabase()
  const timestamp = nowIso()

  const foundUser = await supabase
    .from(tables.users)
    .select("id,email")
    .eq("id", user.userId)
    .maybeSingle()
  throwIfSupabaseError(foundUser.error)

  if (!foundUser.data) {
    return jsonResponse({ error: "Account not found" }, { status: 404 })
  }

  const email = String(foundUser.data.email)
  const existing = await supabase
    .from(tables.accountDeletionRequests)
    .select("id,userId,email,status,requestedAt,adminNotifiedAt")
    .eq("userId", user.userId)
    .in("status", ["requested", "flagged", "processing"])
    .order("requestedAt", { ascending: false })
    .limit(1)
    .maybeSingle()
  throwIfSupabaseError(existing.error)

  const requestRecord = existing.data
    ? (existing.data as AccountDeletionRequest)
    : await createAccountDeletionRequest(req, user.userId, email, timestamp)

  await flagUserForDeletion(user.userId, timestamp)
  await notifyAdministrators(requestRecord)

  return jsonResponse({
    success: true,
    message:
      "Your account deletion request has been recorded. Administrators have been notified and your account is flagged for deletion according to backend policies.",
    request: {
      id: requestRecord.id,
      status: requestRecord.status,
      requestedAt: requestRecord.requestedAt,
    },
  })
}

export function OPTIONS() {
  return optionsResponse()
}

async function createAccountDeletionRequest(
  req: NextRequest,
  userId: string,
  email: string,
  requestedAt: string,
) {
  const requestId = createId()
  const created = await getSupabase()
    .from(tables.accountDeletionRequests)
    .insert({
      id: requestId,
      userId,
      email,
      status: "requested",
      source: "web",
      ipAddress: getClientIp(req),
      userAgent: req.headers.get("user-agent"),
      requestedAt,
      createdAt: requestedAt,
      updatedAt: requestedAt,
      adminNotifiedAt: null,
      processedAt: null,
    })
    .select("id,userId,email,status,requestedAt,adminNotifiedAt")
    .single()
  throwIfSupabaseError(created.error)
  if (!created.data) throw new Error("Account deletion request creation did not return a row")

  console.info("[Samugaa] Account deletion requested", {
    requestId,
    userId,
    email,
    requestedAt,
  })

  return created.data as AccountDeletionRequest
}

async function flagUserForDeletion(userId: string, requestedAt: string) {
  const flagged = await getSupabase()
    .from(tables.users)
    .update({
      deletionRequestedAt: requestedAt,
      deletionStatus: "requested",
      updatedAt: requestedAt,
    })
    .eq("id", userId)

  if (!flagged.error) return

  const message = formatError(flagged.error).toLowerCase()
  if (message.includes("deletionrequestedat") || message.includes("deletionstatus")) {
    console.warn("[Samugaa] User deletion flag columns are not available; request record was still logged.", {
      userId,
      requestedAt,
    })
    return
  }

  throwIfSupabaseError(flagged.error)
}

async function notifyAdministrators(requestRecord: AccountDeletionRequest) {
  if (requestRecord.adminNotifiedAt) return

  if (!isAccountDeletionEmailConfigured()) {
    console.warn("[Samugaa] Account deletion admin notification email is not configured.", {
      requestId: requestRecord.id,
      userId: requestRecord.userId,
      email: requestRecord.email,
      requestedAt: requestRecord.requestedAt,
    })
    return
  }

  await sendAccountDeletionRequestEmail({
    email: requestRecord.email,
    requestId: requestRecord.id,
    requestedAt: requestRecord.requestedAt,
    userId: requestRecord.userId,
  })

  const timestamp = nowIso()
  const updated = await getSupabase()
    .from(tables.accountDeletionRequests)
    .update({ adminNotifiedAt: timestamp, updatedAt: timestamp })
    .eq("id", requestRecord.id)
  throwIfSupabaseError(updated.error)
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  )
}

function formatError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message)
  }
  return String(error)
}
