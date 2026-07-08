/* ============================================================
   Vercel Edge Function — ElevenLabs TTS proxy
   Keeps the ElevenLabs API key server-side so it never reaches
   the browser. The frontend calls this at a relative /api/tts
   URL, which only ever resolves same-origin, so no CORS is
   needed. Streams the upstream response straight through so
   playback starts on the first audio chunk, not the full file.
   ============================================================ */
export const config = { runtime: 'edge' };

const MAX_CHARS = 600;
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs "Rachel"

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'TTS proxy not configured' }), {
      status: 501, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const text = String(body.text || '').slice(0, MAX_CHARS).trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const voiceId = body.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;
  const speed = Math.min(1.2, Math.max(0.7, Number(body.speed) || 1.2));

  let upstream;
  try {
    upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=4`,
      {
        method: 'POST',
        headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, speed }
        })
      }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Upstream request failed' }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return new Response(JSON.stringify({ error: 'ElevenLabs error ' + upstream.status, detail: detail.slice(0, 200) }), {
      status: 502, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' }
  });
}
