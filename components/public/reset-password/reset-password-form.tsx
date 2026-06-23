"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ResetPasswordFormProps = {
  token?: string
}

type ResetState = "idle" | "submitting" | "success" | "error"

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<ResetState>("idle")

  const tokenMissing = !token
  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword
  const canSubmit = useMemo(
    () =>
      !tokenMissing &&
      state !== "submitting" &&
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      password === confirmPassword,
    [confirmPassword, password, state, tokenMissing],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!token) {
      setState("error")
      setMessage("This reset link is missing its token. Request a new password reset link from the app.")
      return
    }

    if (password.length < 8) {
      setState("error")
      setMessage("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setState("error")
      setMessage("Both password fields must match.")
      return
    }

    setState("submitting")

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "resetPassword",
          token,
          password,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
      }

      if (!response.ok) {
        throw new Error(formatResetError(data.error) || "Password reset failed. Request a new link and try again.")
      }

      setPassword("")
      setConfirmPassword("")
      setState("success")
      setMessage("Your password has been reset. You can return to the Samugaa app and sign in.")
    } catch (error) {
      setState("error")
      setMessage((error as Error).message)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-lg items-center px-4 py-16">
      <div className="w-full rounded-2xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur md:p-8">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-foreground">
              Reset Samugaa Password
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Choose a new password for your account. This link expires after 1 hour.
            </p>
          </div>
        </div>

        {tokenMissing ? (
          <StatusMessage
            tone="error"
            message="This reset link is incomplete. Open the latest reset email or request a new link from the app."
          />
        ) : null}

        {state === "success" ? (
          <div className="space-y-6">
            <StatusMessage tone="success" message={message ?? "Your password has been reset."} />
            <Button asChild className="w-full" size="lg">
              <Link href="/">Done</Link>
            </Button>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                New password
              </label>
              <Input
                autoComplete="new-password"
                disabled={tokenMissing || state === "submitting"}
                id="password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                type="password"
                value={password}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="confirm-password">
                Confirm password
              </label>
              <Input
                aria-invalid={passwordMismatch}
                autoComplete="new-password"
                disabled={tokenMissing || state === "submitting"}
                id="confirm-password"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter new password"
                required
                type="password"
                value={confirmPassword}
              />
              {passwordMismatch ? (
                <p className="text-sm text-destructive">Passwords do not match.</p>
              ) : null}
            </div>

            {message ? <StatusMessage tone={state === "error" ? "error" : "success"} message={message} /> : null}

            <Button className="w-full" disabled={!canSubmit} size="lg" type="submit">
              {state === "submitting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Resetting password
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

function StatusMessage({ message, tone }: { message: string; tone: "error" | "success" }) {
  const isSuccess = tone === "success"

  return (
    <div
      className={
        isSuccess
          ? "flex gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-foreground"
          : "flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-foreground"
      }
      role={isSuccess ? "status" : "alert"}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      ) : (
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
      )}
      <p className="leading-6">{message}</p>
    </div>
  )
}

function formatResetError(error: unknown) {
  if (typeof error === "string") return error

  if (error && typeof error === "object") {
    const validationError = error as {
      fieldErrors?: Record<string, string[]>
      formErrors?: string[]
    }
    const messages = [
      ...(validationError.formErrors ?? []),
      ...Object.values(validationError.fieldErrors ?? {}).flat(),
    ]

    return messages.join("\n")
  }

  return null
}
