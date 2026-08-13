/* ============================================================
   منارة (Manara) — text-to-speech
   The ElevenLabs key and voice id live on the Rased server: every
   request goes through the shared /api/manara/public/tts proxy, so
   no visitor ever needs (or can paste) a key. If the proxy is
   unreachable we fall back to the browser's built-in voice.
   Animates the mascot's mouth while speaking.

   Latency notes:
   - ElevenLabs: uses the /stream endpoint + MediaSource so audio
     starts playing after the first chunk arrives instead of
     waiting for the whole file, plus the low-latency "flash"
     model and optimize_streaming_latency=4.
   - Browser voice: the engine is "warmed up" on first user
     interaction (silent utterance) because Chrome/Edge have a
     known ~1s delay on the very first speak() call per page load.
   ============================================================ */
const Speech = (() => {
  let currentAudio = null;
  let talkingEls = [];
  let warmed = false;

  function settings() {
    try { return JSON.parse(localStorage.getItem('manara-settings') || '{}'); }
    catch { return {}; }
  }

  function startTalking() { talkingEls.forEach(el => el && el.classList.add('talking')); }
  function stopTalking()  { talkingEls.forEach(el => el && el.classList.remove('talking')); }

  /* make math text friendly for the voice (Arabic) */
  function speakable(text) {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/×/g, ' في ')
      .replace(/÷/g, ' على ')
      .replace(/−/g, ' ناقص ')
      .replace(/\+/g, ' زائد ')
      .replace(/=/g, ' يساوي ')
      .replace(/≥/g, ' أكبر من أو يساوي ')
      .replace(/≤/g, ' أصغر من أو يساوي ')
      .replace(/>/g, ' أكبر من ')
      .replace(/</g, ' أصغر من ')
      .replace(/√/g, ' جذر ')
      .replace(/π/g, ' باي ')
      .replace(/∞/g, ' ما لا نهاية ')
      .replace(/→/g, ' تؤول إلى ')
      .replace(/f'\(x\)/g, ' مشتقة الدالة ')
      .replace(/f\(x\)/g, ' الدالة ')
      .replace(/d\/dx/g, ' مشتقة ')
      .replace(/x²/g, ' إكس تربيع ')
      .replace(/x³/g, ' إكس تكعيب ')
      .replace(/x⁴/g, ' إكس أس أربعة ')
      .replace(/x⁵/g, ' إكس أس خمسة ')
      .replace(/xⁿ/g, ' إكس أس نون ')
      .replace(/(\d)\/(\d)/g, '$1 على $2')
      .replace(/\bx\b/g, ' إكس ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------------- ElevenLabs (streamed) ---------------- */
  /* Calls the given URL, streams the mp3 response back via MediaSource
     so playback starts on the first chunk instead of the full file. */
  async function speakFromResponse(res) {
    if (!res.ok || !res.body) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.error || ('TTS error ' + res.status));
    }
    if (window.MediaSource && MediaSource.isTypeSupported('audio/mpeg')) {
      return playStreamed(res.body);
    }
    // Fallback for browsers without MSE/mp3 support: buffer the whole thing.
    const blob = await res.blob();
    return playBlob(blob);
  }

  /* Via the shared Manara backend proxy — the key and voice id both live in
     the Rased server's environment. Silently unavailable (caught by the
     caller) until MANARA_CONFIG.API_BASE is configured, or on any failure. */
  function speakElevenProxy(text, speed) {
    if (!MANARA_CONFIG.API_BASE) return Promise.reject(new Error('proxy not configured'));
    return fetch(MANARA_CONFIG.API_BASE + '/api/manara/public/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Id': MANARA_CONFIG.APP_SLUG },
      body: JSON.stringify({ text, speed })
    }).then(speakFromResponse);
  }

  function playStreamed(bodyStream) {
    return new Promise((resolve) => {
      const mediaSource = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(mediaSource);
      currentAudio = audio;
      audio.onplay = startTalking;
      const finish = () => { stopTalking(); URL.revokeObjectURL(audio.src); resolve(); };
      audio.onended = finish;
      audio.onerror = finish;

      mediaSource.addEventListener('sourceopen', () => {
        let sourceBuffer;
        try { sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg'); }
        catch { finish(); return; }

        const reader = bodyStream.getReader();
        let started = false;

        function appendNext({ done, value }) {
          if (done) {
            if (mediaSource.readyState === 'open') { try { mediaSource.endOfStream(); } catch {} }
            return;
          }
          const onUpdateEnd = () => {
            sourceBuffer.removeEventListener('updateend', onUpdateEnd);
            if (!started) { started = true; audio.play().catch(finish); }
            reader.read().then(appendNext).catch(finish);
          };
          sourceBuffer.addEventListener('updateend', onUpdateEnd);
          try { sourceBuffer.appendBuffer(value); } catch { finish(); }
        }
        reader.read().then(appendNext).catch(finish);
      }, { once: true });
    });
  }

  function playBlob(blob) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onplay = startTalking;
      audio.onended = () => { stopTalking(); URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { stopTalking(); URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => { stopTalking(); resolve(); });
    });
  }

  /* ---------------- Browser voice (warmed up) ---------------- */
  function pickArabicVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => /^ar/i.test(v.lang) && /natural|neural|online/i.test(v.name))
        || voices.find(v => /^ar/i.test(v.lang))
        || null;
  }

  /* Chrome/Edge stall ~1s on the very first speak() call per page load.
     Fire a silent warm-up utterance once, on first user interaction. */
  function warmUpBrowserVoice() {
    if (warmed || !('speechSynthesis' in window)) return;
    warmed = true;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }

  function speakBrowser(text) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) return resolve();
      const synth = window.speechSynthesis;
      const wasBusy = synth.speaking || synth.pending;
      synth.cancel();

      const u = new SpeechSynthesisUtterance(speakable(text));
      // Arabic system voices are naturally slow-paced; push the rate up
      // noticeably so it feels snappy like Duolingo instead of a lecture.
      u.rate = 1.3;
      u.pitch = 1.1;
      u.lang = 'ar-SA';
      const voice = pickArabicVoice();
      if (voice) u.voice = voice;
      u.onstart = startTalking;
      u.onend = () => { stopTalking(); resolve(); };
      u.onerror = () => { stopTalking(); resolve(); };

      // cancel() immediately followed by speak() can silently drop the
      // utterance in Chrome; a tiny delay avoids the race.
      const doSpeak = () => synth.speak(u);
      wasBusy ? setTimeout(doSpeak, 60) : doSpeak();
    });
  }

  return {
    /* register mascot elements whose mouths should animate */
    bindMouths(els) { talkingEls = els.filter(Boolean); },

    /* call once on first user tap/click to prime the browser voice engine */
    warmUp() { warmUpBrowserVoice(); },

    stop() {
      if (currentAudio) { currentAudio.pause(); currentAudio = null; }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      stopTalking();
    },

    async speak(text) {
      const s = settings();
      if (s.tts === false) return;
      this.stop();

      // 1) the shared server voice — works with zero setup for any visitor
      try { return await speakElevenProxy(text, s.elevenSpeed); }
      catch (e) { console.warn('Shared voice proxy unavailable, using browser voice:', e.message); }
      // 2) last resort: the browser's own voice
      return speakBrowser(text);
    }
  };
})();
