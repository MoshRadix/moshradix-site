import { type NextRequest } from "next/server"
import { z } from "zod"
import { getUserFromRequest } from "@/lib/samugaa/auth"
import { createId, jsonResponse, nowIso, optionsResponse, readJson, unauthorizedResponse } from "@/lib/samugaa/api"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

const SubtaskCreateSchema = z.object({
  text: z.string(),
  done: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

const TodoCreateSchema = z.object({
  text: z.string().min(1),
  notes: z.string().optional(),
  done: z.boolean().default(false),
  doneAt: z.string().nullable().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  tags: z.array(z.string()).default([]),
  clientId: z.string().optional(),
  subtasks: z.array(SubtaskCreateSchema).optional(),
  deletedAt: z.string().nullable().optional(),
})

const TodoQuerySchema = z.object({
  since: z.string().optional(),
  includeDeleted: z.string().optional(),
  done: z.string().optional(),
  priority: z.string().optional(),
  tag: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  limit: z.coerce.number().default(500),
  offset: z.coerce.number().default(0),
})

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const params = TodoQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
  if (!params.success) return jsonResponse({ error: params.error.flatten() }, { status: 400 })

  const { since, includeDeleted, done, priority, tag, dueDateFrom, dueDateTo, limit, offset } = params.data
  const supabase = getSupabase()
  let query = supabase.from(tables.todos).select("*", { count: "exact" }).eq("userId", user.userId)

  if (includeDeleted !== "true") query = query.eq("isDeleted", false)
  if (since) query = query.gt("updatedAt", new Date(since).toISOString())
  if (done !== undefined) query = query.eq("done", done === "true")
  if (priority) query = query.eq("priority", priority)
  if (tag) query = query.contains("tags", [tag])
  if (dueDateFrom) query = query.gte("dueDate", dueDateFrom)
  if (dueDateTo) query = query.lte("dueDate", dueDateTo)

  const todosResult = await query
    .order("done", { ascending: true })
    .order("dueDate", { ascending: true })
    .order("createdAt", { ascending: true })
    .range(offset, offset + limit - 1)
  throwIfSupabaseError(todosResult.error)

  const todos = await attachSubtasks(todosResult.data ?? [])
  return jsonResponse({ todos, total: todosResult.count ?? 0, limit, offset })
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorizedResponse()

  const body = await readJson(req)
  if (!body) return jsonResponse({ error: "Invalid JSON" }, { status: 400 })

  const parsed = TodoCreateSchema.safeParse(body)
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, { status: 422 })

  const supabase = getSupabase()
  const { text, notes, done, doneAt, dueDate, priority, tags, clientId, subtasks, deletedAt } = parsed.data
  const deviceId = req.headers.get("X-Device-ID") ?? undefined
  const timestamp = nowIso()

  if (clientId) {
    const existing = await supabase
      .from(tables.todos)
      .select("id,syncVersion")
      .eq("clientId", clientId)
      .eq("userId", user.userId)
      .maybeSingle()
    throwIfSupabaseError(existing.error)

    if (existing.data) {
      const todo = await supabase
        .from(tables.todos)
        .update({
          text,
          notes: notes ?? "",
          done,
          doneAt: done ? (doneAt ?? timestamp) : null,
          dueDate: dueDate ?? null,
          priority,
          tags,
          deviceId: deviceId ?? null,
          isDeleted: deletedAt ? true : false,
          deletedAt: deletedAt ?? null,
          updatedAt: timestamp,
          syncVersion: (existing.data.syncVersion ?? 1) + 1,
        })
        .eq("id", existing.data.id)
        .select("*")
        .single()
      throwIfSupabaseError(todo.error)
      if (deletedAt) {
        const logDeleteResult = await supabase
          .from(tables.workLogs)
          .update({
            isDeleted: true,
            deletedAt: timestamp,
            updatedAt: timestamp,
          })
          .eq("userId", user.userId)
          .or(`linkedTodoId.eq.${existing.data.id},linkedTodoId.eq.${clientId}`)
        throwIfSupabaseError(logDeleteResult.error)
      }
      return jsonResponse({ todo: { ...todo.data, subtasks: [] } })
    }
  }

  const todoId = createId()
  const todo = await supabase
    .from(tables.todos)
    .insert({
      id: todoId,
      userId: user.userId,
      text,
      notes: notes ?? "",
      done,
      doneAt: done ? (doneAt ?? timestamp) : null,
      dueDate: dueDate ?? null,
      priority,
      tags,
      clientId: clientId ?? null,
      deviceId: deviceId ?? null,
      syncVersion: 1,
      isDeleted: deletedAt ? true : false,
      deletedAt: deletedAt ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .select("*")
    .single()
  throwIfSupabaseError(todo.error)

  const createdSubtasks = await replaceSubtasks(todoId, subtasks ?? [])
  if (deletedAt) {
    const logDeleteResult = await supabase
      .from(tables.workLogs)
      .update({
        isDeleted: true,
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
      .eq("userId", user.userId)
      .or(`linkedTodoId.eq.${todoId},linkedTodoId.eq.${clientId}`)
    throwIfSupabaseError(logDeleteResult.error)
  }
  await logSync(user.userId, deviceId, "todo", todo.data.id, "create")
  return jsonResponse({ todo: { ...todo.data, subtasks: createdSubtasks } }, { status: 201 })
}

export function OPTIONS() {
  return optionsResponse()
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

async function replaceSubtasks(todoId: string, subtasks: z.infer<typeof SubtaskCreateSchema>[]) {
  const timestamp = nowIso()
  const supabase = getSupabase()
  await supabase.from(tables.subtasks).delete().eq("todoId", todoId)

  if (subtasks.length === 0) return []

  const inserted = await supabase
    .from(tables.subtasks)
    .insert(
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
    .select("*")
  throwIfSupabaseError(inserted.error)
  return inserted.data ?? []
}

async function logSync(userId: string, deviceId: string | undefined, entity: string, entityId: string, action: string) {
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
        createdAt: nowIso(),
      })
  } catch {
    // Sync logging should never block the main todos workflow.
  }
}
