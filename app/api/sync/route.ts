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
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const body = await readJson(req)
  if (!body) return jsonResponse({ error: "Invalid JSON" }, { status: 400 })

  const parsed = SyncRequestSchema.safeParse(body)
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

  const deviceId = req.headers.get("X-Device-ID") ?? `device-${createId()}`
  const { since, notes: clientNotes, todos: clientTodos, workLogs: clientWorkLogs } = parsed.data
  const syncedAt = nowIso()

  const [noteResults, todoResults, workLogResults] = await Promise.all([
    syncNotes(user.userId, deviceId, clientNotes),
    syncTodos(user.userId, deviceId, clientTodos),
    syncWorkLogs(user.userId, deviceId, clientWorkLogs),
  ])

  const sinceDate = since ? new Date(since).toISOString() : new Date(0).toISOString()
  const supabase = getSupabase()
  const serverNotes = await supabase
    .from(tables.notes)
    .select("id,title,content,clientId,isDeleted,deletedAt,createdAt,updatedAt,syncVersion,deviceId")
    .eq("userId", user.userId)
    .gt("updatedAt", sinceDate)
  throwIfSupabaseError(serverNotes.error)

  const serverTodosResult = await supabase
    .from(tables.todos)
    .select("*")
    .eq("userId", user.userId)
    .gt("updatedAt", sinceDate)
  throwIfSupabaseError(serverTodosResult.error)

  const serverTodos = await attachSubtasks(serverTodosResult.data ?? [])

  const serverWorkLogs = await supabase
    .from(tables.workLogs)
    .select("*")
    .eq("userId", user.userId)
    .gt("updatedAt", sinceDate)
  throwIfSupabaseError(serverWorkLogs.error)

  return jsonResponse({
    syncedAt,
    notes: {
      ...noteResults,
      serverChanges: serverNotes.data ?? [],
    },
    todos: {
      ...todoResults,
      serverChanges: serverTodos,
    },
    workLogs: {
      ...workLogResults,
      serverChanges: serverWorkLogs.data ?? [],
    },
  })
}

export function OPTIONS() {
  return optionsResponse()
}

async function syncNotes(userId: string, deviceId: string, clientNotes: z.infer<typeof SyncNoteSchema>[]) {
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
      const note = await supabase
        .from(tables.notes)
        .insert({
          id: createId(),
          userId,
          title: clientNote.title,
          content: clientNote.content,
          clientId: clientNote.clientId,
          deviceId,
          isDeleted: clientNote.isDeleted,
          deletedAt: clientNote.isDeleted ? timestamp : null,
          syncVersion: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .select("id")
        .single()
      throwIfSupabaseError(note.error)
      if (!note.data) throw new Error("Note creation did not return a row")
      created.push(note.data.id)
      continue
    }

    if (new Date(clientNote.clientUpdatedAt) >= new Date(existing.data.updatedAt)) {
      const note = await supabase
        .from(tables.notes)
        .update({
          title: clientNote.title,
          content: clientNote.content,
          deviceId,
          isDeleted: clientNote.isDeleted,
          deletedAt: clientNote.isDeleted ? timestamp : null,
          updatedAt: timestamp,
          syncVersion: (existing.data.syncVersion ?? 1) + 1,
        })
        .eq("id", existing.data.id)
        .select("id")
        .single()
      throwIfSupabaseError(note.error)
      if (!note.data) throw new Error("Note update did not return a row")
      updated.push(note.data.id)
    } else {
      conflicts.push({ clientId: clientNote.clientId, serverNote: existing.data })
    }
  }

  return { created, updated, conflicts }
}

async function syncTodos(userId: string, deviceId: string, clientTodos: z.infer<typeof SyncTodoSchema>[]) {
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

async function syncWorkLogs(userId: string, deviceId: string, clientWorkLogs: z.infer<typeof SyncWorkLogSchema>[]) {
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
