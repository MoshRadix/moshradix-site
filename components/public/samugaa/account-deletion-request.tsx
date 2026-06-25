"use client"

import { FormEvent, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Loader2, LogIn, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AuthUser = {
  id: string
  email: string
  name?: string | null
}

type RequestState = "idle" | "authenticating" | "authenticated" | "submitting" | "success" | "error"

export function AccountDeletionRequest() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [state, setState] = useState<RequestState>("idle")

  const canLogin = useMemo(
    () => state !== "authenticating" && email.includes("@") && password.length > 0,
    [email, password, state],
  )
  const canRequest = Boolean(token && user && state !== "submitting" && state !== "success")

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setState("authenticating")

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "login",
          email,
          password,
          deviceName: "Account deletion web portal",
          platform: "web",
        }),
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string | { formErrors?: string[]; fieldErrors?: Record<string, string[]> }
        token?: string
        user?: AuthUser
      }

      if (!response.ok || !data.token || !data.user) {
        throw new Error(formatRequestError(data.error) || "Sign in failed. Check your email and password.")
      }

      setToken(data.token)
      setUser(data.user)
      setPassword("")
      setState("authenticated")
      setMessage("You are signed in. Review the warning before requesting deletion.")
    } catch (error) {
      setToken("")
      setUser(null)
      setState("error")
      setMessage((error as Error).message)
    }
  }

  async function handleDeletionRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setState("submitting")

    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
      }

      if (!response.ok) {
        throw new Error(data.error || "Deletion request could not be submitted.")
      }

      setState("success")
      setMessage(data.message || "Your account deletion request has been recorded.")
    } catch (error) {
      setState("error")
      setMessage((error as Error).message)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-2xl items-center px-4 py-16">
      <main className="w-full rounded-xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-primary/5 backdrop-blur md:p-8">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Samugaa account</p>
            <h1 className="mt-2 font-[var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground">
              Request Account Deletion
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Any Samugaa user can request deletion of their account and all associated data. Once processed, this
              action is irreversible and deleted account data cannot be restored.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <p className="leading-6">
              For your protection, you must sign in before submitting this request. This ensures only the rightful
              account owner can flag an account for deletion.
            </p>
          </div>
        </div>

        {message ? (
          <StatusMessage
            message={message}
            tone={state === "success" || state === "authenticated" ? "success" : "error"}
          />
        ) : null}

        {!user || !token ? (
          <form className="mt-6 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <Input
                autoComplete="email"
                disabled={state === "authenticating"}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Input
                autoComplete="current-password"
                disabled={state === "authenticating"}
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>

            <Button className="w-full" disabled={!canLogin} size="lg" type="submit">
              {state === "authenticating" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Signing in
                </>
              ) : (
                <>
                  <LogIn className="size-4" aria-hidden="true" />
                  Sign in to continue
                </>
              )}
            </Button>
          </form>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleDeletionRequest}>
            <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Signed in as</p>
              <p className="mt-2 text-sm font-medium text-foreground">{user.email}</p>
            </div>

            <Button className="w-full" disabled={!canRequest} size="lg" type="submit" variant="destructive">
              {state === "submitting" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Requesting deletion
                </>
              ) : (
                "Request Deletion"
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          See the{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/samugaa/help">
            Samugaa Help page
          </Link>{" "}
          for deletion timelines, privacy rights, and support instructions.
        </p>
      </main>
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

function formatRequestError(error: unknown) {
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
