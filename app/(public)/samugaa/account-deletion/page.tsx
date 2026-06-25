import type { Metadata } from "next"
import { AccountDeletionRequest } from "@/components/public/samugaa/account-deletion-request"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moshradix.dev"

export const metadata: Metadata = {
  title: "Request Account Deletion",
  description:
    "Request deletion of a Samugaa account and associated data. Users must authenticate before submitting a deletion request.",
  alternates: {
    canonical: `${baseUrl}/samugaa/account-deletion`,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SamugaaAccountDeletionPage() {
  return <AccountDeletionRequest />
}
