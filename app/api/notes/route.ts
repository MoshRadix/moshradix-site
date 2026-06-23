import { type NextRequest } from "next/server"
import { z } from "zod"
import { getUserFromRequest } from "@/lib/samugaa/auth"
import { createId, jsonResponse, nowIso, optionsResponse, readJson, unauthorizedResponse } from "@/lib/samugaa/api"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

const NoteCreateSchema = z.object({
  title: z.string().default("Untitled"),
  content: z.string().default(""),
  clientId: z.string().optional(),
  updatedAt: z.string().optional(),
})

const NoteQuerySchema = z.object({
  since: z.string().optional(),
  includeDeleted: z.string().optional(),
  limit: z.coerce.number().default(200),
  offset: z.coerce.number().default(0),
  q: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const params = NoteQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!params.success) return jsonResponse({ error: params.error.flatten() }, { status: 400 })

  const { since, includeDeleted, limit, offset, q } = params.data
  const supabase = getSupabase()
  let query = supabase
    .from(tables.notes)
    .select("id,title,content,clientId,deviceId,syncVersion,isDeleted,deletedAt,createdAt,updatedAt", {
      count: "exact",
    })
    .eq("userId", user.userId)

  if (includeDeleted !== "true") query = query.eq("isDeleted", false)
  if (since) query = query.gt("updatedAt", new Date(since).toISOString())
  if (q) {
    const search = q.replace(/[,%]/g, " ").trim()
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const result = await query.order("updatedAt", { ascending: false }).range(offset, offset + limit - 1)
  throwIfSupabaseError(result.error)

  return jsonResponse({ notes: result.data ?? [], total: result.count ?? 0, limit, offset })
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const body = await readJson(req)
  if (!body) return jsonResponse({ error: "Invalid JSON" }, { status: 400 })

  const parsed = NoteCreateSchema.safeParse(body)
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

  const supabase = getSupabase()
  const { title, content, clientId } = parsed.data
  const deviceId = req.headers.get("X-Device-ID") ?? undefined
  const timestamp = nowIso()

  if (clientId) {
    const existing = await supabase
      .from(tables.notes)
      .select("id,syncVersion")
      .eq("clientId", clientId)
      .eq("userId", user.userId)
      .maybeSingle()
    throwIfSupabaseError(existing.error)

    if (existing.data) {
      const note = await supabase
        .from(tables.notes)
        .update({
          title,
          content,
          deviceId: deviceId ?? null,
          updatedAt: timestamp,
          syncVersion: (existing.data.syncVersion ?? 1) + 1,
        })
        .eq("id", existing.data.id)
        .select("*")
        .single()
      throwIfSupabaseError(note.error)
      await logSync(user.userId, deviceId, "note", note.data.id, "update")
      return jsonResponse({ note: note.data })
    }
  }

  const note = await supabase
    .from(tables.notes)
    .insert({
      id: createId(),
      userId: user.userId,
      title,
      content,
      clientId: clientId ?? null,
      deviceId: deviceId ?? null,
      syncVersion: 1,
      isDeleted: false,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .select("*")
    .single()
  throwIfSupabaseError(note.error)

  await logSync(user.userId, deviceId, "note", note.data.id, "create")
  return jsonResponse({ note: note.data }, { status: 201 })
}

export function OPTIONS() {
  return optionsResponse()
}

async function logSync(userId: string, deviceId: string | undefined, entity: string, entityId: string, action: string) {
  const timestamp = nowIso()
  try {
    await getSupabase()
      .from(tables.syncLogs)
      .insert({
        id: createId(),
        userId,
        deviceId: deviceId ?? null,
        entity,
        entityId,
        action,
        createdAt: timestamp,
      })
  } catch {
    // Sync logging should never block the main notes workflow.
  }
}
