/* ============================================================
   MathLingo — Claude API (optional)
   When a Claude API key is saved in Settings, "I didn't
   understand" asks Claude for a brand-new explanation.
   Without a key, the app cycles through the built-in
   explanation variants in exercises.js.
   ============================================================ */
const AI = (() => {
  function settings() {
    try { return JSON.parse(localStorage.getItem('mathlingo-settings') || '{}'); }
    catch { return {}; }
  }

  return {
    hasKey() { return !!settings().claudeKey; },

    /**
     * Ask Claude to re-explain a lesson in a different way.
     * Returns { bubble, steps[], speech } or null on failure.
     */
    async reExplain(lesson, previousExplanations) {
      const key = settings().claudeKey;
      if (!key) return null;

      const prev = previousExplanations
        .map((e, i) => `Attempt ${i + 1}: ${e.speech}`)
        .join('\n');

      try {
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
            system:
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
              'with <span class=\'hl\'>...</span> (red) or <span class=\'hl2\'>...</span> (green).',
            messages: [{
              role: 'user',
              content: `Lesson topic: ${lesson.title}\nThe exam being taught: ${lesson.explanations[0].steps.join(' | ')}\n\nExplanations the student already saw and did not understand:\n${prev}\n\nGive a NEW different explanation.`
            }]
          })
        });
        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          throw new Error(`Claude API error ${res.status}: ${errBody.slice(0, 200)}`);
        }
        const data = await res.json();
        // find the first text block (skip any thinking/tool blocks)
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
      } catch (e) {
        console.warn('Claude re-explain failed, using built-in variant:', e.message);
        return null;
      }
    }
  };
})();
