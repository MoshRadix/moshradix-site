"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

type VerifyEmailStatusProps = {
  token?: string
}

type VerifyState = "verifying" | "success" | "error"

export function VerifyEmailStatus({ token }: VerifyEmailStatusProps) {
  const [state, setState] = useState<VerifyState>(token ? "verifying" : "error")
  const [message, setMessage] = useState(
    token ? "Verifying your email address..." : "This verification link is incomplete.",
  )

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function verify() {
      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "verifyEmail",
            token,
          }),
        })
        const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string }

        if (!response.ok) {
          throw new Error(data.error || "Verification failed. Request a new account verification email.")
        }

        if (!cancelled) {
          setState("success")
          setMessage(data.message || "Email verified. You can now sign in to Samugaa.")
        }
      } catch (error) {
        if (!cancelled) {
          setState("error")
          setMessage((error as Error).message)
        }
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [token])

  const isSuccess = state === "success"
  const isVerifying = state === "verifying"

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-lg items-center px-4 py-16">
      <div className="w-full rounded-2xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur md:p-8">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isVerifying ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : isSuccess ? (
              <CheckCircle2 className="size-6" aria-hidden="true" />
            ) : (
              <ShieldAlert className="size-6 text-destructive" aria-hidden="true" />
            )}
          </div>
          <div>
            <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-foreground">
              Verify Samugaa Email
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Account verification links expire after 1 hour.
            </p>
          </div>
        </div>

        <div
          className={
            isSuccess
              ? "rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-foreground"
              : isVerifying
                ? "rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6 text-foreground"
                : "rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6 text-foreground"
          }
          role={isSuccess || isVerifying ? "status" : "alert"}
        >
          {message}
        </div>

        <Button asChild className="mt-6 w-full" size="lg">
          <Link href="/">Done</Link>
        </Button>
      </div>
    </div>
  )
}
