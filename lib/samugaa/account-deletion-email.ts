type AccountDeletionEmail = {
  email: string
  requestId: string
  requestedAt: string
  userId: string
}

const DEFAULT_FROM_EMAIL = "Samugaa <noreply@samugaa.mosh-one.us>"

export function isAccountDeletionEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && getAccountDeletionAdminEmail())
}

export function getAccountDeletionAdminEmail() {
  return (
    process.env.SAMUGAA_ACCOUNT_DELETION_ADMIN_EMAIL ||
    process.env.SAMUGAA_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    null
  )
}

export async function sendAccountDeletionRequestEmail({
  email,
  requestId,
  requestedAt,
  userId,
}: AccountDeletionEmail) {
  const apiKey = process.env.RESEND_API_KEY
  const to = getAccountDeletionAdminEmail()

  if (!apiKey || !to) {
    throw new Error("RESEND_API_KEY and an account deletion admin email are required")
  }

  const from =
    process.env.SAMUGAA_ACCOUNT_DELETION_FROM_EMAIL ||
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
      subject: "Samugaa account deletion request",
      html: `
        <div style="font-family: Arial, sans-serif; color: #17211f; line-height: 1.5;">
          <p>A Samugaa user requested account deletion.</p>
          <ul>
            <li><strong>Email:</strong> ${escapeHtml(email)}</li>
            <li><strong>User ID:</strong> ${escapeHtml(userId)}</li>
            <li><strong>Request ID:</strong> ${escapeHtml(requestId)}</li>
            <li><strong>Requested at:</strong> ${escapeHtml(requestedAt)}</li>
          </ul>
          <p>Review this request and process deletion according to backend retention and legal policies.</p>
        </div>
      `,
      text: `A Samugaa user requested account deletion.\n\nEmail: ${email}\nUser ID: ${userId}\nRequest ID: ${requestId}\nRequested at: ${requestedAt}\n\nReview this request and process deletion according to backend retention and legal policies.`,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Account deletion notification could not be sent.${detail ? ` ${detail}` : ""}`)
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
