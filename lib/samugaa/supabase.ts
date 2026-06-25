import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null

export const tables = {
  users: process.env.SAMUGAA_TABLE_USERS || "User",
  devices: process.env.SAMUGAA_TABLE_DEVICES || "Device",
  notes: process.env.SAMUGAA_TABLE_NOTES || "Note",
  todos: process.env.SAMUGAA_TABLE_TODOS || "Todo",
  workLogs: process.env.SAMUGAA_TABLE_WORK_LOGS || "WorkLog",
  subtasks: process.env.SAMUGAA_TABLE_SUBTASKS || "Subtask",
  syncLogs: process.env.SAMUGAA_TABLE_SYNC_LOGS || "SyncLog",
  passwordResetTokens: process.env.SAMUGAA_TABLE_PASSWORD_RESET_TOKENS || "PasswordResetToken",
  emailVerificationTokens: process.env.SAMUGAA_TABLE_EMAIL_VERIFICATION_TOKENS || "EmailVerificationToken",
  accountDeletionRequests: process.env.SAMUGAA_TABLE_ACCOUNT_DELETION_REQUESTS || "AccountDeletionRequest",
}

export function getSupabase() {
  if (supabase) return supabase

  const url = process.env.samugaa_SUPABASE_URL || process.env.NEXT_PUBLIC_samugaa_SUPABASE_URL
  const key =
    process.env.samugaa_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.samugaa_SUPABASE_SECRET_KEY ||
    process.env.samugaa_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_samugaa_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Samugaa Supabase URL and server key are required")
  }

  supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabase
}

export function throwIfSupabaseError(error: unknown) {
  if (error) {
    throw error
  }
}
