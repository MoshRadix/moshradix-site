export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Device-ID",
}

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  })
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export function unauthorizedResponse() {
  return jsonResponse({ error: "Unauthorized" }, { status: 401 })
}

export async function readJson(req: Request) {
  try {
    return await req.json()
  } catch {
    return null
  }
}

export function nowIso() {
  return new Date().toISOString()
}

export function createId() {
  return crypto.randomUUID()
}
