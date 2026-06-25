import { nowIso } from "@/lib/samugaa/api"
import { getSupabase, tables, throwIfSupabaseError } from "@/lib/samugaa/supabase"

export async function deleteExpiredUnverifiedUsers(supabase = getSupabase()) {
  const deleted = await supabase
    .from(tables.users)
    .delete()
    .is("emailVerifiedAt", null)
    .lte("verificationExpiresAt", nowIso())
    .select("id")

  throwIfSupabaseError(deleted.error)

  return deleted.data?.length ?? 0
}
