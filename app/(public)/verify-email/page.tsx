import type { Metadata } from "next"

import { VerifyEmailStatus } from "@/components/public/verify-email/verify-email-status"

export const metadata: Metadata = {
  title: "Verify Samugaa Email",
  description: "Verify your Samugaa account email address.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return <VerifyEmailStatus token={token} />
}
