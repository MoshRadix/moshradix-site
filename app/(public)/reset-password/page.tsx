import type { Metadata } from "next"

import { ResetPasswordForm } from "@/components/public/reset-password/reset-password-form"

export const metadata: Metadata = {
  title: "Reset Samugaa Password",
  description: "Choose a new password for your Samugaa account.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return <ResetPasswordForm token={token} />
}
