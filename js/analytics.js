/* ============================================================
   منارة (Manara) — تحليلات التعلّم
   ------------------------------------------------------------
   يسجّل كل محاولة إجابة (صحيحة أو خاطئة) مع سياقها الكامل،
   ثم يشتقّ منها تقريرًا يوضّح نقاط القوة والضعف للطالب.
   كل شيء محفوظ محليًا في localStorage — لا يغادر جهاز المستخدم
   إلا إذا سجّل الدخول ورفعنا التقدّم للخادم.
   ============================================================ */
const Analytics = (() => {
  const KEY = 'manara-answers';
  const MAX_ENTRIES = 800; // keep storage bounded; oldest fall off

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  function save(log) {
    try { localStorage.setItem(KEY, JSON.stringify(log.slice(-MAX_ENTRIES))); }
    catch { /* quota exceeded — drop silently rather than break the quiz */ }
  }

  /** record one answered question */
  function record(entry) {
    const log = load();
    log.push({
      subject: entry.subject,
      level: entry.level,
      unit: entry.unit || '',
      lessonId: entry.lessonId,
      lessonTitle: entry.lessonTitle,
      qIndex: entry.qIndex,
      qType: entry.qType,             // 'choice' | 'write'
      question: (entry.question || '').slice(0, 120),
      correct: !!entry.correct,
      skipped: !!entry.skipped,
      userAnswer: (entry.userAnswer || '').slice(0, 60),
      correctAnswer: (entry.correctAnswer || '').slice(0, 60),
      ms: entry.ms || 0,
      at: Date.now(),
    });
    save(log);
  }

  function clear() { localStorage.removeItem(KEY); }

  const pct = (num, den) => den > 0 ? Math.round(num / den * 100) : 0;

  /** aggregate helper: group rows and compute correct/total per key */
  function groupAccuracy(rows, keyFn, labelFn) {
    const map = new Map();
    rows.forEach(r => {
      const k = keyFn(r);
      if (!map.has(k)) map.set(k, { key: k, label: labelFn(r), correct: 0, total: 0, ms: 0 });
      const g = map.get(k);
      g.total++; g.ms += r.ms || 0;
      if (r.correct) g.correct++;
    });
    return [...map.values()].map(g => ({ ...g, accuracy: pct(g.correct, g.total) }));
  }

  /** everything the report screen needs, computed in one pass */
  function stats() {
    const log = load();
    const total = log.length;
    const correct = log.filter(r => r.correct).length;

    const bySubject = groupAccuracy(log, r => r.subject, r => r.subject === 'english' ? 'English' : 'الرياضيات');
    const byLesson = groupAccuracy(log, r => r.subject + '::' + r.lessonId, r => r.lessonTitle);
    const byUnit = groupAccuracy(log, r => r.subject + '::' + r.unit, r => r.unit);
    const byType = groupAccuracy(log, r => r.qType, r => r.qType === 'write' ? 'أسئلة الكتابة' : 'أسئلة الاختيار');
    const byLevel = groupAccuracy(log, r => String(r.level), r => 'المستوى ' + r.level);

    // only judge a lesson once it has enough attempts to be meaningful
    const rated = byLesson.filter(l => l.total >= 3);
    const weakest = rated.filter(l => l.accuracy < 100).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
    const strongest = rated.filter(l => l.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);

    // the individual questions missed most often
    const missMap = new Map();
    log.filter(r => !r.correct).forEach(r => {
      const k = r.lessonId + '#' + r.qIndex;
      if (!missMap.has(k)) missMap.set(k, { question: r.question, lessonTitle: r.lessonTitle, correctAnswer: r.correctAnswer, misses: 0 });
      missMap.get(k).misses++;
    });
    const topMisses = [...missMap.values()].sort((a, b) => b.misses - a.misses).slice(0, 6);

    // activity for the last 7 days (oldest → newest)
    const days = [];
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const start = d.getTime(), end = start + 864e5;
      const rows = log.filter(r => r.at >= start && r.at < end);
      days.push({
        label: dayNames[d.getDay()],
        total: rows.length,
        correct: rows.filter(r => r.correct).length,
      });
    }

    const totalMs = log.reduce((s, r) => s + (r.ms || 0), 0);

    return {
      total, correct, accuracy: pct(correct, total),
      skipped: log.filter(r => r.skipped).length,
      bySubject, byLesson, byUnit, byType, byLevel,
      weakest, strongest, topMisses, days,
      totalMinutes: Math.round(totalMs / 60000),
      avgSeconds: total ? Math.round(totalMs / total / 1000) : 0,
    };
  }

  /* ---------------- SVG chart builders (no external libraries) ---------------- */

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** vertical bars — used for the 7-day activity chart */
  function barChart(items, { height = 120, color = 'var(--primary)' } = {}) {
    if (!items.length) return '';
    const max = Math.max(...items.map(i => i.value), 1);
    const bw = 100 / items.length;
    const bars = items.map((it, i) => {
      const h = (it.value / max) * (height - 26);
      const x = i * bw + bw * 0.18;
      const w = bw * 0.64;
      return `
        <rect x="${x}%" y="${height - 20 - h}" width="${w}%" height="${Math.max(h, 2)}"
              rx="3" fill="${it.value ? color : 'var(--gray-border)'}"/>
        <text x="${x + w / 2}%" y="${height - 6}" font-size="9" fill="var(--text-soft)"
              text-anchor="middle" font-family="inherit">${esc(it.label)}</text>
        ${it.value ? `<text x="${x + w / 2}%" y="${height - 24 - h}" font-size="9" fill="var(--text-soft)"
              text-anchor="middle" font-family="inherit">${it.value}</text>` : ''}`;
    }).join('');
    return `<svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" class="chart-svg" style="height:${height}px">${bars}</svg>`;
  }

  /** horizontal labelled bars — used for weak/strong lists */
  function hBars(items, { color = 'var(--primary)' } = {}) {
    if (!items.length) return '<div class="report-empty">لا توجد بيانات كافية بعد — أكمل بعض الدروس أولًا 📚</div>';
    return `<div class="hbar-list">` + items.map(it => `
      <div class="hbar-row">
        <div class="hbar-label" title="${esc(it.label)}">${esc(it.label)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${it.accuracy}%;background:${color}"></div></div>
        <div class="hbar-value">${it.accuracy}%</div>
      </div>`).join('') + `</div>`;
  }

  /** donut for a single percentage */
  function donut(value, label, color = 'var(--primary)') {
    const r = 34, c = 2 * Math.PI * r;
    const on = c * (value / 100);
    return `
      <div class="donut-wrap">
        <svg viewBox="0 0 90 90" class="donut">
          <circle cx="45" cy="45" r="${r}" fill="none" stroke="var(--gray-border)" stroke-width="10"/>
          <circle cx="45" cy="45" r="${r}" fill="none" stroke="${color}" stroke-width="10"
                  stroke-dasharray="${on} ${c}" stroke-linecap="round"
                  transform="rotate(-90 45 45)"/>
          <text x="45" y="50" text-anchor="middle" font-size="18" font-weight="800"
                fill="var(--text)" font-family="inherit">${value}%</text>
        </svg>
        <div class="donut-label">${esc(label)}</div>
      </div>`;
  }

  return { record, clear, stats, load, barChart, hBars, donut };
})();
