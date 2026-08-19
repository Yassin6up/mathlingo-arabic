const fs = require('fs');
const words = JSON.parse(fs.readFileSync('_words.json','utf8'));
// The API has no entries for weekday/month/festival proper nouns — written by hand.
const MANUAL = {
  'Sunday':   ['/ˈsʌndeɪ/','noun','The first day of the week in many Arab countries, and the day school often begins.'],
  'Monday':   ['/ˈmʌndeɪ/','noun','The day of the week that follows Sunday.'],
  'Tuesday':  ['/ˈtjuːzdeɪ/','noun','The day of the week that follows Monday.'],
  'Wednesday':['/ˈwenzdeɪ/','noun','The day of the week that follows Tuesday.'],
  'Thursday': ['/ˈθɜːzdeɪ/','noun','The day of the week that follows Wednesday.'],
  'Friday':   ['/ˈfraɪdeɪ/','noun','The day of the week that follows Thursday; a day of rest and prayer in Muslim countries.'],
  'Saturday': ['/ˈsætədeɪ/','noun','The day of the week that follows Friday.'],
  'January':  ['/ˈdʒænjuəri/','noun','The first month of the year, in the middle of winter.'],
  'Ramadan':  ['/ˌræməˈdɑːn/','noun','The ninth month of the Islamic calendar, during which Muslims fast from dawn until sunset.'],
  'look':     ['/lʊk/','verb','To direct your eyes towards something in order to see it.'],
  'spider':   ['/ˈspaɪdə/','noun','A small animal with eight legs that spins a web to catch insects.'],
  'zoo':      ['/zuː/','noun','A place where wild animals are kept so that people can come and see them.'],
};
let filled = 0;
for (const w of words) {
  const m = MANUAL[w.w];
  if (m && !w.def) { if (!w.ipa) w.ipa = m[0]; if (!w.pos) w.pos = m[1]; w.def = m[2]; filled++; }
}
fs.writeFileSync('_words.json', JSON.stringify(words, null, 1));
console.log('hand-filled', filled);
console.log('still missing def:', words.filter(w=>!w.def).map(w=>w.w).join(', ') || 'none');
console.log('still missing ipa:', words.filter(w=>!w.ipa).map(w=>w.w).join(', ') || 'none');
