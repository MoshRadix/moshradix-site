type VerificationEmail = {
  verificationUrl: string
  to: string
  userName?: string | null
}

const DEFAULT_FROM_EMAIL = "Samugaa <noreply@samugaa.mosh-one.us>"

export function isVerificationEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY)
}

export function buildVerificationUrl(token: string) {
  const verifyUrl =
    process.env.SAMUGAA_EMAIL_VERIFY_URL ||
    `${trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || "https://mosh-one.us")}/verify-email`
  const separator = verifyUrl.includes("?") ? "&" : "?"

  return `${verifyUrl}${separator}token=${encodeURIComponent(token)}`
}

export async function sendVerificationEmail({
  verificationUrl,
  to,
  userName,
}: VerificationEmail) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send verification emails")
  }

  const recipient = userName?.trim() || "there"
  const from =
    process.env.SAMUGAA_EMAIL_VERIFY_FROM_EMAIL ||
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
      subject: "Verify your Samugaa account",
      html: `
        <div style="font-family: Arial, sans-serif; color: #17211f; line-height: 1.5;">
          <p>Hello ${escapeHtml(recipient)},</p>
          <p>Verify your email address to finish creating your Samugaa account.</p>
          <p>
            <a href="${escapeHtml(verificationUrl)}" style="display: inline-block; background: #256f68; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">
              Verify email
            </a>
          </p>
          <p>This link expires in 1 hour. Unverified accounts are deleted after the link expires.</p>
        </div>
      `,
      text: `Hello ${recipient},\n\nVerify your Samugaa account using this link:\n${verificationUrl}\n\nThis link expires in 1 hour. Unverified accounts are deleted after the link expires.`,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Verification email could not be sent.${detail ? ` ${detail}` : ""}`)
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
