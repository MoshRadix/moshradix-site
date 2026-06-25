import type { Metadata } from "next"
import Link from "next/link"
import { AlertTriangle, Mail, ShieldCheck } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://moshradix.dev"

export const metadata: Metadata = {
  title: "Samugaa Help",
  description: "Help and privacy-rights instructions for Samugaa users.",
  alternates: {
    canonical: `${baseUrl}/samugaa/help`,
  },
}

export default function SamugaaHelpPage() {
  return (
    <main className="px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 space-y-4">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Samugaa support</p>
          <h1 className="font-[var(--font-space-grotesk)] text-4xl font-bold tracking-tight">
            Help and Privacy Requests
          </h1>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Samugaa is an offline-first productivity app. This page explains how users can request account deletion,
            data deletion, or privacy support.
          </p>
        </div>

        <div className="space-y-5">
          <section className="rounded-xl border border-border/70 bg-card/70 p-6">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
              <h2 className="text-xl font-semibold tracking-tight">Request account deletion</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Any Samugaa user can request deletion of their account and all associated synced data. Open the account
              deletion page, sign in with the Samugaa account you want deleted, and press Request Deletion. The request
              is logged, administrators are notified, and the account is flagged for deletion according to backend
              policies. Once deletion is processed, it is irreversible.
            </p>
            <Link
              className="mt-5 inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90"
              href="/samugaa/account-deletion"
            >
              Request Account Deletion
            </Link>
          </section>

          <section className="rounded-xl border border-border/70 bg-card/70 p-6">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold tracking-tight">GDPR and CCPA privacy rights</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Depending on your location, you may have the right to access, correct, export, delete, object to, or
              restrict processing of personal information. Account deletion requests must be authenticated so only the
              rightful account owner can submit them.
            </p>
          </section>

          <section className="rounded-xl border border-border/70 bg-card/70 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Mail className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold tracking-tight">Contact support</h2>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              If you cannot sign in or need help with a privacy request, contact Mohamed Shamil at{" "}
              <a className="text-primary underline-offset-4 hover:underline" href="mailto:shaamil.is@gmail.com">
                shaamil.is@gmail.com
              </a>
              . Include the email address associated with your Samugaa account so the request can be verified.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
