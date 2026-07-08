/* ============================================================
   MathLingo — sound effects (WebAudio, no asset files)
   Duolingo-style: bright ding on correct, dull thud on wrong,
   pops on taps, fanfare on lesson complete.
   ============================================================ */
const Sound = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, { type = 'sine', start = 0, dur = 0.15, vol = 0.2, slideTo = null } = {}) {
    const a = ac();
    const t0 = a.currentTime + start;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    setEnabled(v) { enabled = v; },

    /* soft pop for taps / selections */
    click() {
      if (!enabled) return;
      tone(660, { type: 'sine', dur: 0.07, vol: 0.12 });
    },

    /* key press on math keyboard */
    key() {
      if (!enabled) return;
      tone(880, { type: 'triangle', dur: 0.05, vol: 0.08 });
    },

    /* bright two-note "ding!" — correct answer */
    correct() {
      if (!enabled) return;
      tone(659.25, { type: 'sine', dur: 0.14, vol: 0.22 });            // E5
      tone(1318.5, { type: 'sine', start: 0.02, dur: 0.16, vol: 0.10 });
      tone(880.0,  { type: 'sine', start: 0.11, dur: 0.28, vol: 0.22 }); // A5
      tone(1760.0, { type: 'sine', start: 0.13, dur: 0.30, vol: 0.08 });
    },

    /* low dull "thud" — wrong answer */
    wrong() {
      if (!enabled) return;
      tone(196, { type: 'square', dur: 0.18, vol: 0.10, slideTo: 130 });
      tone(98,  { type: 'sine',   dur: 0.30, vol: 0.22, slideTo: 65 });
    },

    /* whoosh for screen transitions */
    swoosh() {
      if (!enabled) return;
      tone(300, { type: 'sine', dur: 0.18, vol: 0.07, slideTo: 900 });
    },

    /* victory fanfare — lesson complete */
    fanfare() {
      if (!enabled) return;
      const notes = [
        [523.25, 0.00], // C5
        [659.25, 0.12], // E5
        [783.99, 0.24], // G5
        [1046.5, 0.36], // C6
      ];
      notes.forEach(([f, s]) => {
        tone(f, { type: 'triangle', start: s, dur: 0.22, vol: 0.20 });
        tone(f * 2, { type: 'sine', start: s, dur: 0.22, vol: 0.06 });
      });
      // final chord
      [523.25, 659.25, 783.99, 1046.5].forEach(f =>
        tone(f, { type: 'triangle', start: 0.52, dur: 0.7, vol: 0.10 }));
    },

    /* small sparkle when XP counts up */
    tick() {
      if (!enabled) return;
      tone(1200 + Math.random() * 500, { type: 'sine', dur: 0.05, vol: 0.05 });
    },
  };
})();
