/* ============================================================
   MathLingo — Claude API
   "I didn't understand" asks Claude for a brand-new explanation.
   Tries, in order: (1) a personal Claude key pasted in Settings,
   (2) the shared /api/explain proxy (works with zero setup for
   any visitor, if the site owner configured ANTHROPIC_API_KEY),
   (3) falls back to the built-in explanation variants in
   exercises.js if both are unavailable.
   ============================================================ */
const AI = (() => {
  function settings() {
    try { return JSON.parse(localStorage.getItem('manara-settings') || '{}'); }
    catch { return {}; }
  }

  const SYSTEM_PROMPT =
    'You are "مومو" (Momo), a super friendly cartoon owl math tutor, like the Duolingo mascot. ' +
    'You speak Modern Standard Arabic ONLY. The student did NOT understand the previous explanations, ' +
    'so explain the SAME concept in a COMPLETELY different, simpler way in Arabic ' +
    '(new analogy, real-life story, drawing-style steps). ' +
    'Reply ONLY with JSON in this exact shape, no markdown fences: ' +
    '{"bubble":"جملة أو جملتان قصيرتان وودّيتان بالعربية تقدمان الشرح الجديد",' +
    '"steps":["سطر دفتر قصير 1","سطر 2","..."],' +
    '"speech":"الشرح الكامل كنص منطوق طبيعي بالعربية، بدون رموز: قل زائد/ناقص/في/على/يساوي بالكلمات"} ' +
    'Keep steps short (max 8 lines, each under 60 chars). Wrap any math formula inside a step with ' +
    '<span dir=\'ltr\'>...</span> so it displays correctly in the RTL page. You may also highlight parts ' +
    'with <span class=\'hl\'>...</span> (red) or <span class=\'hl2\'>...</span> (green).';

  function learnerProfile() {
    try {
      const s = JSON.parse(localStorage.getItem('manara-state') || '{}');
      const o = s.onboarding;
      if (!o) return '';
      const paceMap = { productive: 'يحب الشرح السريع والمباشر', balanced: 'يحب توازن بين السرعة والتفصيل', relaxed: 'يفضّل شرحًا هادئًا وبطيئًا بدون استعجال' };
      const gradeMap = { elementary: 'مرحلة ابتدائية', secondary: 'مرحلة متوسطة أو ثانوية', university: 'مرحلة جامعية أو بالغ' };
      const parts = [];
      if (o.gradeLevel) parts.push(gradeMap[o.gradeLevel] || o.gradeLevel);
      if (o.age) parts.push(`الفئة العمرية ${o.age}`);
      if (o.pace) parts.push(paceMap[o.pace] || o.pace);
      return parts.length ? `\nLearner profile (adapt tone/complexity accordingly, but keep replying in Arabic): ${parts.join('، ')}.` : '';
    } catch { return ''; }
  }

  function buildUserContent(lesson, previousExplanations) {
    const prev = previousExplanations
      .map((e, i) => `Attempt ${i + 1}: ${e.speech}`)
      .join('\n');
    return `Lesson topic: ${lesson.title}\nThe exam being taught: ${lesson.explanations[0].steps.join(' | ')}\n\nExplanations the student already saw and did not understand:\n${prev}${learnerProfile()}\n\nGive a NEW different explanation.`;
  }

  /* shared by both the direct call and the proxy call: both return the
     raw Anthropic /v1/messages response shape */
  function parseAnthropicResponse(data) {
    const block = (data.content || []).find(b => b.type === 'text');
    let text = (block && block.text || '').trim();
    if (!text) throw new Error('Claude returned no text content (stop_reason: ' + data.stop_reason + ')');

    // tolerate accidental code fences or stray prose around the JSON
    text = text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1 || last < first) {
      throw new Error('No JSON object found in Claude response (stop_reason: ' + data.stop_reason + '): ' + text.slice(0, 150));
    }
    text = text.slice(first, last + 1);

    const parsed = JSON.parse(text);
    if (parsed.bubble && Array.isArray(parsed.steps) && parsed.speech) return parsed;
    throw new Error('Claude JSON missing required fields: ' + JSON.stringify(Object.keys(parsed)));
  }

  /* Direct to Anthropic, using the user's own key pasted in Settings. */
  async function explainDirect(system, content, key) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1600,
        system,
        messages: [{ role: 'user', content }]
      })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Claude API error ${res.status}: ${errBody.slice(0, 200)}`);
    }
    return parseAnthropicResponse(await res.json());
  }

  /* Via the shared Manara backend proxy — no personal key required.
     Throws (caught by the caller) until MANARA_CONFIG.API_BASE is configured. */
  async function explainProxy(system, content) {
    if (!MANARA_CONFIG.API_BASE) throw new Error('proxy not configured');
    const res = await fetch(MANARA_CONFIG.API_BASE + '/api/manara/public/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Id': MANARA_CONFIG.APP_SLUG },
      body: JSON.stringify({ system, content })
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || ('Explain proxy error ' + res.status));
    }
    return parseAnthropicResponse(await res.json());
  }

  return {
    /**
     * Ask Claude to re-explain a lesson in a different way.
     * Returns { bubble, steps[], speech } or null if every path failed.
     */
    async reExplain(lesson, previousExplanations) {
      const key = settings().claudeKey;
      const system = SYSTEM_PROMPT;
      const content = buildUserContent(lesson, previousExplanations);

      if (key) {
        try { return await explainDirect(system, content, key); }
        catch (e) { console.warn('Claude (personal key) failed, trying shared proxy:', e.message); }
      }
      try { return await explainProxy(system, content); }
      catch (e) { console.warn('Claude shared proxy unavailable, using built-in variant:', e.message); }
      return null;
    }
  };
})();
