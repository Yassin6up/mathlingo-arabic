/* ============================================================
   Vercel Edge Function — Claude re-explain proxy
   Keeps the Anthropic API key server-side. The frontend sends
   the already-built system + user prompt and gets back the raw
   Anthropic response, which ai.js parses exactly like a direct
   call. Returns 501 if no key is configured, so the frontend
   falls back to the built-in explanation variants.
   ============================================================ */
export const config = { runtime: 'edge' };

const MAX_CHARS = 6000;

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'Explain proxy not configured' }), {
      status: 501, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const system = String(body.system || '').slice(0, MAX_CHARS);
  const content = String(body.content || '').slice(0, MAX_CHARS);
  if (!system || !content) {
    return new Response(JSON.stringify({ error: 'Missing system/content' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1600,
        system,
        messages: [{ role: 'user', content }]
      })
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Upstream request failed' }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await upstream.json().catch(() => ({}));
  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' }
  });
}
