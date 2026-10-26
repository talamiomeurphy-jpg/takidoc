/* ============================================================
TAKIDOC — CORS RESTREINT
Seules les origines listées dans le secret ALLOWED_ORIGINS
(séparées par des virgules) peuvent appeler les fonctions
depuis un navigateur. Fini le « * » ouvert à tout le monde.
============================================================ */

const DEFAULT_ORIGINS = [
  'https://takidoc.onrender.com',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
]

export function allowedOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGINS')
  const list = raw ? raw.split(',') : DEFAULT_ORIGINS

  return list
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = (req.headers.get('Origin') ?? '').replace(/\/$/, '')
  const origins = allowedOrigins()
  const allowed = origins.includes(origin)

  return {
    // Origine non autorisée : on renvoie la première origine légitime,
    // le navigateur bloquera donc la réponse.
    'Access-Control-Allow-Origin': allowed ? origin : (origins[0] ?? ''),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

/* Répond aux requêtes de pré-vérification (OPTIONS) */
export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) })
  }
  return null
}
