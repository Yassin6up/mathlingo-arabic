/* ============================================================
   ماث لينجو — التطبيق الرئيسي
   ============================================================ */
(() => {
  'use strict';

  /* ---------------- helpers ---------------- */
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------------- persistent state ---------------- */
  const state = loadJSON('mathlingo-state', { xp: 0, streak: 0, lastDay: '', completed: [] });
  const prefs = loadJSON('mathlingo-settings', { sfx: true, tts: true });
  Sound.setEnabled(prefs.sfx !== false);

  function loadJSON(k, fallback) {
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(k) || '{}')); }
    catch { return Object.assign({}, fallback); }
  }
  function saveState() { localStorage.setItem('mathlingo-state', JSON.stringify(state)); }
  function savePrefs() { localStorage.setItem('mathlingo-settings', JSON.stringify(prefs)); }

  /* ---------------- session state ---------------- */
  let lesson = null;
  let variantIdx = 0;
  let shownExplanations = [];
  let quizIdx = 0;
  let quizSelected = -1;
  let hearts = 3;
  let sessionXP = 0;
  let sessionCorrect = 0;
  let answered = false;
  let typeToken = 0;
  let confettiRAF = 0;

  /* ---------------- mascot (orange owl) ---------------- */
  function mascotSVG() {
    return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <!-- feet -->
      <ellipse cx="80" cy="188" rx="14" ry="7" fill="#b36b00"/>
      <ellipse cx="120" cy="188" rx="14" ry="7" fill="#b36b00"/>
      <!-- body -->
      <ellipse cx="100" cy="115" rx="72" ry="74" fill="#ff9600"/>
      <ellipse cx="100" cy="132" rx="46" ry="48" fill="#ffb84d"/>
      <!-- wings -->
      <ellipse cx="24" cy="120" rx="16" ry="34" fill="#e07d00" transform="rotate(14 24 120)"/>
      <ellipse cx="176" cy="120" rx="16" ry="34" fill="#e07d00" transform="rotate(-14 176 120)"/>
      <!-- eye patches -->
      <ellipse cx="72" cy="86" rx="27" ry="30" fill="#ffffff"/>
      <ellipse cx="128" cy="86" rx="27" ry="30" fill="#ffffff"/>
      <!-- pupils -->
      <circle cx="78" cy="90" r="11" fill="#4b4b4b"/>
      <circle cx="122" cy="90" r="11" fill="#4b4b4b"/>
      <circle cx="81" cy="86" r="4" fill="#ffffff"/>
      <circle cx="125" cy="86" r="4" fill="#ffffff"/>
      <!-- eyelids (blink) -->
      <ellipse class="eye-lid" cx="72" cy="86" rx="28" ry="31" fill="#ff9600"/>
      <ellipse class="eye-lid" cx="128" cy="86" rx="28" ry="31" fill="#ff9600"/>
      <!-- beak closed -->
      <path class="mouth-closed" d="M88 106 L112 106 L100 124 Z" fill="#ffc800"/>
      <!-- beak open (talking) -->
      <g class="mouth-open">
        <path d="M86 104 L114 104 L100 116 Z" fill="#ffc800"/>
        <path d="M90 118 Q100 132 110 118 Q100 124 90 118 Z" fill="#e6a800"/>
      </g>
      <!-- graduation cap -->
      <polygon points="100,18 152,38 100,58 48,38" fill="#4b4b4b"/>
      <rect x="86" y="46" width="28" height="12" rx="3" fill="#4b4b4b"/>
      <line x1="140" y1="42" x2="140" y2="66" stroke="#1cb0f6" stroke-width="3"/>
      <circle cx="140" cy="69" r="5" fill="#1cb0f6"/>
    </svg>`;
  }

  /* ---------------- charts (curve + tangent line) ---------------- */
  /* draws y = 0.8x² + 2 with a tangent at spec.tangentAt (like figures 3.13a-c) */
  function chartSVG(spec) {
    const f = (x) => 0.8 * x * x + 2;
    const df = (x) => 1.6 * x;
    const X = (x) => 140 + x * 28;
    const Y = (y) => 190 - y * 11;

    let curve = '';
    for (let x = -4.2; x <= 4.201; x += 0.2) {
      curve += `${curve ? 'L' : 'M'}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`;
    }

    let tangent = '', dot = '', slopeLabel = '';
    if (typeof spec.tangentAt === 'number') {
      const x0 = spec.tangentAt, y0 = f(x0), m = df(x0);
      const t1 = x0 - 1.9, t2 = x0 + 1.9;
      tangent = `<line x1="${X(t1)}" y1="${Y(y0 + m * (t1 - x0))}" x2="${X(t2)}" y2="${Y(y0 + m * (t2 - x0))}"
                 stroke="#ff4b8b" stroke-width="2.5" stroke-linecap="round"/>`;
      dot = `<circle cx="${X(x0)}" cy="${Y(y0)}" r="4.5" fill="#ff9600" stroke="#fff" stroke-width="1.5"/>`;
      const sign = m < 0 ? 'm < 0' : m > 0 ? 'm > 0' : 'm = 0';
      slopeLabel = `<text x="16" y="24" font-size="14" font-weight="bold" fill="#ff4b8b" font-family="Nunito,sans-serif">${sign}</text>`;
    }

    const xticks = [-4, -2, 2, 4].map(v =>
      `<line x1="${X(v)}" y1="187" x2="${X(v)}" y2="193" stroke="#999" stroke-width="1.5"/>
       <text x="${X(v)}" y="205" font-size="11" fill="#999" text-anchor="middle" font-family="Nunito,sans-serif">${v}</text>`).join('');
    const yticks = [5, 10, 15].map(v =>
      `<line x1="137" y1="${Y(v)}" x2="143" y2="${Y(v)}" stroke="#999" stroke-width="1.5"/>
       <text x="130" y="${Y(v) + 4}" font-size="11" fill="#999" text-anchor="end" font-family="Nunito,sans-serif">${v}</text>`).join('');

    return `
    <svg viewBox="0 0 280 214" xmlns="http://www.w3.org/2000/svg">
      <line x1="8" y1="190" x2="268" y2="190" stroke="#777" stroke-width="1.5"/>
      <polygon points="268,190 260,186 260,194" fill="#777"/>
      <text x="274" y="194" font-size="12" fill="#777" font-style="italic" font-family="serif">x</text>
      <line x1="140" y1="206" x2="140" y2="12" stroke="#777" stroke-width="1.5"/>
      <polygon points="140,12 136,20 144,20" fill="#777"/>
      <text x="147" y="16" font-size="12" fill="#777" font-style="italic" font-family="serif">y</text>
      ${xticks}${yticks}
      <path d="${curve}" fill="none" stroke="#1cb0f6" stroke-width="3" stroke-linecap="round"/>
      ${tangent}${dot}${slopeLabel}
    </svg>`;
  }

  function renderChart(el, spec) {
    if (spec) { el.innerHTML = chartSVG(spec); el.style.display = 'flex'; }
    else { el.innerHTML = ''; el.style.display = 'none'; }
  }

  /* ---------------- screens ---------------- */
  const screens = ['screen-home', 'screen-path', 'screen-lesson', 'screen-quiz', 'screen-congrats'];
  function show(id) {
    screens.forEach(s => $(s).classList.toggle('active', s === id));
    if (id !== 'screen-congrats') stopConfetti();
  }

  /* ---------------- path ---------------- */
  function renderPath() {
    $('stat-xp').textContent = state.xp;
    $('stat-streak').textContent = state.streak;
    const wrap = $('path-nodes');
    wrap.innerHTML = '';
    let activeGiven = false;
    LESSONS.forEach((l) => {
      const done = state.completed.includes(l.id);
      const isActive = !done && !activeGiven;
      if (isActive) activeGiven = true;
      const locked = !done && !isActive;

      const node = document.createElement('div');
      node.className = 'path-node';
      const btn = document.createElement('button');
      btn.className = 'node-btn' + (done ? ' done' : '') + (locked ? ' locked' : '');
      btn.textContent = done ? '👑' : l.icon;
      if (isActive) {
        const tip = document.createElement('div');
        tip.className = 'node-start-tip';
        tip.textContent = 'ابدأ';
        node.appendChild(tip);
      }
      if (!locked) {
        btn.addEventListener('click', () => { Sound.click(); startLesson(l); });
      }
      const label = document.createElement('div');
      label.className = 'node-label';
      label.textContent = l.title;
      node.appendChild(btn);
      node.appendChild(label);
      wrap.appendChild(node);
    });
    const trophy = document.createElement('div');
    trophy.className = 'path-node';
    const allDone = state.completed.length >= LESSONS.length;
    trophy.innerHTML = `<button class="node-btn ${allDone ? 'done' : 'locked'}">🏆</button>
                        <div class="node-label">${allDone ? 'أنت البطل!' : 'أكمل كل الدروس'}</div>`;
    wrap.appendChild(trophy);
  }

  /* ---------------- lesson (explanation) ---------------- */
  function startLesson(l) {
    lesson = l;
    variantIdx = 0;
    shownExplanations = [];
    Sound.swoosh();
    show('screen-lesson');
    $('lesson-title').textContent = l.title;
    playExplanation(l.explanations[0]);
  }

  async function playExplanation(exp) {
    shownExplanations.push(exp);
    const token = ++typeToken;
    Speech.stop();

    $('board-title').textContent = 'مثال — ' + lesson.title;
    renderChart($('board-chart'), exp.chart);
    const stepsWrap = $('board-steps');
    stepsWrap.innerHTML = '';
    exp.steps.forEach(s => {
      const div = document.createElement('div');
      div.className = 'note-step';
      div.innerHTML = s;
      stepsWrap.appendChild(div);
    });

    Speech.speak(exp.speech);
    typeBubble(exp.bubble, token);

    const stepEls = [...stepsWrap.children];
    for (let i = 0; i < stepEls.length; i++) {
      await sleep(i === 0 ? 600 : 950);
      if (token !== typeToken) return;
      stepEls[i].classList.add('show');
      Sound.tick();
    }
  }

  async function typeBubble(text, token) {
    const el = $('bubble-text');
    el.innerHTML = '';
    const caret = document.createElement('span');
    caret.className = 'bubble-caret';
    caret.innerHTML = '&nbsp;';
    el.parentNode.appendChild(caret);
    for (let i = 0; i < text.length; i++) {
      if (token !== typeToken) { caret.remove(); return; }
      el.textContent += text[i];
      await sleep(24);
    }
    caret.remove();
  }

  async function didNotUnderstand() {
    Sound.click();
    Speech.stop();
    typeToken++;
    const btnNo = $('btn-not-understand');
    const btnYes = $('btn-understand');

    if (AI.hasKey()) {
      btnNo.disabled = true; btnYes.disabled = true;
      $('bubble-text').innerHTML = 'دعني أفكر في طريقة أفضل للشرح<span class="thinking-dots"></span>';
      $('board-steps').innerHTML = '';
      const alt = await AI.reExplain(lesson, shownExplanations);
      btnNo.disabled = false; btnYes.disabled = false;
      if (alt) { playExplanation(alt); return; }
    }
    variantIdx = (variantIdx + 1) % lesson.explanations.length;
    playExplanation(lesson.explanations[variantIdx]);
  }

  /* ---------------- quiz ---------------- */
  function startQuiz() {
    Speech.stop();
    typeToken++;
    quizIdx = 0;
    hearts = 3;
    sessionXP = 0;
    sessionCorrect = 0;
    Sound.swoosh();
    show('screen-quiz');
    renderQuestion();
  }

  function currentQ() { return lesson.quiz[quizIdx]; }

  function renderQuestion() {
    answered = false;
    quizSelected = -1;
    const q = currentQ();

    $('quiz-progress').style.width = (quizIdx / lesson.quiz.length * 100) + '%';
    $('hearts-count').textContent = hearts;
    $('feedback').classList.remove('show', 'good', 'bad');
    $('quiz-footer').style.display = 'flex';
    $('btn-check').disabled = true;

    $('quiz-prompt').textContent = q.q;
    $('quiz-math').textContent = q.math || '';
    renderChart($('quiz-chart'), q.chart);

    const choices = $('choices');
    const writeWrap = $('write-wrap');
    const fab = $('kbd-fab');
    closeKeyboard();

    if (q.type === 'choice') {
      writeWrap.style.display = 'none';
      fab.style.display = 'none';
      choices.style.display = 'flex';
      choices.innerHTML = '';
      q.options.forEach((opt, i) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.innerHTML = `<span class="choice-key">${i + 1}</span><span dir="auto">${opt}</span>`;
        b.addEventListener('click', () => selectChoice(i));
        choices.appendChild(b);
      });
    } else {
      choices.style.display = 'none';
      choices.innerHTML = '';
      writeWrap.style.display = 'block';
      fab.style.display = 'flex';
      const input = $('write-input');
      input.value = '';
      input.readOnly = false;
    }

    Speech.speak(q.q + '. ' + (q.math || ''));
  }

  function selectChoice(i) {
    if (answered) return;
    Sound.click();
    quizSelected = i;
    [...$('choices').children].forEach((el, j) => el.classList.toggle('selected', j === i));
    $('btn-check').disabled = false;
  }

  /* normalize an answer: Arabic digits, superscripts, symbols, spaces */
  const AR_DIGITS = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
                      '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
  const SUP = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-','ⁿ':'n' };
  function normalize(s) {
    return s
      .replace(/[٠-٩۰-۹]/g, d => AR_DIGITS[d] || d)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻ⁿ]+/g, run => '^' + [...run].map(c => SUP[c] || c).join(''))
      .toLowerCase()
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
      .replace(/[‎‏]/g, '')
      .replace(/\s+/g, '')
      .replace(/,/g, '.');
  }

  function checkWrite(q) {
    const lines = $('write-input').value.split('\n').map(normalize).filter(Boolean);
    return lines.some(line => q.accept.some(a => line === normalize(a)));
  }

  function check() {
    if (answered) return;
    const q = currentQ();
    let ok;
    if (q.type === 'choice') {
      if (quizSelected < 0) return;
      ok = quizSelected === q.correct;
      const els = [...$('choices').children];
      els.forEach((el, j) => {
        el.disabled = true;
        if (j === q.correct) el.classList.add('correct');
        else if (j === quizSelected && !ok) el.classList.add('wrong');
        else el.classList.add('dim');
        el.classList.remove('selected');
      });
    } else {
      if (!$('write-input').value.trim()) return;
      ok = checkWrite(q);
      closeKeyboard();
    }
    answered = true;
    showFeedback(ok, q, false);
  }

  function skip() {
    if (answered) return;
    Sound.click();
    answered = true;
    const q = currentQ();
    if (q.type === 'choice') {
      [...$('choices').children].forEach((el, j) => {
        el.disabled = true;
        if (j === q.correct) el.classList.add('correct'); else el.classList.add('dim');
      });
    } else {
      closeKeyboard();
    }
    showFeedback(false, q, true);
  }

  function showFeedback(ok, q, skipped) {
    const fb = $('feedback');
    const correctText = q.type === 'choice' ? q.options[q.correct] : q.answer;
    $('quiz-footer').style.display = 'none';

    if (ok) {
      Sound.correct();
      sessionXP += 10;
      sessionCorrect++;
      const praise = ['أحسنت!', 'رائع!', 'ممتاز!', 'عمل مذهل!', 'مثالي!'][Math.floor(Math.random() * 5)];
      $('feedback-icon').textContent = '✓';
      $('feedback-title').textContent = praise + ' +10 نقاط';
      $('feedback-detail').textContent = '';
      fb.classList.add('good');
      fb.classList.remove('bad');
    } else {
      Sound.wrong();
      if (!skipped) hearts = Math.max(0, hearts - 1);
      $('hearts-count').textContent = hearts;
      $('feedback-icon').textContent = '✕';
      $('feedback-title').textContent = 'الإجابة الصحيحة: ' + correctText;
      $('feedback-detail').textContent = q.why;
      fb.classList.add('bad');
      fb.classList.remove('good');
      Speech.speak('الإجابة الصحيحة هي: ' + correctText + '. ' + q.why);
    }
    $('btn-continue').textContent = ok ? 'استمر' : 'فهمت';
    fb.classList.add('show');
    $('quiz-progress').style.width = ((quizIdx + (ok ? 1 : 0.4)) / lesson.quiz.length * 100) + '%';
  }

  function continueQuiz() {
    Sound.click();
    Speech.stop();
    quizIdx++;
    if (quizIdx >= lesson.quiz.length) finishLesson();
    else renderQuestion();
  }

  /* ---------------- math keyboard (advanced) ---------------- */
  /* each key: [label, insert] — label shown, insert typed */
  const KBD_ROWS = [
    [['d/dx', 'd/dx '], ['lim', 'lim '], ['→', '→'], ['∞', '∞'], ['f(x)', 'f(x)'], ["f'(x)", "f'(x)"]],
    [['x', 'x'], ['h', 'h'], ['n', 'n'], ['x²', 'x²'], ['x³', 'x³'], ['√', '√']],
    [['7', '7'], ['8', '8'], ['9', '9'], ['÷', '÷'], ['(', '('], [')', ')']],
    [['4', '4'], ['5', '5'], ['6', '6'], ['×', '×'], ['^', '^'], ['π', 'π']],
    [['1', '1'], ['2', '2'], ['3', '3'], ['−', '−'], ['=', '='], ['↵', '\n']],
    [['ABC', null], ['0', '0'], ['.', '.'], ['/', '/'], ['+', '+'], ['⌫', null]],
  ];
  const FN_KEYS = ['d/dx', 'lim', 'f(x)', "f'(x)", 'x²', 'x³'];
  const OP_KEYS = ['÷', '×', '−', '+', '=', '^', '/', '(', ')', '√', 'π', '→', '∞'];

  function buildKeyboard() {
    const wrap = $('kbd-rows');
    KBD_ROWS.forEach(row => {
      const r = document.createElement('div');
      r.className = 'kbd-row';
      row.forEach(([label, insert]) => {
        const b = document.createElement('button');
        b.className = 'kbd-key';
        if (FN_KEYS.includes(label)) b.classList.add('fn');
        if (OP_KEYS.includes(label)) b.classList.add('op');
        if (label === '⌫' || label === 'ABC') b.classList.add('act');
        b.textContent = label;
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); pressKey(label, insert); });
        r.appendChild(b);
      });
      wrap.appendChild(r);
    });
  }

  function pressKey(label, insert) {
    Sound.key();
    const input = $('write-input');
    if (label === 'ABC') { // switch back to the device keyboard
      input.readOnly = false;
      closeKeyboard();
      input.focus();
      return;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    if (label === '⌫') {
      if (start === end && start > 0) {
        input.value = input.value.slice(0, start - 1) + input.value.slice(end);
        setCaret(input, start - 1);
      } else {
        input.value = input.value.slice(0, start) + input.value.slice(end);
        setCaret(input, start);
      }
    } else {
      input.value = input.value.slice(0, start) + insert + input.value.slice(end);
      setCaret(input, start + insert.length);
    }
    $('btn-check').disabled = !input.value.trim();
  }

  function setCaret(input, pos) {
    input.focus();
    input.setSelectionRange(pos, pos);
  }

  function openKeyboard() {
    const input = $('write-input');
    input.readOnly = true; // keep the device keyboard away on mobile
    $('math-keyboard').classList.add('open');
    $('kbd-fab').classList.add('on');
    input.focus();
  }
  function closeKeyboard() {
    $('math-keyboard').classList.remove('open');
    $('kbd-fab').classList.remove('on');
    $('write-input').readOnly = false;
  }
  function toggleKeyboard() {
    Sound.click();
    if ($('math-keyboard').classList.contains('open')) closeKeyboard();
    else openKeyboard();
  }

  /* ---------------- congrats ---------------- */
  function finishLesson() {
    const today = new Date().toDateString();
    if (state.lastDay !== today) {
      const yesterday = new Date(Date.now() - 864e5).toDateString();
      state.streak = (state.lastDay === yesterday) ? state.streak + 1 : 1;
      state.lastDay = today;
    }
    state.xp += sessionXP;
    if (!state.completed.includes(lesson.id)) state.completed.push(lesson.id);
    saveState();

    show('screen-congrats');
    Sound.fanfare();
    const acc = Math.round(sessionCorrect / lesson.quiz.length * 100);
    $('congrats-sub').textContent = acc === 100 ? 'مثالي! أنت نجم الرياضيات! 🌟'
      : acc >= 60 ? 'أداء رائع! استمر! 🎉' : 'أكملت الدرس — التدريب يصنع الإتقان! 💪';
    $('result-acc').textContent = acc + '%';
    countUp($('result-xp'), sessionXP);
    startConfetti();
    Speech.speak(acc === 100 ? 'مبروك! أكملت الدرس بعلامة كاملة! أنت نجم الرياضيات!'
      : 'مبروك! أكملت الدرس! أحسنت صنعًا!');
  }

  async function countUp(el, target) {
    el.textContent = '0';
    if (target <= 0) return;
    const steps = Math.min(target, 30);
    for (let i = 1; i <= steps; i++) {
      await sleep(700 / steps);
      el.textContent = Math.round(target * i / steps);
      Sound.tick();
    }
  }

  function startConfetti() {
    const canvas = $('confetti-canvas');
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const colors = ['#ff9600', '#1cb0f6', '#ffc800', '#ff4b4b', '#ce82ff', '#58cc02'];
    const parts = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height,
      w: 7 + Math.random() * 7,
      h: 4 + Math.random() * 5,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3.2,
      vx: -1.2 + Math.random() * 2.4,
      rot: Math.random() * Math.PI,
      vr: -0.12 + Math.random() * 0.24,
    }));
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach(p => {
        p.y += p.vy; p.x += p.vx + Math.sin(p.y / 30); p.rot += p.vr;
        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      confettiRAF = requestAnimationFrame(frame);
    }
    stopConfetti();
    frame();
  }
  function stopConfetti() {
    if (confettiRAF) { cancelAnimationFrame(confettiRAF); confettiRAF = 0; }
  }

  /* ---------------- settings ---------------- */
  function openSettings() {
    Sound.click();
    $('set-claude-key').value = prefs.claudeKey || '';
    $('set-eleven-key').value = prefs.elevenKey || '';
    $('set-eleven-voice').value = prefs.elevenVoice || '';
    $('set-eleven-speed').value = prefs.elevenSpeed || 1.2;
    $('set-eleven-speed-val').textContent = (prefs.elevenSpeed || 1.2).toFixed(2);
    $('set-sfx').checked = prefs.sfx !== false;
    $('set-tts').checked = prefs.tts !== false;
    $('settings-modal').classList.add('open');
  }
  function saveSettings() {
    prefs.claudeKey = $('set-claude-key').value.trim();
    prefs.elevenKey = $('set-eleven-key').value.trim();
    prefs.elevenVoice = $('set-eleven-voice').value.trim();
    prefs.elevenSpeed = parseFloat($('set-eleven-speed').value) || 1.2;
    prefs.sfx = $('set-sfx').checked;
    prefs.tts = $('set-tts').checked;
    savePrefs();
    Sound.setEnabled(prefs.sfx);
    Sound.correct();
    $('settings-modal').classList.remove('open');
  }

  /* ---------------- wire up ---------------- */
  function init() {
    ['mascot-home', 'mascot-path', 'mascot-lesson', 'mascot-congrats'].forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = mascotSVG();
    });
    Speech.bindMouths([$('mascot-lesson'), $('mascot-home'), $('mascot-congrats')]);

    // prime the browser voice engine on the very first tap anywhere,
    // so the first real lesson doesn't stall waiting for it to wake up
    document.addEventListener('pointerdown', () => Speech.warmUp(), { once: true });

    buildKeyboard();

    $('btn-start').addEventListener('click', () => { Sound.click(); Sound.swoosh(); renderPath(); show('screen-path'); });
    $('btn-settings-home').addEventListener('click', openSettings);
    $('btn-settings-path').addEventListener('click', openSettings);
    $('btn-settings-cancel').addEventListener('click', () => { Sound.click(); $('settings-modal').classList.remove('open'); });
    $('btn-settings-save').addEventListener('click', saveSettings);
    $('set-eleven-speed').addEventListener('input', () => {
      $('set-eleven-speed-val').textContent = parseFloat($('set-eleven-speed').value).toFixed(2);
    });

    $('btn-close-lesson').addEventListener('click', () => { Sound.click(); Speech.stop(); typeToken++; renderPath(); show('screen-path'); });
    $('btn-replay').addEventListener('click', () => {
      Sound.click();
      const exp = shownExplanations[shownExplanations.length - 1];
      if (exp) Speech.speak(exp.speech);
    });
    $('btn-understand').addEventListener('click', () => { Sound.click(); startQuiz(); });
    $('btn-not-understand').addEventListener('click', didNotUnderstand);

    $('btn-close-quiz').addEventListener('click', () => { Sound.click(); Speech.stop(); renderPath(); show('screen-path'); });
    $('btn-check').addEventListener('click', check);
    $('btn-skip').addEventListener('click', skip);
    $('btn-continue').addEventListener('click', continueQuiz);
    $('kbd-fab').addEventListener('click', toggleKeyboard);
    $('write-input').addEventListener('input', () => {
      $('btn-check').disabled = !$('write-input').value.trim();
    });

    $('btn-start-over').addEventListener('click', () => { Sound.click(); startLesson(lesson); });
    $('btn-back-path').addEventListener('click', () => { Sound.click(); renderPath(); show('screen-path'); });

    // number keys 1-4 select choices, Enter checks / continues
    document.addEventListener('keydown', (e) => {
      if (!$('screen-quiz').classList.contains('active')) return;
      if (document.activeElement === $('write-input')) {
        if (e.key === 'Enter' && e.ctrlKey) check();
        return;
      }
      const q = lesson ? currentQ() : null;
      if (q && q.type === 'choice' && !answered && /^[1-4]$/.test(e.key)) {
        const i = +e.key - 1;
        if (i < q.options.length) selectChoice(i);
      }
      if (e.key === 'Enter') {
        if ($('feedback').classList.contains('show')) continueQuiz();
        else if (!$('btn-check').disabled) check();
      }
    });
  }

  init();
})();
