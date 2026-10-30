// deno-lint-ignore-file no-explicit-any
/* ============================================================
TAKIDOC — OUTILS HTTP ET SUPABASE PARTAGÉS
============================================================ */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from './cors.ts'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function json(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  })
}

export function fail(
  req: Request,
  code: string,
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
): Response {
  return json(req, { error: code, message, ...extra }, status)
}

export async function readJson(
  req: Request,
  maxChars = 300_000,
): Promise<Record<string, unknown> | null> {
  try {
    const text = await req.text()
    if (text.length > maxChars) return null

    const data = JSON.parse(text)
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !key) throw new Error("CONFIG_MISSING")

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getAuthUser(
  admin: SupabaseClient,
  req: Request,
): Promise<{ id: string; email: string | null } | null> {
  const header = req.headers.get('Authorization') ?? ''
  const token = header.replace(/^Bearer\s+/i, '').trim()

  if (!token) return null

  try {
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data?.user) return null

    return { id: data.user.id, email: data.user.email ?? null }
  } catch {
    return null
  }
}