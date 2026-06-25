import { type NextRequest } from "next/server"
import { z } from "zod"
import { getUserFromRequest } from "@/lib/samugaa/auth"
import { createId, jsonResponse, nowIso, optionsResponse, readJson, unauthorizedResponse } from "@/lib/samugaa/api"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

const SyncNoteSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  title: z.string().default("Untitled"),
  content: z.string().default(""),
  language: z.enum(["en", "dv"]).default("en"),
  isDeleted: z.boolean().default(false),
  clientUpdatedAt: z.string(),
})

const SyncSubtaskSchema = z.object({
  text: z.string(),
  done: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

const SyncTodoSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  text: z.string(),
  done: z.boolean().default(false),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.array(z.string()).default([]),
  isDeleted: z.boolean().default(false),
  clientUpdatedAt: z.string(),
  subtasks: z.array(SyncSubtaskSchema).default([]),
})

const SyncWorkLogSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  task: z.string().default(""),
  notes: z.string().default(""),
  createdAt: z.string(),
  tags: z.array(z.string()).default([]),
  photoPath: z.string().nullable().optional(),
  linkedTodoId: z.string().nullable().optional(),
  todoStatusHistory: z.array(z.unknown()).default([]),
  enrichNote: z.string().nullable().optional(),
  isDeleted: z.boolean().default(false),
  clientUpdatedAt: z.string(),
})

const SyncRequestSchema = z.object({
  since: z.string().optional(),
  notes: z.array(SyncNoteSchema).default([]),
  todos: z.array(SyncTodoSchema).default([]),
  workLogs: z.array(SyncWorkLogSchema).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return unauthorizedResponse()

    const body = await readJson(req)
    if (!body) return jsonResponse({ error: "Invalid JSON" }, { status: 400 })

    const parsed = SyncRequestSchema.safeParse(body)
    if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

    const incomingDeviceId = req.headers.get("X-Device-ID") ?? `device-${createId()}`
    const deviceId = await ensureSyncDevice(user.userId, incomingDeviceId)
    const { since, notes: clientNotes, todos: clientTodos, workLogs: clientWorkLogs } = parsed.data
    const syncedAt = nowIso()

    const [noteResults, todoResults, workLogResults] = await Promise.all([
      syncNotes(user.userId, deviceId, clientNotes),
      syncTodos(user.userId, deviceId, clientTodos),
      syncWorkLogsOptional(user.userId, deviceId, clientWorkLogs),
    ])

    const sinceDate = toSafeIso(since, new Date(0).toISOString())
    const supabase = getSupabase()
    const serverNotes = await getServerNotes(user.userId, sinceDate)

    const serverTodosResult = await supabase
      .from(tables.todos)
      .select("*")
      .eq("userId", user.userId)
      .gt("updatedAt", sinceDate)
    throwIfSupabaseError(serverTodosResult.error)

    const serverTodos = await attachSubtasks(serverTodosResult.data ?? [])

    const serverWorkLogs = await getServerWorkLogsOptional(user.userId, sinceDate)

    return jsonResponse({
      syncedAt,
      notes: {
        ...noteResults,
        serverChanges: serverNotes,
      },
      todos: {
        ...todoResults,
        serverChanges: serverTodos,
      },
      workLogs: {
        ...workLogResults,
        serverChanges: serverWorkLogs.serverChanges,
        error: workLogResults.error ?? serverWorkLogs.error,
      },
    })
  } catch (error) {
    console.error("[Sync] Request failed:", error)
    return jsonResponse(
      { error: `Sync failed: ${formatSyncError(error)}` },
      { status: 500 },
    )
  }
}

export function OPTIONS() {
  return optionsResponse()
}

function toSafeIso(value: string | undefined, fallback: string) {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function formatSyncError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message?: unknown }).message)
  }
  return "Unexpected server error"
}

function isMissingColumnError(error: unknown, column: string) {
  const message = formatSyncError(error).toLowerCase()
  return message.includes(column.toLowerCase()) && (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  )
}

async function getServerNotes(userId: string, sinceDate: string) {
  const supabase = getSupabase()
  const selectWithLanguage = "id,title,content,language,clientId,isDeleted,deletedAt,createdAt,updatedAt,syncVersion,deviceId"
  const selectLegacy = "id,title,content,clientId,isDeleted,deletedAt,createdAt,updatedAt,syncVersion,deviceId"

  const fetchNotes = (select: string) => supabase
    .from(tables.notes)
    .select(select)
    .eq("userId", userId)
    .gt("updatedAt", sinceDate)

  const notes = await fetchNotes(selectWithLanguage)
  if (!notes.error) return notes.data ?? []
  if (!isMissingColumnError(notes.error, "language")) throwIfSupabaseError(notes.error)

  const legacyNotes = await fetchNotes(selectLegacy)
  throwIfSupabaseError(legacyNotes.error)
  return (legacyNotes.data ?? []).map((note) => ({
    ...(typeof note === "object" && note ? note : {}),
    language: "en",
  }))
}

async function ensureSyncDevice(userId: string, deviceId: string) {
  const supabase = getSupabase()
  const timestamp = nowIso()
  const existing = await supabase.from(tables.devices).select("id,userId").eq("id", deviceId).maybeSingle()
  throwIfSupabaseError(existing.error)

  if (existing.data) {
    if (existing.data.userId !== userId) return null

    const updated = await supabase
      .from(tables.devices)
      .update({ lastSeenAt: timestamp, updatedAt: timestamp })
      .eq("id", deviceId)
      .eq("userId", userId)
    throwIfSupabaseError(updated.error)
    return deviceId
  }

  const created = await supabase.from(tables.devices).insert({
    id: deviceId,
    userId,
    name: "Android",
    platform: "android",
    lastSeenAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  throwIfSupabaseError(created.error)
  return deviceId
}

async function syncNotes(userId: string, deviceId: string | null, clientNotes: z.infer<typeof SyncNoteSchema>[]) {
  const created: string[] = []
  const updated: string[] = []
  const conflicts: Array<{ clientId: string; serverNote: unknown }> = []
  const supabase = getSupabase()

  for (const clientNote of clientNotes) {
    const existingQuery = supabase.from(tables.notes).select("*").eq("userId", userId)
    const existing = clientNote.id
      ? await existingQuery.eq("id", clientNote.id).maybeSingle()
      : await existingQuery.eq("clientId", clientNote.clientId).maybeSingle()
    throwIfSupabaseError(existing.error)

    const timestamp = nowIso()
    if (!existing.data) {
      const note = await insertNoteWithLanguageFallback({
        id: createId(),
        userId,
        title: clientNote.title,
        content: clientNote.content,
        language: clientNote.language,
        clientId: clientNote.clientId,
        deviceId,
        isDeleted: clientNote.isDeleted,
        deletedAt: clientNote.isDeleted ? timestamp : null,
        syncVersion: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      created.push(note.id)
      continue
    }

    if (new Date(clientNote.clientUpdatedAt) >= new Date(existing.data.updatedAt)) {
      const note = await updateNoteWithLanguageFallback(existing.data.id, {
        title: clientNote.title,
        content: clientNote.content,
        language: clientNote.language,
        deviceId,
        isDeleted: clientNote.isDeleted,
        deletedAt: clientNote.isDeleted ? timestamp : null,
        updatedAt: timestamp,
        syncVersion: (existing.data.syncVersion ?? 1) + 1,
      })
      updated.push(note.id)
    } else {
      conflicts.push({ clientId: clientNote.clientId, serverNote: existing.data })
    }
  }

  return { created, updated, conflicts }
}

async function insertNoteWithLanguageFallback(row: {
  id: string
  userId: string
  title: string
  content: string
  language: "en" | "dv"
  clientId: string
  deviceId: string | null
  isDeleted: boolean
  deletedAt: string | null
  syncVersion: number
  createdAt: string
  updatedAt: string
}) {
  const note = await getSupabase()
    .from(tables.notes)
    .insert(row)
    .select("id")
    .single()
  if (!note.error) {
    if (!note.data) throw new Error("Note creation did not return a row")
    return note.data
  }
  if (!isMissingColumnError(note.error, "language")) throwIfSupabaseError(note.error)

  const { language: _language, ...legacyRow } = row
  const legacyNote = await getSupabase()
    .from(tables.notes)
    .insert(legacyRow)
    .select("id")
    .single()
  throwIfSupabaseError(legacyNote.error)
  if (!legacyNote.data) throw new Error("Note creation did not return a row")
  return legacyNote.data
}

async function updateNoteWithLanguageFallback(id: string, row: {
  title: string
  content: string
  language: "en" | "dv"
  deviceId: string | null
  isDeleted: boolean
  deletedAt: string | null
  updatedAt: string
  syncVersion: number
}) {
  const note = await getSupabase()
    .from(tables.notes)
    .update(row)
    .eq("id", id)
    .select("id")
    .single()
  if (!note.error) {
    if (!note.data) throw new Error("Note update did not return a row")
    return note.data
  }
  if (!isMissingColumnError(note.error, "language")) throwIfSupabaseError(note.error)

  const { language: _language, ...legacyRow } = row
  const legacyNote = await getSupabase()
    .from(tables.notes)
    .update(legacyRow)
    .eq("id", id)
    .select("id")
    .single()
  throwIfSupabaseError(legacyNote.error)
  if (!legacyNote.data) throw new Error("Note update did not return a row")
  return legacyNote.data
}

async function syncTodos(userId: string, deviceId: string | null, clientTodos: z.infer<typeof SyncTodoSchema>[]) {
  const created: string[] = []
  const updated: string[] = []
  const conflicts: Array<{ clientId: string; serverTodo: unknown }> = []
  const supabase = getSupabase()

  for (const clientTodo of clientTodos) {
    const existingQuery = supabase.from(tables.todos).select("*").eq("userId", userId)
    const existing = clientTodo.id
      ? await existingQuery.eq("id", clientTodo.id).maybeSingle()
      : await existingQuery.eq("clientId", clientTodo.clientId).maybeSingle()
    throwIfSupabaseError(existing.error)

    const timestamp = nowIso()
    if (!existing.data) {
      const todoId = createId()
      const todo = await supabase
        .from(tables.todos)
        .insert({
          id: todoId,
          userId,
          text: clientTodo.text,
          done: clientTodo.done,
          dueDate: clientTodo.dueDate ?? null,
          priority: clientTodo.priority,
          tags: clientTodo.tags,
          clientId: clientTodo.clientId,
          deviceId,
          isDeleted: clientTodo.isDeleted,
          syncVersion: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .select("id")
        .single()
      throwIfSupabaseError(todo.error)
      if (!todo.data) throw new Error("Todo creation did not return a row")
      await replaceSubtasks(todoId, clientTodo.subtasks)
      created.push(todo.data.id)
      continue
    }

    if (new Date(clientTodo.clientUpdatedAt) >= new Date(existing.data.updatedAt)) {
      const todo = await supabase
        .from(tables.todos)
        .update({
          text: clientTodo.text,
          done: clientTodo.done,
          dueDate: clientTodo.dueDate ?? null,
          priority: clientTodo.priority,
          tags: clientTodo.tags,
          deviceId,
          isDeleted: clientTodo.isDeleted,
          updatedAt: timestamp,
          syncVersion: (existing.data.syncVersion ?? 1) + 1,
        })
        .eq("id", existing.data.id)
        .select("id")
        .single()
      throwIfSupabaseError(todo.error)
      if (!todo.data) throw new Error("Todo update did not return a row")
      await replaceSubtasks(existing.data.id, clientTodo.subtasks)
      updated.push(todo.data.id)
    } else {
      conflicts.push({ clientId: clientTodo.clientId, serverTodo: existing.data })
    }
  }

  return { created, updated, conflicts }
}

async function syncWorkLogs(userId: string, deviceId: string | null, clientWorkLogs: z.infer<typeof SyncWorkLogSchema>[]) {
  const created: Array<{ id: string; clientId: string }> = []
  const updated: Array<{ id: string; clientId: string }> = []
  const conflicts: Array<{ clientId: string; serverWorkLog: unknown }> = []
  const supabase = getSupabase()

  for (const clientWorkLog of clientWorkLogs) {
    const existingQuery = supabase.from(tables.workLogs).select("*").eq("userId", userId)
    const existing = clientWorkLog.id
      ? await existingQuery.eq("id", clientWorkLog.id).maybeSingle()
      : await existingQuery.eq("clientId", clientWorkLog.clientId).maybeSingle()
    throwIfSupabaseError(existing.error)

    const timestamp = nowIso()
    const row = {
      task: clientWorkLog.task,
      notes: clientWorkLog.notes,
      createdAt: new Date(clientWorkLog.createdAt).toISOString(),
      tags: clientWorkLog.tags,
      photoPath: clientWorkLog.photoPath ?? null,
      linkedTodoId: clientWorkLog.linkedTodoId ?? null,
      todoStatusHistory: clientWorkLog.todoStatusHistory,
      enrichNote: clientWorkLog.enrichNote ?? null,
      deviceId,
      isDeleted: clientWorkLog.isDeleted,
      deletedAt: clientWorkLog.isDeleted ? timestamp : null,
      updatedAt: timestamp,
    }

    if (!existing.data) {
      const workLogId = createId()
      const workLog = await supabase
        .from(tables.workLogs)
        .insert({
          id: workLogId,
          userId,
          ...row,
          clientId: clientWorkLog.clientId,
          syncVersion: 1,
        })
        .select("id,clientId")
        .single()
      throwIfSupabaseError(workLog.error)
      if (!workLog.data) throw new Error("Work log creation did not return a row")
      created.push({ id: workLog.data.id, clientId: workLog.data.clientId })
      continue
    }

    if (new Date(clientWorkLog.clientUpdatedAt) >= new Date(existing.data.updatedAt)) {
      const workLog = await supabase
        .from(tables.workLogs)
        .update({
          ...row,
          syncVersion: (existing.data.syncVersion ?? 1) + 1,
        })
        .eq("id", existing.data.id)
        .select("id,clientId")
        .single()
      throwIfSupabaseError(workLog.error)
      if (!workLog.data) throw new Error("Work log update did not return a row")
      updated.push({ id: workLog.data.id, clientId: workLog.data.clientId })
    } else {
      conflicts.push({ clientId: clientWorkLog.clientId, serverWorkLog: existing.data })
    }
  }

  return { created, updated, conflicts }
}

async function syncWorkLogsOptional(userId: string, deviceId: string | null, clientWorkLogs: z.infer<typeof SyncWorkLogSchema>[]) {
  try {
    return {
      ...(await syncWorkLogs(userId, deviceId, clientWorkLogs)),
      error: undefined,
    }
  } catch (error) {
    console.error("[Sync] Work log sync skipped:", error)
    return {
      created: [] as Array<{ id: string; clientId: string }>,
      updated: [] as Array<{ id: string; clientId: string }>,
      conflicts: [] as Array<{ clientId: string; serverWorkLog: unknown }>,
      error: "Work log sync is temporarily unavailable.",
    }
  }
}

async function getServerWorkLogsOptional(userId: string, sinceDate: string) {
  try {
    const serverWorkLogs = await getSupabase()
      .from(tables.workLogs)
      .select("*")
      .eq("userId", userId)
      .gt("updatedAt", sinceDate)
    throwIfSupabaseError(serverWorkLogs.error)

    return {
      serverChanges: serverWorkLogs.data ?? [],
      error: undefined,
    }
  } catch (error) {
    console.error("[Sync] Work log pull skipped:", error)
    return {
      serverChanges: [],
      error: "Work log sync is temporarily unavailable.",
    }
  }
}

async function attachSubtasks<T extends { id: string }>(todos: T[]) {
  if (todos.length === 0) return todos.map((todo) => ({ ...todo, subtasks: [] }))

  const subtasks = await getSupabase()
    .from(tables.subtasks)
    .select("*")
    .in(
      "todoId",
      todos.map((todo) => todo.id),
    )
    .order("sortOrder", { ascending: true })
  throwIfSupabaseError(subtasks.error)

  return todos.map((todo) => ({
    ...todo,
    subtasks: (subtasks.data ?? []).filter((subtask) => subtask.todoId === todo.id),
  }))
}

async function replaceSubtasks(todoId: string, subtasks: z.infer<typeof SyncSubtaskSchema>[]) {
  const supabase = getSupabase()
  const removed = await supabase.from(tables.subtasks).delete().eq("todoId", todoId)
  throwIfSupabaseError(removed.error)

  if (subtasks.length === 0) return

  const timestamp = nowIso()
  const inserted = await supabase.from(tables.subtasks).insert(
    subtasks.map((subtask) => ({
      id: createId(),
      todoId,
      text: subtask.text,
      done: subtask.done,
      sortOrder: subtask.sortOrder,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  )
  throwIfSupabaseError(inserted.error)
}
