type PasswordResetEmail = {
  resetUrl: string
  to: string
  userName?: string | null
}

const DEFAULT_FROM_EMAIL = "Samugaa <noreply@samugaa.mosh-one.us>"

export function isPasswordResetEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export function buildPasswordResetUrl(token: string) {
  const resetUrl =
    process.env.SAMUGAA_PASSWORD_RESET_URL ||
    `${trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://mosh-one.us")}/reset-password`
  const separator = resetUrl.includes("?") ? "&" : "?"

  return `${resetUrl}${separator}token=${encodeURIComponent(token)}`
}

export async function sendPasswordResetEmail({
  resetUrl,
  to,
  userName,
}: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send password reset emails")
  }

  const recipient = userName?.trim() || "there"
  const from =
    process.env.SAMUGAA_PASSWORD_RESET_FROM_EMAIL ||
    process.env.PASSWORD_RESET_FROM_EMAIL ||
    DEFAULT_FROM_EMAIL

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Samugaa password",
      html: `
        <div style="font-family: Arial, sans-serif; color: #17211f; line-height: 1.5;">
          <p>Hello ${escapeHtml(recipient)},</p>
          <p>We received a request to reset your Samugaa password.</p>
          <p>
            <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #256f68; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">
              Reset password
            </a>
          </p>
          <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
      text: `Hello ${recipient},\n\nReset your Samugaa password using this link:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.`,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Password reset email could not be sent.${detail ? ` ${detail}` : ""}`)
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "")
}
