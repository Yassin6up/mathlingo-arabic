const fs = require('fs');

// 1. existing 207 words
const ctx = {};
new Function(fs.readFileSync('js/data/dictionary.js','utf8') + ';this.D=DICTIONARY;this.C=DICT_CATEGORIES;').call(ctx);
const words = ctx.D.map(d => ({ ...d }));
const seen = new Set(words.map(d => d.w.toLowerCase()));

// 2. new words from the pipe files
for (const f of ['_words1.txt','_words2.txt','_words3.txt']) {
  for (const line of fs.readFileSync(f,'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [w, ar, cat, g, ex, exAr] = line.split('|');
    if (!w || !ar || !cat) { console.error('BAD LINE:', line); continue; }
    if (seen.has(w.toLowerCase())) { console.error('DUPLICATE skipped:', w); continue; }
    seen.add(w.toLowerCase());
    words.push({ w: w.trim(), ar: ar.trim(), cat: cat.trim(), g: (g||'').trim(),
                 ex: (ex||'').trim(), exAr: (exAr||'').trim(), ipa: '', pos: '' });
  }
}
console.log('total words:', words.length);
fs.writeFileSync('_words.json', JSON.stringify(words, null, 1));
