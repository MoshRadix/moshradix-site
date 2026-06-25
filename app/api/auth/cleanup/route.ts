import { NextResponse, type NextRequest } from "next/server"

import { deleteExpiredUnverifiedUsers } from "@/lib/samugaa/email-verification-cleanup"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const deletedUsers = await deleteExpiredUnverifiedUsers()

  return NextResponse.json({ success: true, deletedUsers })
}
