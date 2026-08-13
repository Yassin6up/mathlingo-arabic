/* ============================================================
   منارة (Manara) — التطبيق الرئيسي
   ============================================================ */
(() => {
  'use strict';

  /* ---------------- helpers ---------------- */
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ---------------- persistent state ---------------- */
  const state = loadJSON('manara-state', {
    xp: 0, streak: 0, lastDay: '',
    completed: { math: [], english: [] },
    attempts: [], // per-lesson attempt log, synced to the account on login
    premium: false,
    onboardingDone: false,
    onboarding: null, // { gradeLevel, country, age, pace, goal, dailyTime, startSubject }
    level: 0, // school grade 0 (KG) … 12, chosen during onboarding
    levelScheme: '', // set once migrated to the 0-12 grade scale
    avatar: '', // illustrated profile picture key, see js/avatars.js
  });
  const prefs = loadJSON('manara-settings', { sfx: true, tts: true });
  Sound.setEnabled(prefs.sfx !== false);

  const MAX_LEVEL = 12; // school grades 0 (KG) … 12 (final secondary year)

  // migrations for users who onboarded under an older level scheme
  // 1) the original 3 text options
  const TEXT_GRADE_MAP = { elementary: 3, secondary: 9, university: 12 };
  // 2) the 6-band scheme (0-5) that replaced it, mapped onto real grades
  const BAND_GRADE_MAP = { 0: 0, 1: 2, 2: 5, 3: 8, 4: 11, 5: 12 };

  if (!state.levelScheme) {
    const g = state.onboarding?.gradeLevel;
    if (g in TEXT_GRADE_MAP) {
      state.level = TEXT_GRADE_MAP[g];
    } else if (state.onboardingDone || state.level) {
      state.level = BAND_GRADE_MAP[Number(state.level) || 0] ?? 0;
    }
    if (state.onboarding) state.onboarding.gradeLevel = String(state.level);
    state.levelScheme = 'grades-0-12';
    state.level = Math.min(MAX_LEVEL, Math.max(0, Number(state.level) || 0));
    saveState(); // persist now, otherwise the migration re-runs on every load
  }
  state.level = Math.min(MAX_LEVEL, Math.max(0, Number(state.level) || 0));

  function loadJSON(k, fallback) {
    try { return Object.assign({}, fallback, JSON.parse(localStorage.getItem(k) || '{}')); }
    catch { return Object.assign({}, fallback); }
  }
  function saveState() { localStorage.setItem('manara-state', JSON.stringify(state)); }
  function savePrefs() { localStorage.setItem('manara-settings', JSON.stringify(prefs)); }

  function lessonsFor(subject) { return subject === 'english' ? ENGLISH_LESSONS : MATH_LESSONS; }
  function levelsFor(subject) { return subject === 'english' ? ENGLISH_LEVELS : MATH_LEVELS; }
  /* units of one school level; no level given → the user's own level */
  function unitsFor(subject, level) {
    const lv = level == null ? state.level : level;
    const entry = levelsFor(subject).find(l => l.level === lv);
    return entry ? entry.units : [];
  }

  /* per-subject XP is derived from the local attempt log (kept forever,
     even after login — see syncGuestProgress) so level/units work the
     same for guests and logged-in users without extra API calls. */
  function subjectXP(subject) {
    return state.attempts.filter(a => a.subject === subject).reduce((sum, a) => sum + (a.xpEarned || 0), 0);
  }
  function levelFor(xp) { return Math.floor(xp / 100) + 1; }

  /* ---------------- session state ---------------- */
  let currentSubject = 'math';
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
  let googleInitialized = false;
  let googleRetries = 0;
  let questionStartedAt = 0; // for measuring how long each question takes

  /* ---------------- mascot: منير the dolphin ---------------- */
  function mascotSVG() {
    return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <!-- tail fin -->
      <path d="M8 118 Q -6 96 4 74 Q 20 92 30 108 Z" fill="#0e7ab0"/>
      <!-- body -->
      <path d="M28 110
               C 28 66, 66 34, 118 34
               C 158 34, 186 58, 190 92
               C 186 118, 156 138, 116 140
               C 78 142, 40 132, 28 110 Z" fill="#29b6e8"/>
      <!-- belly -->
      <path d="M46 116
               C 52 96, 82 82, 118 84
               C 148 86, 168 100, 172 112
               C 156 126, 122 132, 92 130
               C 68 128, 52 124, 46 116 Z" fill="#eaf9ff"/>
      <!-- dorsal fin -->
      <path d="M108 36 Q 118 6 138 24 Q 126 34 116 42 Z" fill="#1a90c2"/>
      <!-- side fin -->
      <ellipse cx="86" cy="122" rx="20" ry="10" fill="#1a90c2" transform="rotate(24 86 122)"/>
      <!-- snout / beak -->
      <path class="mouth-closed" d="M182 88 Q198 92 196 100 Q 180 104 168 100 Z" fill="#1a90c2"/>
      <g class="mouth-open">
        <path d="M182 84 Q200 88 197 98 Q 180 102 166 96 Z" fill="#1a90c2"/>
        <path d="M170 96 Q184 108 195 98" stroke="#0e6a94" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>
      <!-- eye patch -->
      <circle cx="140" cy="72" r="15" fill="#ffffff"/>
      <circle cx="144" cy="74" r="7" fill="#123"/>
      <circle cx="147" cy="71" r="2.4" fill="#fff"/>
      <ellipse class="eye-lid" cx="140" cy="72" rx="16" ry="16" fill="#29b6e8"/>
      <!-- graduation cap (tilted, resting on the head) -->
      <g transform="translate(96 22) rotate(-8)">
        <polygon points="40,0 80,16 40,32 0,16" fill="#4b4b4b"/>
        <rect x="26" y="20" width="28" height="10" rx="3" fill="#4b4b4b"/>
        <line x1="70" y1="18" x2="70" y2="40" stroke="#ff9600" stroke-width="3"/>
        <circle cx="70" cy="43" r="5" fill="#ff9600"/>
      </g>
      <!-- water droplets (idle sparkle) -->
      <circle cx="40" cy="58" r="3" fill="#bdeeff"/>
      <circle cx="58" cy="46" r="2" fill="#bdeeff"/>
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
  const screens = [
    'screen-home', 'screen-subjects', 'screen-path', 'screen-lesson', 'screen-quiz', 'screen-congrats',
    'screen-login', 'screen-signup', 'screen-forgot', 'screen-profile', 'screen-paywall',
    'screen-library', 'screen-book', 'screen-book-lesson', 'screen-dictionary',
    'screen-onboarding', 'screen-report'
  ];
  const NAV_VISIBLE_SCREENS = new Set(['screen-path', 'screen-library', 'screen-book', 'screen-book-lesson', 'screen-dictionary', 'screen-profile']);
  const NAV_KEY_FOR_SCREEN = {
    'screen-path': 'path',
    'screen-library': 'library', 'screen-book': 'library',
    'screen-book-lesson': 'library', 'screen-dictionary': 'library',
    'screen-profile': 'profile',
  };

  /* An account is required to use منارة. These four screens are the only
     ones a signed-out visitor can reach; show() redirects everything else
     to the login screen, so no navigation path (button, hash link, or
     back/forward) can slip past the gate. */
  const PUBLIC_SCREENS = new Set(['screen-home', 'screen-login', 'screen-signup', 'screen-forgot']);

  function show(id) {
    if (!PUBLIC_SCREENS.has(id) && !Auth.isLoggedIn()) {
      clearAuthErrors();
      id = 'screen-login';
      scheduleGoogleRender();
    }
    screens.forEach(s => $(s).classList.toggle('active', s === id));
    if (id !== 'screen-congrats') stopConfetti();
    updateAuthChrome(id);

    $('bottom-nav').classList.toggle('show', NAV_VISIBLE_SCREENS.has(id));
    const navKey = NAV_KEY_FOR_SCREEN[id] || null;
    document.querySelectorAll('[data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === navKey));
  }

  /* Adjust the chrome that only makes sense once you have an account:
     the sidebar, the home screen's guest copy, and the ✕ on the auth
     screens (there is nowhere to close *to* before signing in). */
  function updateAuthChrome(id) {
    const loggedIn = Auth.isLoggedIn();
    $('app-sidebar').classList.toggle('hidden', !loggedIn);
    $('btn-login-home').style.display = loggedIn ? 'none' : 'block';
    $('btn-library-home').style.display = loggedIn ? 'flex' : 'none';
    $('home-gate-note').style.display = loggedIn ? 'none' : 'block';
    $('btn-start').textContent = loggedIn ? 'ابدأ الآن' : 'ابدأ الآن — أنشئ حسابك';

    // on the auth screens, only offer ✕ when there's a session to return to
    ['btn-close-login', 'btn-close-signup'].forEach(b => {
      $(b).style.visibility = loggedIn ? 'visible' : 'hidden';
    });
    if (id === 'screen-login' || id === 'screen-signup') scheduleGoogleRender();
  }

  /* ---------------- subject selection ---------------- */
  const SUBJECT_META = [
    { id: 'math', icon: '📐', name: 'الرياضيات', enabled: true },
    { id: 'english', icon: '🔤', name: 'English', enabled: true },
    { id: 'science', icon: '🔬', name: 'العلوم', enabled: false },
    { id: 'arabic', icon: '📗', name: 'اللغة العربية', enabled: false },
    { id: 'coding', icon: '💻', name: 'البرمجة', enabled: false },
    { id: 'history', icon: '🏛️', name: 'التاريخ', enabled: false },
  ];

  function renderSubjectsScreen() {
    const grid = $('subjects-grid');
    grid.innerHTML = '';
    SUBJECT_META.forEach(s => {
      const card = document.createElement('div');
      card.className = 'subject-card' + (s.enabled ? ' ' + s.id : ' disabled');
      if (s.enabled) {
        const xp = subjectXP(s.id);
        card.innerHTML = `
          <div class="subject-icon">${s.icon}</div>
          <div class="subject-name">${s.name}</div>
          <div class="subject-level">المستوى ${levelFor(xp)}</div>`;
        card.addEventListener('click', () => {
          Sound.click();
          currentSubject = s.id;
          renderPath();
          show('screen-path');
        });
      } else {
        card.innerHTML = `
          <div class="subject-icon">${s.icon}</div>
          <div class="subject-name">${s.name}</div>
          <div class="soon-badge">قريبًا</div>`;
        card.addEventListener('click', () => Sound.click());
      }
      grid.appendChild(card);
    });
  }

  /* ---------------- path (school level → units → lessons) ---------------- */
  let browsingLevel = null; // level being viewed on the path; null = user's own level

  function currentPathLevel() { return browsingLevel == null ? state.level : browsingLevel; }

  /** every lesson of one school level, in order */
  function levelLessonIds(subject, level) {
    const entry = levelsFor(subject).find(l => l.level === level);
    return entry ? entry.units.flatMap(u => u.lessonIds) : [];
  }

  function isLevelComplete(subject, level) {
    const ids = levelLessonIds(subject, level);
    if (!ids.length) return false;
    const done = state.completed[subject] || [];
    return ids.every(id => done.includes(id));
  }

  /* The highest grade the learner may open. Grades below their own school
     level stay open for revision; grades above it unlock strictly one at a
     time, and only once the current one is fully finished — you can no
     longer jump straight from الصف الثاني to الثالث ثانوي. */
  function highestUnlockedLevel(subject) {
    let lv = state.level;
    while (lv < MAX_LEVEL && isLevelComplete(subject, lv)) lv++;
    return lv;
  }

  function isLevelUnlocked(subject, level) {
    return level <= highestUnlockedLevel(subject);
  }

  function renderLevelChips() {
    const wrap = $('level-chips');
    wrap.innerHTML = '';
    const highest = highestUnlockedLevel(currentSubject);

    levelsFor(currentSubject).forEach(lv => {
      const chip = document.createElement('button');
      const isMine = lv.level === state.level;
      const unlocked = lv.level <= highest;
      chip.className = 'level-chip'
        + (lv.level === currentPathLevel() ? ' active' : '')
        + (isMine ? ' mine' : '')
        + (unlocked ? '' : ' locked');
      chip.innerHTML = `${unlocked ? lv.icon : '🔒'} ${lv.title}${isMine ? ' ⭐' : ''}`;
      chip.title = unlocked
        ? `${lv.title} — ${lv.stage}`
        : `أكمل ${levelsFor(currentSubject).find(l => l.level === highest)?.title || 'مستواك الحالي'} أولًا لفتح هذا المستوى`;
      chip.addEventListener('click', () => {
        if (!unlocked) {
          Sound.wrong();
          const blocker = levelsFor(currentSubject).find(l => l.level === highest);
          const remaining = levelLessonIds(currentSubject, highest)
            .filter(id => !(state.completed[currentSubject] || []).includes(id)).length;
          toast(`🔒 أكمل «${blocker?.title || 'مستواك الحالي'}» أولًا — بقي ${remaining} ${remaining === 1 ? 'درس' : 'دروس'}.`);
          return;
        }
        Sound.click();
        browsingLevel = lv.level === state.level ? null : lv.level;
        renderPath();
      });
      wrap.appendChild(chip);
    });

    // keep the visible chip in view when the strip is long
    requestAnimationFrame(() => {
      const active = wrap.querySelector('.level-chip.active');
      if (active) active.scrollIntoView({ inline: 'center', block: 'nearest' });
    });
  }

  /* small transient message — used when an action is refused */
  let toastTimer = 0;
  function toast(message) {
    let el = document.getElementById('app-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast';
      el.className = 'app-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function renderPath() {
    $('stat-xp').textContent = state.xp;
    $('stat-streak').textContent = state.streak;
    $('sidebar-xp').textContent = state.xp;
    $('sidebar-streak').textContent = state.streak;

    document.querySelectorAll('.subject-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.subject === currentSubject));

    // a level that was browsable in one subject may be locked in the other,
    // and changing your school grade in settings can strand you above it
    if (browsingLevel != null && !isLevelUnlocked(currentSubject, browsingLevel)) browsingLevel = null;
    renderLevelChips();

    const levelEntry = levelsFor(currentSubject).find(l => l.level === currentPathLevel());
    const units = levelEntry ? levelEntry.units : [];
    const thisLevelIds = units.flatMap(u => u.lessonIds);
    const lessons = lessonsFor(currentSubject);
    const completedIds = state.completed[currentSubject] || [];
    const byId = Object.fromEntries(lessons.map(l => [l.id, l]));

    const wrap = $('path-groups');
    wrap.innerHTML = '';

    if (levelEntry) {
      const head = document.createElement('div');
      head.className = 'path-level-head';
      head.innerHTML = `${levelEntry.icon} <b>${levelEntry.title}</b> <span>(${levelEntry.stage})</span>`;
      wrap.appendChild(head);
    }

    let activeGiven = false;

    units.forEach((unit, ui) => {
      const group = document.createElement('div');
      group.className = 'path-unit-group';

      const unitDone = unit.lessonIds.filter(id => completedIds.includes(id)).length;
      const banner = document.createElement('div');
      banner.className = 'unit-banner';
      banner.innerHTML = `
        <div>
          <div class="unit-eyebrow">الوحدة ${ui + 1}</div>
          <div class="unit-title">${unit.title}</div>
          <div class="unit-progress">${unitDone}/${unit.lessonIds.length} مكتمل</div>
        </div>
        <div class="unit-book">${unit.icon}</div>`;
      group.appendChild(banner);

      const list = document.createElement('div');
      list.className = 'path-nodes';
      unit.lessonIds.forEach(id => {
        const l = byId[id];
        if (!l) return;
        const done = completedIds.includes(l.id);
        const isActive = !done && !activeGiven;
        if (isActive) activeGiven = true;
        const locked = !done && !isActive;

        const node = document.createElement('div');
        node.className = 'lesson-node' + (done ? ' done' : isActive ? ' active-lesson' : ' locked');
        node.innerHTML = `
          ${isActive ? '<div class="node-flag">ابدأ</div>' : ''}
          <div class="node-circle">${done ? '👑' : locked ? '🔒' : l.icon}</div>
          <div class="node-title">${l.title}</div>
          ${isActive ? `<div class="node-mascot">${mascotSVG()}</div>` : ''}`;
        if (!locked) node.addEventListener('click', () => { Sound.click(); startLesson(l); });
        list.appendChild(node);
      });
      group.appendChild(list);
      wrap.appendChild(group);
    });

    const allDone = thisLevelIds.length > 0 && thisLevelIds.every(id => completedIds.includes(id));
    const nextLevel = levelsFor(currentSubject).find(l => l.level === currentPathLevel() + 1);
    const trophyGroup = document.createElement('div');
    trophyGroup.className = 'path-unit-group';
    trophyGroup.innerHTML = `
      <div class="path-nodes">
        <div class="lesson-node trophy-node ${allDone ? 'done' : 'locked'}">
          <div class="node-circle">🏆</div>
          <div class="node-title">${allDone ? 'أحسنت! أكملت هذا المستوى' : 'أكمل كل الدروس لتفتح الجائزة'}</div>
          ${allDone && nextLevel
            ? `<div class="node-unlocked">🔓 فُتح لك «${nextLevel.title}»</div>`
            : !allDone && nextLevel
              ? `<div class="node-nextlock">🔒 «${nextLevel.title}» يُفتح بعد إنهاء هذا المستوى</div>`
              : ''}
        </div>
      </div>`;
    wrap.appendChild(trophyGroup);

    // the map climbs upward, so start the view at the bottom then ease to
    // wherever منير is standing
    const scroller = $('path-scroll');
    scroller.scrollTop = scroller.scrollHeight;
    requestAnimationFrame(() => {
      const active = wrap.querySelector('.lesson-node.active-lesson');
      if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------------- library (book-style browse & search) ---------------- */
  const BOOK_META = {
    math: { title: 'كتاب الرياضيات', cover: 'img/book-math.png', name: 'الرياضيات' },
    english: { title: 'English Book', cover: 'img/book-english.png', name: 'English' },
  };
  let bookLessonRef = null; // { subject, lesson } — currently open reading page

  function stripHtml(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

  function renderLibrary() {
    const wrap = $('library-books');
    wrap.innerHTML = '';
    SUBJECT_META.filter(s => s.enabled).forEach(s => {
      const meta = BOOK_META[s.id];
      const levels = levelsFor(s.id);
      const lessons = lessonsFor(s.id);
      const card = document.createElement('div');
      card.className = 'book-card';
      card.innerHTML = `
        <img src="${meta.cover}" alt="${meta.title}" class="book-cover-img">
        <div class="book-card-title">${s.icon} ${meta.title}</div>
        <div class="book-card-sub">${levels.length} مستويات · ${lessons.length} درسًا</div>`;
      card.addEventListener('click', () => { Sound.click(); openBook(s.id); });
      wrap.appendChild(card);
    });
    $('dict-promo-count').textContent =
      `${DICTIONARY.length} كلمة · ${DICT_CATEGORIES.length - 1} تصنيفًا — كل كلمة برسمة ومعناها ومثال عليها`;
    $('library-search').value = '';
    $('library-search-results').style.display = 'none';
    $('library-books-wrap').style.display = 'block';
  }

  function searchLibrary(term) {
    const q = term.trim().toLowerCase();
    const resultsEl = $('library-search-results');
    const booksEl = $('library-books-wrap');
    if (!q) {
      resultsEl.style.display = 'none';
      booksEl.style.display = 'block';
      return;
    }
    booksEl.style.display = 'none';
    resultsEl.style.display = 'flex';

    const hits = [];
    SUBJECT_META.filter(s => s.enabled).forEach(s => {
      lessonsFor(s.id).forEach(l => {
        const haystack = [
          l.title,
          ...l.explanations.map(e => e.bubble + ' ' + e.steps.map(stripHtml).join(' ')),
          ...l.quiz.map(qq => (qq.q || '') + ' ' + (qq.math || '') + ' ' + (qq.why || '')),
        ].join(' ').toLowerCase();
        if (haystack.includes(q)) {
          let unitTitle = '';
          for (const lv of levelsFor(s.id)) {
            const unit = lv.units.find(u => u.lessonIds.includes(l.id));
            if (unit) { unitTitle = `${lv.title} · ${unit.title}`; break; }
          }
          hits.push({ subject: s, lesson: l, unitTitle });
        }
      });
    });

    resultsEl.innerHTML = '';
    if (!hits.length) {
      resultsEl.innerHTML = `<div class="search-no-results">لا توجد نتائج لـ "${term}" 🔍</div>`;
      return;
    }
    hits.forEach(h => {
      const row = document.createElement('div');
      row.className = 'search-result-row';
      row.innerHTML = `
        <div class="search-result-icon">${h.lesson.icon}</div>
        <div>
          <div class="search-result-title">${h.lesson.title}</div>
          <div class="search-result-meta">${h.subject.icon} ${BOOK_META[h.subject.id].name} · ${h.unitTitle}</div>
        </div>`;
      row.addEventListener('click', () => { Sound.click(); openBookLesson(h.subject.id, h.lesson); });
      resultsEl.appendChild(row);
    });
  }

  function openBook(subject) {
    $('book-title').textContent = BOOK_META[subject].title;
    const wrap = $('book-body');
    wrap.innerHTML = '';
    const completedIds = state.completed[subject] || [];
    const lessons = lessonsFor(subject);
    const byId = Object.fromEntries(lessons.map(l => [l.id, l]));

    levelsFor(subject).forEach(lv => {
      const chapter = document.createElement('div');
      chapter.className = 'book-chapter';
      chapter.innerHTML = `<div class="book-chapter-head"><span class="book-chapter-icon">${lv.icon}</span> ${lv.title} <span class="book-chapter-stage">(${lv.stage})</span></div>`;
      lv.units.forEach(unit => {
        const unitHead = document.createElement('div');
        unitHead.className = 'book-unit-head';
        unitHead.textContent = `${unit.icon} ${unit.title}`;
        chapter.appendChild(unitHead);
        unit.lessonIds.forEach(id => {
          const l = byId[id];
          if (!l) return;
          const done = completedIds.includes(l.id);
          const row = document.createElement('div');
          row.className = 'book-lesson-row' + (done ? ' done' : '');
          row.innerHTML = `
            <div class="lesson-icon">${l.icon}</div>
            <div class="lesson-row-title">${l.title}</div>
            <div class="lesson-row-check">${done ? '✅' : ''}</div>
            <div class="lesson-row-arrow">‹</div>`;
          row.addEventListener('click', () => { Sound.click(); openBookLesson(subject, l); });
          chapter.appendChild(row);
        });
      });
      wrap.appendChild(chapter);
    });
    show('screen-book');
  }

  function openBookLesson(subject, l) {
    bookLessonRef = { subject, lesson: l };
    $('book-lesson-header-title').textContent = l.title;
    const wrap = $('book-lesson-body');

    const main = l.explanations[0];
    const alternates = l.explanations.slice(1);

    let html = `<div class="reading-summary">${main.bubble}</div>`;
    html += `<div class="reading-section-title">الشرح الكامل</div>`;
    html += `<div class="reading-steps">${main.steps.map(s => `<div class="reading-step">${s}</div>`).join('')}</div>`;

    if (alternates.length) {
      html += `<details class="variant-details"><summary>طرق أخرى لفهم نفس الدرس (${alternates.length})</summary>`;
      alternates.forEach((exp, i) => {
        html += `<div class="variant-block">
          <div class="variant-block-title">الطريقة ${i + 2}</div>
          <div class="reading-summary" style="margin-bottom:8px">${exp.bubble}</div>
          <div class="reading-steps">${exp.steps.map(s => `<div class="reading-step">${s}</div>`).join('')}</div>
        </div>`;
      });
      html += `</details>`;
    }

    wrap.innerHTML = html;

    const cta = document.createElement('button');
    cta.className = 'btn btn-primary btn-wide reading-cta';
    cta.textContent = '✓ ابدأ التمرين التفاعلي';
    cta.addEventListener('click', () => {
      Sound.click();
      currentSubject = subject;
      startLesson(l);
    });
    wrap.appendChild(cta);

    show('screen-book-lesson');
  }

  /* ---------------- القاموس المصوّر (illustrated dictionary) ---------------- */
  let dictCat = 'all';
  let dictQuery = '';
  const DICT_CAT_BY_KEY = Object.fromEntries(DICT_CATEGORIES.map(c => [c.key, c]));

  function catOf(word) { return DICT_CAT_BY_KEY[word.cat] || DICT_CAT_BY_KEY.all; }

  function dictMatches() {
    const q = dictQuery.trim().toLowerCase();
    return DICTIONARY.filter(d => {
      if (dictCat !== 'all' && d.cat !== dictCat) return false;
      if (!q) return true;
      return (d.w + ' ' + d.ar + ' ' + d.ex + ' ' + d.exAr + ' ' + d.pos).toLowerCase().includes(q);
    });
  }

  function renderDictCats() {
    const wrap = $('dict-cats');
    wrap.innerHTML = '';
    DICT_CATEGORIES.forEach(c => {
      const n = c.key === 'all' ? DICTIONARY.length : DICTIONARY.filter(d => d.cat === c.key).length;
      if (!n) return;
      const btn = document.createElement('button');
      btn.className = 'dict-cat' + (c.key === dictCat ? ' active' : '');
      btn.style.setProperty('--cat-c1', c.c1);
      btn.style.setProperty('--cat-c2', c.c2);
      btn.innerHTML = `<span class="dict-cat-icon">${c.icon}</span> ${c.label} <span class="dict-cat-n">${n}</span>`;
      btn.addEventListener('click', () => { Sound.click(); dictCat = c.key; renderDictionary(); });
      wrap.appendChild(btn);
    });
  }

  function renderDictionary() {
    renderDictCats();
    const hits = dictMatches();
    $('dict-count').textContent = hits.length
      ? `${hits.length} كلمة`
      : '';

    const grid = $('dict-grid');
    grid.innerHTML = '';
    if (!hits.length) {
      grid.innerHTML = `<div class="search-no-results">لا توجد كلمة تطابق «${dictQuery}» 🔍</div>`;
      return;
    }
    hits.forEach(d => {
      const c = catOf(d);
      const card = document.createElement('button');
      card.className = 'dict-card';
      card.style.setProperty('--cat-c1', c.c1);
      card.style.setProperty('--cat-c2', c.c2);
      card.innerHTML = `
        <span class="dict-card-art"><span class="dict-card-glyph">${d.g}</span></span>
        <span class="dict-card-body">
          <span class="dict-card-w" dir="ltr">${d.w}</span>
          <span class="dict-card-ar">${d.ar}</span>
        </span>`;
      card.addEventListener('click', () => { Sound.click(); openWord(d); });
      grid.appendChild(card);
    });
  }

  function openWord(d) {
    const c = catOf(d);
    const inner = $('word-modal-inner');
    inner.style.setProperty('--cat-c1', c.c1);
    inner.style.setProperty('--cat-c2', c.c2);
    inner.innerHTML = `
      <div class="word-hero">
        <div class="word-hero-glyph">${d.g}</div>
        <button class="word-close" id="btn-word-close">✕</button>
      </div>
      <div class="word-main">
        <div class="word-en" dir="ltr">${d.w}</div>
        <div class="word-ipa" dir="ltr">${d.ipa} <span class="word-pos">${d.pos}</span></div>
        <div class="word-ar">${d.ar}</div>
        <button class="btn btn-primary btn-wide word-listen" id="btn-word-listen">🔊&nbsp; استمع إلى الكلمة</button>
        <div class="word-example">
          <div class="word-example-label">مثال</div>
          <div class="word-example-en" dir="ltr">${d.ex}</div>
          <div class="word-example-ar">${d.exAr}</div>
          <button class="btn btn-ghost btn-wide" id="btn-word-listen-ex">🔊&nbsp; استمع إلى الجملة</button>
        </div>
        <div class="word-cat-tag">${c.icon} ${c.label}</div>
      </div>`;

    $('btn-word-close').addEventListener('click', closeWord);
    $('btn-word-listen').addEventListener('click', () => { Sound.click(); speakEnglish(d.w); });
    $('btn-word-listen-ex').addEventListener('click', () => { Sound.click(); speakEnglish(d.ex); });
    $('word-modal').classList.add('open');
    speakEnglish(d.w);
  }

  function closeWord() {
    Sound.click();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    $('word-modal').classList.remove('open');
  }

  /* The lesson voice is an Arabic one; dictionary entries have to be read by
     an English voice or every word comes out mispronounced. */
  function speakEnglish(text) {
    if (prefs.tts === false || !('speechSynthesis' in window)) return;
    Speech.stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    u.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x => /^en-GB/i.test(x.lang)) || voices.find(x => /^en/i.test(x.lang));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }

  function openDictionary() {
    dictCat = 'all';
    dictQuery = '';
    $('dict-search').value = '';
    renderDictionary();
    show('screen-dictionary');
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

    btnNo.disabled = true; btnYes.disabled = true;
    $('bubble-text').innerHTML = 'دعني أفكر في طريقة أفضل للشرح<span class="thinking-dots"></span>';
    $('board-steps').innerHTML = '';
    const alt = await AI.reExplain(lesson, shownExplanations);
    btnNo.disabled = false; btnYes.disabled = false;
    if (alt) { playExplanation(alt); return; }

    variantIdx = (variantIdx + 1) % lesson.explanations.length;
    playExplanation(lesson.explanations[variantIdx]);
  }

  /* ---------------- quiz ---------------- */
  function startQuiz() {
    Speech.stop();
    typeToken++;
    quizIdx = 0;
    hearts = state.premium ? 5 : 3;
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
    questionStartedAt = Date.now();
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
      // the custom math keyboard (d/dx, √, x², ...) only makes sense for math
      fab.style.display = currentSubject === 'math' ? 'flex' : 'none';
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

  /** which unit does the current lesson belong to (for the analytics report) */
  function unitTitleOf(subject, lessonId) {
    for (const lv of levelsFor(subject)) {
      const u = lv.units.find(u => u.lessonIds.includes(lessonId));
      if (u) return u.title;
    }
    return '';
  }

  /** log one answered question so the profile report can learn from it */
  function logAnswer(q, ok, skipped, userAnswer) {
    try {
      Analytics.record({
        subject: currentSubject,
        level: currentPathLevel(),
        unit: unitTitleOf(currentSubject, lesson.id),
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        qIndex: quizIdx,
        qType: q.type,
        question: q.q,
        correct: ok,
        skipped,
        userAnswer,
        correctAnswer: q.type === 'choice' ? q.options[q.correct] : q.answer,
        ms: questionStartedAt ? Date.now() - questionStartedAt : 0,
      });
    } catch (e) { console.warn('analytics record failed:', e.message); }
  }

  function check() {
    if (answered) return;
    const q = currentQ();
    let ok, userAnswer;
    if (q.type === 'choice') {
      if (quizSelected < 0) return;
      ok = quizSelected === q.correct;
      userAnswer = q.options[quizSelected];
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
      userAnswer = $('write-input').value.trim();
      closeKeyboard();
    }
    answered = true;
    logAnswer(q, ok, false, userAnswer);
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
    logAnswer(q, false, true, '');
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

  /* ---------------- congrats + progress recording ---------------- */
  function finishLesson() {
    const today = new Date().toDateString();
    if (state.lastDay !== today) {
      const yesterday = new Date(Date.now() - 864e5).toDateString();
      state.streak = (state.lastDay === yesterday) ? state.streak + 1 : 1;
      state.lastDay = today;
    }
    state.xp += sessionXP;
    const bucket = state.completed[currentSubject] || (state.completed[currentSubject] = []);
    const levelWasComplete = isLevelComplete(currentSubject, currentPathLevel());
    if (!bucket.includes(lesson.id)) bucket.push(lesson.id);
    updateHomeLibraryWatermark();

    // finishing the last lesson of a grade is what unlocks the next one
    if (!levelWasComplete && isLevelComplete(currentSubject, currentPathLevel())) {
      const next = levelsFor(currentSubject).find(l => l.level === currentPathLevel() + 1);
      if (next) setTimeout(() => toast(`🔓 أكملت المستوى! فُتح لك «${next.title}»`), 1400);
    }

    const acc = Math.round(sessionCorrect / lesson.quiz.length * 100);
    const attempt = {
      subject: currentSubject, lessonId: lesson.id,
      passed: true, accuracy: acc, xpEarned: sessionXP,
      completedAt: new Date().toISOString()
    };
    state.attempts.push(attempt);
    saveState();

    // best-effort server sync — never blocks the UI, fails silently for guests
    if (Auth.isLoggedIn()) {
      ManaraAPI.postProgress(attempt).catch(e => console.warn('progress sync failed:', e.message));
    }

    show('screen-congrats');
    Sound.fanfare();
    $('congrats-sub').textContent = acc === 100 ? 'مثالي! أنت نجم منارة! 🌟'
      : acc >= 60 ? 'أداء رائع! استمر! 🎉' : 'أكملت الدرس — التدريب يصنع الإتقان! 💪';
    $('result-acc').textContent = acc + '%';
    countUp($('result-xp'), sessionXP);
    startConfetti();
    Speech.speak(acc === 100 ? 'مبروك! أكملت الدرس بعلامة كاملة! أنت نجم منارة!'
      : 'مبروك! أكملت الدرس! أحسنت صنعًا!');
  }

  /** push any not-yet-synced local attempts into the account, after login.
      Attempts are marked synced rather than deleted, so the local attempt
      log keeps working as the source of truth for level/unit display
      (per-subject XP isn't exposed by GET /stats, only the global total). */
  async function syncGuestProgress() {
    const unsynced = state.attempts.filter(a => !a.synced);
    if (!unsynced.length) return;
    try {
      await ManaraAPI.syncProgress(unsynced);
      unsynced.forEach(a => { a.synced = true; });
      saveState();
    } catch (e) { console.warn('guest progress sync failed:', e.message); }
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
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', prefs.theme === 'dark' ? 'dark' : 'light');
  }

  function openSettings() {
    Sound.click();
    $('set-eleven-speed').value = prefs.elevenSpeed || 1.2;
    $('set-eleven-speed-val').textContent = (prefs.elevenSpeed || 1.2).toFixed(2);
    $('set-sfx').checked = prefs.sfx !== false;
    $('set-tts').checked = prefs.tts !== false;
    $('set-dark-mode').checked = prefs.theme === 'dark';
    $('set-school-level').value = String(state.level);

    const loggedIn = Auth.isLoggedIn();
    $('settings-account-guest').style.display = loggedIn ? 'none' : 'block';
    $('settings-account-user').style.display = loggedIn ? 'block' : 'none';
    if (loggedIn) $('settings-account-name').textContent = Auth.getUser()?.name || Auth.getUser()?.email || 'مستخدم';

    $('settings-modal').classList.add('open');
  }

  async function saveSettings() {
    prefs.elevenSpeed = parseFloat($('set-eleven-speed').value) || 1.2;
    prefs.sfx = $('set-sfx').checked;
    prefs.tts = $('set-tts').checked;
    prefs.theme = $('set-dark-mode').checked ? 'dark' : 'light';
    savePrefs();
    applyTheme();
    Sound.setEnabled(prefs.sfx);

    const newLevel = Math.min(MAX_LEVEL, Math.max(0, Number($('set-school-level').value) || 0));
    const levelChanged = newLevel !== state.level;
    if (levelChanged) {
      state.level = newLevel;
      if (state.onboarding) state.onboarding.gradeLevel = String(newLevel);
      browsingLevel = null; // land on the newly chosen grade
      saveState();
    }

    Sound.correct();
    $('settings-modal').classList.remove('open');

    if (levelChanged) {
      renderPath();
      const entry = MATH_LEVELS.find(l => l.level === newLevel);
      toast(`🎓 تم تغيير مستواك إلى «${entry ? entry.title : newLevel}»`);
      if (ManaraAPI.available()) {
        ManaraAPI.updateProfile({ schoolLevel: newLevel })
          .catch(e => console.warn('school level sync failed:', e.message));
      }
    }
  }

  function resetProgress() {
    if (!confirm('هل أنت متأكد؟ سيتم حذف كل نقاطك وتتابعك وتقدّمك في الدروس على هذا الجهاز.')) return;
    state.xp = 0;
    state.streak = 0;
    state.lastDay = '';
    state.completed = { math: [], english: [] };
    state.attempts = [];
    saveState();
    Sound.click();
    $('settings-modal').classList.remove('open');
    renderPath();
    updateHomeLibraryWatermark();
    show('screen-home');
  }

  /* ---------------- auth screens ---------------- */
  function showAuthError(id, message) {
    const el = $(id);
    el.textContent = message;
    el.classList.add('show');
  }
  function clearAuthErrors() {
    ['login-error', 'signup-error', 'forgot-email-error', 'forgot-code-error'].forEach(id => {
      $(id).textContent = '';
      $(id).classList.remove('show');
    });
    const resend = $('btn-resend-verification');
    if (resend) resend.style.display = 'none';
  }

  function updateHomeAuthUI() {
    updateAuthChrome(null);
    updateHomeLibraryWatermark();
  }

  function updateHomeLibraryWatermark() {
    const mathLv = levelFor(subjectXP('math'));
    const enLv = levelFor(subjectXP('english'));
    const anyProgress = state.attempts.length > 0;
    $('home-library-level').textContent = anyProgress
      ? `📐 المستوى ${mathLv} · 🔤 المستوى ${enLv}`
      : 'تصفّح كل الوحدات والدروس';
  }

  /* ---------------- Google Identity Services ----------------
     The old version bailed out silently whenever the GSI script hadn't
     finished loading, and only ever retried once — so on a slow connection
     the button never appeared and nothing explained why. This version keeps
     polling for the script, initializes exactly once, re-renders whenever an
     auth screen opens, and always leaves a readable message behind when
     Google sign-in genuinely can't work. */
  function googleUnavailableReason() {
    if (!MANARA_CONFIG.API_BASE) return 'الدخول بجوجل يحتاج إلى ربط التطبيق بالخادم أولًا.';
    if (!MANARA_CONFIG.GOOGLE_CLIENT_ID) return 'الدخول بجوجل غير مُفعَّل بعد على هذا التطبيق.';
    return null;
  }

  function setGoogleNote(text) {
    ['google-note-login', 'google-note-signup'].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.textContent = text || '';
      el.style.display = text ? 'block' : 'none';
    });
  }

  function renderGoogleButtons() {
    const blocked = googleUnavailableReason();
    if (blocked) {
      setGoogleNote(blocked);
      ['google-btn-login', 'google-btn-signup'].forEach(id => { const el = $(id); if (el) el.style.display = 'none'; });
      return;
    }
    ['google-btn-login', 'google-btn-signup'].forEach(id => { const el = $(id); if (el) el.style.display = ''; });

    if (!window.google?.accounts?.id) {
      // the GSI script is still in flight — keep checking, it is async+defer
      if (googleRetries < 40) { googleRetries++; setTimeout(renderGoogleButtons, 250); }
      else setGoogleNote('تعذّر تحميل خدمة جوجل — تحقّق من اتصالك بالإنترنت.');
      return;
    }

    try {
      if (!googleInitialized) {
        google.accounts.id.initialize({
          client_id: MANARA_CONFIG.GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });
        googleInitialized = true;
      }
      // Render into whichever slot is currently on screen. GSI produces a
      // zero-width button inside a display:none parent, so a slot that was
      // rendered while hidden has to be re-rendered once it becomes visible.
      // The "already done" test is the slot's real content, not a flag —
      // a flag lies if GSI silently failed and left the slot empty.
      ['google-btn-login', 'google-btn-signup'].forEach(id => {
        const el = $(id);
        if (!el || !el.offsetParent) return;   // still hidden — skip
        if (el.childElementCount > 0) return;   // a button is already there
        google.accounts.id.renderButton(el, {
          type: 'standard', theme: 'outline', shape: 'pill',
          size: 'large', text: 'continue_with', locale: 'ar', width: 280,
        });
      });
      setGoogleNote('');
    } catch (e) {
      console.warn('Google button render failed:', e.message);
      setGoogleNote('تعذّر تجهيز الدخول بجوجل: ' + e.message);
    }
  }

  /* Draw the button once an auth screen is actually on show.
     Deliberately NOT requestAnimationFrame: rAF is suspended whenever the
     page isn't compositing (background tab, hidden window), so the button
     would silently never appear there. A short bounded poll works
     regardless of paint state and stops as soon as the slot has content. */
  function scheduleGoogleRender() {
    let tries = 0;
    (function attempt() {
      renderGoogleButtons();
      const drawn = ['google-btn-login', 'google-btn-signup']
        .some(id => { const el = $(id); return el && el.offsetParent && el.childElementCount > 0; });
      if (!drawn && ++tries < 12) setTimeout(attempt, 250);
    })();
  }

  /** shared post-auth flow: sync guest progress, then onboarding (new accounts) or straight to path */
  async function postAuthSuccess(isNewUser) {
    await syncGuestProgress();
    await pullServerProfile();
    updateHomeAuthUI();
    if (isNewUser && !state.onboardingDone) {
      startOnboarding();
    } else {
      renderPath();
      show('screen-path');
    }
  }

  /** adopt the grade/avatar this account already chose on another device */
  async function pullServerProfile() {
    if (!ManaraAPI.available()) return;
    try {
      const { stats } = await ManaraAPI.getStats();
      if (Number.isInteger(stats.schoolLevel)) {
        state.level = Math.min(MAX_LEVEL, Math.max(0, stats.schoolLevel));
        state.onboardingDone = true;
        browsingLevel = null;
      }
      if (stats.avatarKey && AVATARS.isValid(stats.avatarKey)) state.avatar = stats.avatarKey;
      state.premium = stats.subscriptionStatus === 'premium';
      saveState();
    } catch (e) { console.warn('could not load server profile:', e.message); }
  }

  /** whichever auth screen the user is actually looking at */
  function activeAuthErrorId() {
    return $('screen-signup').classList.contains('active') ? 'signup-error' : 'login-error';
  }

  async function handleGoogleCredential(response) {
    try {
      const { isNewUser } = await Auth.googleSignIn(response.credential);
      await postAuthSuccess(isNewUser);
    } catch (e) {
      showAuthError(activeAuthErrorId(), e.message);
    }
  }

  async function submitLogin() {
    clearAuthErrors();
    $('btn-resend-verification').style.display = 'none';
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    if (!email || !password) return showAuthError('login-error', 'أدخل البريد الإلكتروني وكلمة المرور');
    try {
      Sound.click();
      const { isNewUser } = await Auth.login(email, password);
      await postAuthSuccess(isNewUser);
    } catch (e) {
      showAuthError('login-error', e.message);
      // an unconfirmed account can't be fixed by retrying — offer the resend
      if (e.code === 'EMAIL_NOT_VERIFIED') $('btn-resend-verification').style.display = 'block';
    }
  }

  async function resendVerification() {
    const email = $('login-email').value.trim();
    if (!email) return showAuthError('login-error', 'أدخل بريدك الإلكتروني أولًا');
    const btn = $('btn-resend-verification');
    btn.disabled = true;
    try {
      Sound.click();
      await Auth.resendVerification(email);
      btn.style.display = 'none';
      toast('📩 أرسلنا لك رابط التأكيد — تحقّق من بريدك');
    } catch (e) {
      showAuthError('login-error', e.message);
    } finally { btn.disabled = false; }
  }

  async function submitSignup() {
    clearAuthErrors();
    const name = $('signup-name').value.trim();
    const email = $('signup-email').value.trim();
    const password = $('signup-password').value;
    if (!name || !email || !password) return showAuthError('signup-error', 'يرجى ملء جميع الحقول');
    try {
      Sound.click();
      const { isNewUser } = await Auth.register(name, email, password);
      await postAuthSuccess(isNewUser);
    } catch (e) { showAuthError('signup-error', e.message); }
  }

  async function submitForgotSend() {
    clearAuthErrors();
    const email = $('forgot-email').value.trim();
    if (!email) return showAuthError('forgot-email-error', 'أدخل بريدك الإلكتروني');
    try {
      Sound.click();
      const { devCode } = await Auth.forgotPassword(email);
      $('forgot-step-email').style.display = 'none';
      $('forgot-step-code').style.display = 'block';
      // no mail server while running server-less: show the code instead
      const note = $('forgot-dev-code');
      note.style.display = devCode ? 'block' : 'none';
      note.textContent = devCode ? `الخادم غير مربوط بعد، لذا لا يمكن إرسال بريد. رمزك هو: ${devCode}` : '';
    } catch (e) { showAuthError('forgot-email-error', e.message); }
  }

  async function submitForgotReset() {
    clearAuthErrors();
    const email = $('forgot-email').value.trim();
    const code = $('forgot-code').value.trim();
    const newPassword = $('forgot-new-password').value;
    if (!code || !newPassword) return showAuthError('forgot-code-error', 'أدخل الرمز وكلمة المرور الجديدة');
    try {
      Sound.click();
      await Auth.resetPassword(email, code, newPassword);
      await postAuthSuccess(false); // resetting a password is always an existing account
    } catch (e) { showAuthError('forgot-code-error', e.message); }
  }

  function openForgotScreen() {
    clearAuthErrors();
    $('forgot-step-email').style.display = 'block';
    $('forgot-step-code').style.display = 'none';
    $('forgot-dev-code').style.display = 'none';
    $('forgot-email').value = '';
    $('forgot-code').value = '';
    $('forgot-new-password').value = '';
    show('screen-forgot');
  }

  /* ---------------- profile + paywall ---------------- */
  function renderSubjectProgressCards() {
    const wrap = $('subject-progress-list');
    wrap.innerHTML = '';
    SUBJECT_META.filter(s => s.enabled).forEach(s => {
      const xp = subjectXP(s.id);
      const xpLevel = levelFor(xp);
      const pct = xp % 100;
      const completedIds = state.completed[s.id] || [];
      const units = unitsFor(s.id); // the user's own school level

      const card = document.createElement('div');
      card.className = 'subject-progress-card';
      card.innerHTML = `
        <div class="subject-progress-head">
          <div class="subject-progress-name">${s.icon} ${s.name}</div>
          <div class="level-badge">⚡ مستوى الخبرة ${xpLevel}</div>
        </div>
        <div class="xp-bar-track"><div class="xp-bar-fill" style="width:${pct}%"></div></div>
        <div class="unit-breakdown">
          ${units.map((u, i) => {
            const done = u.lessonIds.filter(id => completedIds.includes(id)).length;
            return `<div class="unit-breakdown-row"><span>${u.icon} الوحدة ${i + 1}: ${u.title}</span><span>${done}/${u.lessonIds.length}</span></div>`;
          }).join('')}
        </div>`;
      wrap.appendChild(card);
    });
  }

  function currentAvatarKey() {
    return AVATARS.isValid(state.avatar) ? state.avatar : AVATARS.defaultKey;
  }

  async function renderProfile() {
    const user = Auth.getUser();
    $('profile-name').textContent = user?.name || 'مستخدم';
    $('profile-email').textContent = user?.email || '';
    $('profile-avatar').innerHTML = AVATARS.art(currentAvatarKey());

    // school grade chosen during onboarding (0-12)
    const schoolLv = MATH_LEVELS.find(l => l.level === state.level);
    $('profile-school-level').innerHTML = schoolLv
      ? `${schoolLv.icon} ${schoolLv.title} <span>(${schoolLv.stage})</span>`
      : '';

    $('profile-xp').textContent = state.xp;
    $('profile-streak').textContent = state.streak;
    $('premium-badge').style.display = state.premium ? 'inline-block' : 'none';
    renderSubjectProgressCards();

    if (ManaraAPI.available()) {
      try {
        const data = await ManaraAPI.getStats();
        state.premium = data.stats.subscriptionStatus === 'premium';
        $('profile-xp').textContent = data.stats.totalXp;
        $('profile-streak').textContent = data.stats.currentStreak;
        $('premium-badge').style.display = state.premium ? 'inline-block' : 'none';
        if (data.stats.avatarKey && AVATARS.isValid(data.stats.avatarKey)) {
          state.avatar = data.stats.avatarKey;
          $('profile-avatar').innerHTML = AVATARS.art(state.avatar);
        }
        saveState();
      } catch (e) { console.warn('could not load server stats:', e.message); }
    }
  }

  /* ---------------- avatar picker ---------------- */
  let pendingAvatar = null;

  function openAvatarPicker() {
    Sound.click();
    pendingAvatar = currentAvatarKey();
    const wrap = $('avatar-choices');
    wrap.innerHTML = '';
    AVATARS.list.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'avatar-choice' + (a.key === pendingAvatar ? ' selected' : '');
      btn.innerHTML = `<span class="avatar-choice-art">${a.art}</span><span class="avatar-choice-name">${a.name}</span>`;
      btn.addEventListener('click', () => {
        Sound.click();
        pendingAvatar = a.key;
        [...wrap.children].forEach(c => c.classList.toggle('selected', c === btn));
      });
      wrap.appendChild(btn);
    });
    $('avatar-modal').classList.add('open');
  }

  function saveAvatar() {
    if (!pendingAvatar) return;
    state.avatar = pendingAvatar;
    saveState();
    Sound.correct();
    $('avatar-modal').classList.remove('open');
    $('profile-avatar').innerHTML = AVATARS.art(state.avatar);
    if (ManaraAPI.available()) {
      ManaraAPI.updateProfile({ avatarKey: state.avatar })
        .catch(e => console.warn('avatar sync failed:', e.message));
    }
  }

  /* ---------------- display name ---------------- */
  function openNameEditor() {
    Sound.click();
    $('edit-name-input').value = Auth.getUser()?.name || '';
    $('edit-name-error').textContent = '';
    $('edit-name-error').classList.remove('show');
    $('name-modal').classList.add('open');
    setTimeout(() => $('edit-name-input').focus(), 60);
  }

  async function saveName() {
    const name = $('edit-name-input').value.trim();
    if (name.length < 2 || name.length > 40) {
      $('edit-name-error').textContent = 'الاسم يجب أن يكون بين حرفين و40 حرفًا';
      $('edit-name-error').classList.add('show');
      return;
    }
    let localOnly = false;
    if (ManaraAPI.available()) {
      try { await ManaraAPI.updateProfile({ name }); }
      catch (e) {
        // the endpoint simply isn't deployed yet — keep the rename locally
        if (!e.notDeployed) {
          $('edit-name-error').textContent = e.message;
          $('edit-name-error').classList.add('show');
          return;
        }
        localOnly = true;
      }
    }
    Auth.updateCachedUser({ name });
    Sound.correct();
    $('name-modal').classList.remove('open');
    $('profile-name').textContent = name;
    toast(localOnly ? '✓ تم تحديث اسمك على هذا الجهاز' : '✓ تم تحديث اسمك');
  }

  /* ---------------- performance report ---------------- */
  function renderReport() {
    const s = Analytics.stats();
    const body = $('report-body');

    if (!s.total) {
      body.innerHTML = `
        <div class="report-empty-state">
          <div class="report-empty-icon">📊</div>
          <h3>لا توجد بيانات بعد</h3>
          <p>أجب على أسئلة بعض الدروس، وسنحلّل إجاباتك لنُظهر لك نقاط قوتك ومواضع ضعفك بالتفصيل.</p>
        </div>`;
      return;
    }

    const activity = Analytics.barChart(s.days.map(d => ({ label: d.label, value: d.total })));
    const subjectBars = Analytics.hBars(s.bySubject);
    const typeBars = Analytics.hBars(s.byType, { color: 'var(--blue)' });
    const weak = Analytics.hBars(s.weakest, { color: 'var(--wrong)' });
    const strong = Analytics.hBars(s.strongest, { color: 'var(--correct)' });
    const levelBars = Analytics.hBars(s.byLevel, { color: 'var(--purple)' });

    const misses = s.topMisses.length ? s.topMisses.map(m => `
      <div class="miss-row">
        <div class="miss-count">${m.misses}×</div>
        <div class="miss-body">
          <div class="miss-q">${m.question || '—'}</div>
          <div class="miss-meta">${m.lessonTitle} · الإجابة الصحيحة: <b>${m.correctAnswer}</b></div>
        </div>
      </div>`).join('') : '<div class="report-empty">لم تُخطئ في أي سؤال بعد — ممتاز! 🎉</div>';

    body.innerHTML = `
      <div class="report-kpis">
        ${Analytics.donut(s.accuracy, 'الدقة العامة', s.accuracy >= 70 ? 'var(--correct)' : 'var(--primary)')}
        <div class="kpi-stack">
          <div class="kpi"><span class="kpi-v">${s.total}</span><span class="kpi-l">سؤالًا أجبت عليه</span></div>
          <div class="kpi"><span class="kpi-v">${s.correct}</span><span class="kpi-l">إجابة صحيحة</span></div>
          <div class="kpi"><span class="kpi-v">${s.totalMinutes}</span><span class="kpi-l">دقيقة تعلّم</span></div>
          <div class="kpi"><span class="kpi-v">${s.avgSeconds}s</span><span class="kpi-l">متوسط زمن السؤال</span></div>
        </div>
      </div>

      <div class="report-card">
        <div class="report-card-title">📅 نشاطك في آخر 7 أيام</div>
        ${activity}
      </div>

      <div class="report-card">
        <div class="report-card-title">🔴 أضعف الدروس — تحتاج مراجعة</div>
        <div class="report-hint">الدروس التي أخطأت فيها أكثر (بعد 3 محاولات على الأقل)</div>
        ${weak}
      </div>

      <div class="report-card">
        <div class="report-card-title">🟢 أقوى مهاراتك</div>
        ${strong}
      </div>

      <div class="report-card">
        <div class="report-card-title">📚 الأداء حسب المادة</div>
        ${subjectBars}
      </div>

      <div class="report-card">
        <div class="report-card-title">✍️ الاختيار مقابل الكتابة</div>
        <div class="report-hint">هل تجد صعوبة أكبر في كتابة الإجابة بنفسك؟</div>
        ${typeBars}
      </div>

      <div class="report-card">
        <div class="report-card-title">🎓 الأداء حسب المستوى الدراسي</div>
        ${levelBars}
      </div>

      <div class="report-card">
        <div class="report-card-title">❌ الأسئلة الأكثر خطأً</div>
        <div class="report-hint">راجع هذه تحديدًا — تكرّر خطؤك فيها</div>
        ${misses}
      </div>

      <p class="report-privacy">🔒 كل هذه البيانات محفوظة على جهازك فقط.</p>`;
  }

  async function subscribePremium() {
    if (!Auth.isLoggedIn()) { show('screen-login'); return; }
    try {
      Sound.click();
      await ManaraAPI.subscribe();
      state.premium = true;
      saveState();
      Sound.correct();
      show('screen-profile');
      renderProfile();
    } catch (e) { console.warn('subscribe failed:', e.message); }
  }

  /* ---------------- onboarding (first-time account setup) ---------------- */
  const COUNTRIES = [
    'السعودية', 'الإمارات', 'مصر', 'الأردن', 'الكويت', 'قطر', 'البحرين', 'عُمان',
    'العراق', 'سوريا', 'لبنان', 'فلسطين', 'اليمن', 'ليبيا', 'تونس', 'الجزائر',
    'المغرب', 'السودان', 'موريتانيا', 'الصومال', 'جيبوتي', 'جزر القمر',
    'تركيا', 'الولايات المتحدة', 'المملكة المتحدة', 'كندا', 'أستراليا', 'ألمانيا',
    'فرنسا', 'ماليزيا', 'إندونيسيا', 'باكستان', 'الهند', 'دولة أخرى'
  ];

  const ONBOARDING_STEPS = [
    {
      key: 'gradeLevel', type: 'chips',
      question: 'في أي صف دراسي أنت؟', subtext: 'سنفتح لك وحدات ودروس صفّك مباشرة — مثل مدرستك تمامًا',
      options: [
        { value: '0',  label: '🧸 رياض الأطفال' },
        { value: '1',  label: '1️⃣ الأول ابتدائي' },
        { value: '2',  label: '2️⃣ الثاني ابتدائي' },
        { value: '3',  label: '3️⃣ الثالث ابتدائي' },
        { value: '4',  label: '4️⃣ الرابع ابتدائي' },
        { value: '5',  label: '5️⃣ الخامس ابتدائي' },
        { value: '6',  label: '6️⃣ السادس ابتدائي' },
        { value: '7',  label: '📗 الأول متوسط' },
        { value: '8',  label: '📘 الثاني متوسط' },
        { value: '9',  label: '📙 الثالث متوسط' },
        { value: '10', label: '📕 الأول ثانوي' },
        { value: '11', label: '📔 الثاني ثانوي' },
        { value: '12', label: '🎓 الثالث ثانوي' },
      ]
    },
    {
      key: 'country', type: 'select',
      question: 'من أين أنت؟', subtext: 'لتخصيص أمثلة تناسب بيئتك',
    },
    {
      key: 'age', type: 'chips',
      question: 'كم عمرك؟', subtext: '',
      options: [
        { value: 'u12', label: 'أقل من 12' },
        { value: '13-17', label: '13 – 17' },
        { value: '18-25', label: '18 – 25' },
        { value: '26-40', label: '26 – 40' },
        { value: '40+', label: 'أكبر من 40' },
      ]
    },
    {
      key: 'pace', type: 'cards',
      question: 'كيف تصف أسلوبك في التعلّم؟', subtext: 'لا توجد إجابة خاطئة — كلها طبيعية! 😊',
      options: [
        { value: 'productive', label: 'منتج ومنظّم', img: 'img/onboarding/pace-productive.png' },
        { value: 'balanced', label: 'متوازن', img: 'img/onboarding/pace-balanced.png' },
        { value: 'relaxed', label: 'أحب أخذ وقتي بهدوء', img: 'img/onboarding/pace-relaxed.png' },
      ]
    },
    {
      key: 'goal', type: 'cards',
      question: 'ما هدفك من التعلّم؟', subtext: '',
      options: [
        { value: 'exams', label: 'التحضير للامتحانات', img: 'img/onboarding/goal-exams.png' },
        { value: 'grades', label: 'تحسين مستواي الدراسي', img: 'img/onboarding/goal-grades.png' },
        { value: 'curiosity', label: 'التعلّم من أجل المتعة', img: 'img/onboarding/goal-curiosity.png' },
      ]
    },
    {
      key: 'dailyTime', type: 'chips',
      question: 'كم دقيقة تريد التعلّم يوميًا؟', subtext: '',
      options: [
        { value: '5', label: '⏱️ 5 دقائق' },
        { value: '10', label: '⏱️ 10 دقائق' },
        { value: '15', label: '⏱️ 15 دقيقة' },
        { value: '20', label: '⏱️ 20+ دقيقة' },
      ]
    },
    {
      key: 'startSubject', type: 'chips',
      question: 'بماذا تريد أن تبدأ؟', subtext: '',
      options: [
        { value: 'math', label: '📐 الرياضيات' },
        { value: 'english', label: '🔤 English' },
        { value: 'both', label: '✨ كلاهما' },
      ]
    },
  ];

  let onboardingIdx = 0;
  let onboardingAnswers = {};

  function startOnboarding() {
    onboardingIdx = 0;
    onboardingAnswers = {};
    renderOnboardingDots();
    renderOnboardingStep();
    show('screen-onboarding');
  }

  function renderOnboardingDots() {
    const wrap = $('onboarding-dots');
    wrap.innerHTML = '';
    ONBOARDING_STEPS.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'onboarding-dot' + (i === onboardingIdx ? ' active' : i < onboardingIdx ? ' done' : '');
      wrap.appendChild(dot);
    });
  }

  function renderOnboardingStep() {
    const step = ONBOARDING_STEPS[onboardingIdx];
    $('onboarding-question').textContent = step.question;
    $('onboarding-subtext').textContent = step.subtext || '';
    $('btn-onboarding-back').style.visibility = onboardingIdx === 0 ? 'hidden' : 'visible';
    $('btn-onboarding-next').textContent = onboardingIdx === ONBOARDING_STEPS.length - 1 ? '✓ ابدأ رحلتك' : 'التالي';

    const wrap = $('onboarding-options');
    wrap.className = 'onboarding-options' + (step.type === 'chips' ? ' layout-chips' : '');
    wrap.innerHTML = '';

    const current = onboardingAnswers[step.key];

    if (step.type === 'select') {
      const select = document.createElement('select');
      select.className = 'onboarding-select';
      select.innerHTML = '<option value="">اختر بلدك...</option>' +
        COUNTRIES.map(c => `<option value="${c}">${c}</option>`).join('');
      if (current) select.value = current;
      select.addEventListener('change', () => selectOnboardingOption(select.value));
      wrap.appendChild(select);
      $('btn-onboarding-next').disabled = !current;
      return;
    }

    step.options.forEach(opt => {
      const el = document.createElement('div');
      el.className = (step.type === 'cards' ? 'option-card' : 'option-chip') + (current === opt.value ? ' selected' : '');
      el.innerHTML = step.type === 'cards'
        ? `<img src="${opt.img}" alt=""><span class="option-label">${opt.label}</span>`
        : opt.label;
      el.addEventListener('click', () => selectOnboardingOption(opt.value));
      wrap.appendChild(el);
    });
    $('btn-onboarding-next').disabled = !current;
  }

  function selectOnboardingOption(value) {
    if (!value) return;
    Sound.click();
    const step = ONBOARDING_STEPS[onboardingIdx];
    onboardingAnswers[step.key] = value;
    renderOnboardingStep();
  }

  function nextOnboardingStep() {
    if ($('btn-onboarding-next').disabled) return;
    Sound.click();
    if (onboardingIdx < ONBOARDING_STEPS.length - 1) {
      onboardingIdx++;
      renderOnboardingDots();
      renderOnboardingStep();
    } else {
      finishOnboarding();
    }
  }

  function prevOnboardingStep() {
    if (onboardingIdx === 0) return;
    Sound.click();
    onboardingIdx--;
    renderOnboardingDots();
    renderOnboardingStep();
  }

  function finishOnboarding() {
    state.onboarding = onboardingAnswers;
    state.onboardingDone = true;
    state.level = Math.min(MAX_LEVEL, Math.max(0, Number(onboardingAnswers.gradeLevel) || 0));
    browsingLevel = null; // land on the newly chosen level
    saveState();
    Sound.correct();

    if (ManaraAPI.available()) {
      ManaraAPI.updateProfile({ schoolLevel: state.level, onboarding: onboardingAnswers })
        .catch(e => console.warn('onboarding sync failed:', e.message));
    }

    if (onboardingAnswers.startSubject === 'english') currentSubject = 'english';
    else currentSubject = 'math';
    renderPath();
    show('screen-path');
  }

  function skipOnboarding() {
    Sound.click();
    state.onboardingDone = true;
    saveState();
    renderPath();
    show('screen-path');
  }

  /* ---------------- wire up ---------------- */
  function init() {
    [
      'mascot-home', 'mascot-lesson', 'mascot-congrats',
      'mascot-login', 'mascot-signup', 'mascot-forgot', 'mascot-profile', 'mascot-paywall'
    ].forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = mascotSVG();
    });
    Speech.bindMouths([$('mascot-lesson'), $('mascot-home'), $('mascot-congrats')]);

    // prime the browser voice engine on the very first tap anywhere,
    // so the first real lesson doesn't stall waiting for it to wake up
    document.addEventListener('pointerdown', () => Speech.warmUp(), { once: true });

    buildKeyboard();
    updateHomeAuthUI();
    applyTheme();
    renderGoogleButtons(); // self-retries until the async GSI script lands

    document.querySelectorAll('.subject-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        Sound.click();
        currentSubject = tab.dataset.subject;
        renderPath();
      });
    });

    $('btn-start').addEventListener('click', () => {
      Sound.click();
      if (!Auth.isLoggedIn()) { clearAuthErrors(); show('screen-signup'); return; }
      Sound.swoosh(); renderSubjectsScreen(); show('screen-subjects');
    });
    $('btn-close-subjects').addEventListener('click', () => { Sound.click(); show('screen-home'); });
    $('btn-subjects-path').addEventListener('click', () => { Sound.click(); renderSubjectsScreen(); show('screen-subjects'); });

    // ---- library ----
    $('btn-library-home').addEventListener('click', () => { Sound.click(); renderLibrary(); show('screen-library'); });
    $('btn-close-library').addEventListener('click', () => { Sound.click(); show('screen-path'); });
    $('btn-open-dictionary').addEventListener('click', () => { Sound.click(); openDictionary(); });
    $('btn-close-dictionary').addEventListener('click', () => { Sound.click(); renderLibrary(); show('screen-library'); });
    $('dict-search').addEventListener('input', (e) => { dictQuery = e.target.value; renderDictionary(); });
    $('word-modal').addEventListener('click', (e) => { if (e.target.id === 'word-modal') closeWord(); });
    $('btn-close-book').addEventListener('click', () => { Sound.click(); show('screen-library'); renderLibrary(); });
    $('btn-close-book-lesson').addEventListener('click', () => {
      Sound.click(); Speech.stop();
      if (bookLessonRef) openBook(bookLessonRef.subject); else show('screen-library');
    });
    $('btn-book-lesson-listen').addEventListener('click', () => {
      Sound.click();
      if (bookLessonRef) Speech.speak(bookLessonRef.lesson.explanations[0].speech);
    });
    $('library-search').addEventListener('input', (e) => searchLibrary(e.target.value));

    // ---- onboarding ----
    $('btn-onboarding-next').addEventListener('click', nextOnboardingStep);
    $('btn-onboarding-back').addEventListener('click', prevOnboardingStep);
    $('btn-onboarding-skip').addEventListener('click', skipOnboarding);

    $('btn-settings-home').addEventListener('click', openSettings);
    $('btn-settings-path').addEventListener('click', openSettings);
    $('btn-settings-cancel').addEventListener('click', () => { Sound.click(); $('settings-modal').classList.remove('open'); });
    $('btn-settings-save').addEventListener('click', saveSettings);
    $('btn-reset-progress').addEventListener('click', resetProgress);
    $('btn-settings-login').addEventListener('click', () => {
      Sound.click(); $('settings-modal').classList.remove('open'); clearAuthErrors(); scheduleGoogleRender(); show('screen-login');
    });
    $('btn-settings-logout').addEventListener('click', () => {
      Sound.click();
      Auth.logout();
      state.premium = false;
      saveState();
      updateHomeAuthUI();
      $('settings-modal').classList.remove('open');
      show('screen-home');
    });
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

    // ---- auth screens ----
    $('btn-login-home').addEventListener('click', () => { Sound.click(); clearAuthErrors(); scheduleGoogleRender(); show('screen-login'); });
    $('btn-close-login').addEventListener('click', () => { Sound.click(); show(Auth.isLoggedIn() ? 'screen-path' : 'screen-home'); });
    $('btn-close-signup').addEventListener('click', () => { Sound.click(); show(Auth.isLoggedIn() ? 'screen-path' : 'screen-home'); });
    $('btn-close-forgot').addEventListener('click', () => { Sound.click(); show('screen-login'); });
    $('btn-goto-forgot').addEventListener('click', () => { Sound.click(); openForgotScreen(); });
    $('btn-goto-signup').addEventListener('click', () => { Sound.click(); clearAuthErrors(); scheduleGoogleRender(); show('screen-signup'); });
    $('btn-goto-login').addEventListener('click', () => { Sound.click(); clearAuthErrors(); scheduleGoogleRender(); show('screen-login'); });
    $('btn-login-submit').addEventListener('click', submitLogin);
    $('btn-resend-verification').addEventListener('click', resendVerification);
    $('btn-signup-submit').addEventListener('click', submitSignup);
    $('btn-forgot-send').addEventListener('click', submitForgotSend);
    $('btn-forgot-reset').addEventListener('click', submitForgotReset);
    $('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') submitLogin(); });
    $('signup-password').addEventListener('keydown', e => { if (e.key === 'Enter') submitSignup(); });

    // ---- profile / paywall ----
    $('btn-close-profile').addEventListener('click', () => { Sound.click(); show('screen-path'); });
    $('btn-logout').addEventListener('click', () => {
      Sound.click();
      Auth.logout();
      state.premium = false;
      saveState();
      updateHomeAuthUI();
      show('screen-home');
    });
    $('btn-goto-paywall').addEventListener('click', () => { Sound.click(); show('screen-paywall'); });

    // ---- avatar + display name ----
    $('btn-change-avatar').addEventListener('click', openAvatarPicker);
    $('btn-avatar-save').addEventListener('click', saveAvatar);
    $('btn-avatar-cancel').addEventListener('click', () => { Sound.click(); $('avatar-modal').classList.remove('open'); });
    $('btn-edit-name').addEventListener('click', openNameEditor);
    $('btn-name-save').addEventListener('click', saveName);
    $('btn-name-cancel').addEventListener('click', () => { Sound.click(); $('name-modal').classList.remove('open'); });
    $('edit-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });
    $('btn-close-paywall').addEventListener('click', () => { Sound.click(); show('screen-profile'); renderProfile(); });
    $('btn-subscribe').addEventListener('click', subscribePremium);

    // ---- performance report ----
    $('btn-goto-report').addEventListener('click', () => { Sound.click(); renderReport(); show('screen-report'); });
    $('btn-close-report').addEventListener('click', () => { Sound.click(); show('screen-profile'); renderProfile(); });

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

    // shareable deep links, e.g. http://localhost:4188/#onboarding
    const HASH_ROUTES = {
      path: () => { renderPath(); show('screen-path'); },
      onboarding: () => startOnboarding(),
      subjects: () => { renderSubjectsScreen(); show('screen-subjects'); },
      library: () => { renderLibrary(); show('screen-library'); },
      dictionary: () => openDictionary(),
      profile: () => { show('screen-profile'); renderProfile(); },
      paywall: () => { show('screen-paywall'); },
      report: () => { renderReport(); show('screen-report'); },
      login: () => { clearAuthErrors(); show('screen-login'); },
      signup: () => { clearAuthErrors(); show('screen-signup'); },
      forgot: () => openForgotScreen(),
    };
    // deep links that need an account bounce to the login screen instead
    const AUTHED_ROUTES = new Set(['path', 'onboarding', 'subjects', 'library', 'dictionary', 'profile', 'paywall', 'report']);

    // desktop sidebar + mobile bottom-nav share the same destinations
    document.querySelectorAll('.sidebar-link[data-nav], .bottom-nav-link[data-nav]').forEach(el => {
      el.addEventListener('click', () => { Sound.click(); location.hash = el.dataset.nav; });
    });
    $('btn-settings-sidebar').addEventListener('click', openSettings);

    function handleHashRoute() {
      const key = location.hash.slice(1);
      const route = HASH_ROUTES[key];
      if (!route) return false;
      if (AUTHED_ROUTES.has(key) && !Auth.isLoggedIn()) {
        clearAuthErrors();
        show('screen-login');
        return true;
      }
      route();
      return true;
    }
    window.addEventListener('hashchange', handleHashRoute);

    // Boot: an account is required, so a signed-out visitor always lands on
    // the welcome screen. A signed-in one goes wherever the hash points, or
    // to their learning path.
    if (!Auth.isLoggedIn()) {
      show(location.hash === '#signup' ? 'screen-signup'
         : location.hash === '#forgot' ? 'screen-forgot'
         : location.hash === '#login' ? 'screen-login'
         : 'screen-home');
    } else if (!handleHashRoute()) {
      renderPath();
      show('screen-path');
    }
  }

  init();
})();
