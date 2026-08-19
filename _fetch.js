const fs = require('fs');
const words = JSON.parse(fs.readFileSync('_words.json','utf8'));
const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// "fish (food)" -> "fish";  "ice cream" stays; fall back to last word for phrases
const keysFor = (w) => {
  const base = w.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const out = [base];
  if (base.includes(' ')) out.push(base.split(' ').pop());
  return out;
};

async function lookup(word) {
  for (const key of keysFor(word)) {
    try {
      const res = await fetch(API + encodeURIComponent(key.toLowerCase()));
      if (!res.ok) continue;
      const data = await res.json();
      const e = data[0];
      const ipa = e.phonetic || (e.phonetics.find(p => p.text) || {}).text || '';
      const m = e.meanings[0];
      const d = m.definitions.find(x => x.definition) || {};
      return { ipa, pos: m.partOfSpeech || '', def: (d.definition || '').trim(), apiExample: (d.example || '').trim() };
    } catch { /* network hiccup — try next key */ }
  }
  return null;
}

(async () => {
  let hit = 0, miss = 0;
  const CONC = 5;
  for (let i = 0; i < words.length; i += CONC) {
    const slice = words.slice(i, i + CONC);
    const results = await Promise.all(slice.map(w => lookup(w.w)));
    results.forEach((r, j) => {
      const w = slice[j];
      if (r) {
        hit++;
        if (r.ipa) w.ipa = r.ipa;              // API IPA is authoritative
        if (r.pos && !w.pos) w.pos = r.pos;
        if (r.def) w.def = r.def;              // NEW: English definition
        if (!w.ex && r.apiExample) w.ex = r.apiExample;
      } else { miss++; }
    });
    if (i % 50 === 0) console.log(`  ${i}/${words.length} … hits ${hit} misses ${miss}`);
  }
  console.log(`DONE — enriched ${hit}, not found ${miss}`);
  console.log('missing definition:', words.filter(w => !w.def).map(w => w.w).join(', '));
  fs.writeFileSync('_words.json', JSON.stringify(words, null, 1));
})();
