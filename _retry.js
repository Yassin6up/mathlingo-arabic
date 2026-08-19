const fs = require('fs');
const words = JSON.parse(fs.readFileSync('_words.json','utf8'));
const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const keysFor = (w) => {
  const base = w.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const out = [base];
  if (base.includes(' ')) out.push(base.split(' ').pop());
  return out;
};

async function lookup(word) {
  for (const key of keysFor(word)) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(API + encodeURIComponent(key.toLowerCase()));
        if (res.status === 429) { await sleep(3000); continue; }   // throttled
        if (!res.ok) break;                                        // genuine 404
        const e = (await res.json())[0];
        const ipa = e.phonetic || (e.phonetics.find(p => p.text) || {}).text || '';
        const m = e.meanings[0];
        const d = m.definitions.find(x => x.definition) || {};
        return { ipa, pos: m.partOfSpeech || '', def: (d.definition||'').trim(), apiExample: (d.example||'').trim() };
      } catch { await sleep(1500); }
    }
  }
  return null;
}

(async () => {
  const todo = words.filter(w => !w.def);
  console.log('retrying', todo.length, 'words at 2/sec');
  let hit = 0;
  for (let i = 0; i < todo.length; i++) {
    const w = todo[i];
    const r = await lookup(w.w);
    if (r) {
      hit++;
      if (r.ipa) w.ipa = r.ipa;
      if (r.pos && !w.pos) w.pos = r.pos;
      if (r.def) w.def = r.def;
      if (!w.ex && r.apiExample) w.ex = r.apiExample;
    }
    if (i % 25 === 0) console.log(`  ${i}/${todo.length} … recovered ${hit}`);
    await sleep(450);
  }
  fs.writeFileSync('_words.json', JSON.stringify(words, null, 1));
  const still = words.filter(w => !w.def);
  console.log(`RETRY DONE — recovered ${hit}. Still without definition: ${still.length}`);
  console.log(still.map(w => w.w).join(', '));
})();
