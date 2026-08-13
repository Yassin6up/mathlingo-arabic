/* ============================================================
   منارة (Manara) — القاموس المصوّر (English ⇄ العربية)
   ------------------------------------------------------------
   Every entry carries its own illustration glyph, phonetic
   transcription, Arabic meaning, and a full example sentence
   with its Arabic translation — so a word is never learned as a
   bare translation pair.

   Illustrations are drawn locally (a large glyph on a
   category-tinted card) rather than fetched: the app must keep
   working offline and on GitHub Pages, where no image API key
   can be kept secret and every remote request is a broken image
   waiting to happen.

   fields: w=word, ar=meaning, ipa=pronunciation, pos=part of
   speech, ex=example, exAr=example translation, g=illustration,
   cat=category key
   ============================================================ */

const DICT_CATEGORIES = [
  { key: 'all',        label: 'الكل',            icon: '📖', c1: '#ff9600', c2: '#ffb84d' },
  { key: 'animals',    label: 'الحيوانات',        icon: '🐾', c1: '#34c759', c2: '#8ee59f' },
  { key: 'food',       label: 'الطعام والشراب',   icon: '🍎', c1: '#ff4b4b', c2: '#ff9b8a' },
  { key: 'colors',     label: 'الألوان',          icon: '🎨', c1: '#ce82ff', c2: '#e6b8ff' },
  { key: 'numbers',    label: 'الأرقام',          icon: '🔢', c1: '#1cb0f6', c2: '#8ddcff' },
  { key: 'family',     label: 'العائلة',          icon: '👨‍👩‍👧', c1: '#ff4b8b', c2: '#ffa3c4' },
  { key: 'body',       label: 'جسم الإنسان',      icon: '🧍', c1: '#f5a623', c2: '#ffd08a' },
  { key: 'clothes',    label: 'الملابس',          icon: '👕', c1: '#0d9488', c2: '#6ed6cd' },
  { key: 'home',       label: 'البيت',            icon: '🏠', c1: '#8d6e63', c2: '#c8a99c' },
  { key: 'school',     label: 'المدرسة',          icon: '🎒', c1: '#5e35b1', c2: '#a58bdd' },
  { key: 'nature',     label: 'الطبيعة والطقس',   icon: '🌦️', c1: '#00acc1', c2: '#7fdfeb' },
  { key: 'transport',  label: 'المواصلات',        icon: '🚗', c1: '#e2574c', c2: '#f5a49d' },
  { key: 'verbs',      label: 'أفعال شائعة',      icon: '🏃', c1: '#2962ff', c2: '#8fb0ff' },
  { key: 'adjectives', label: 'الصفات',           icon: '✨', c1: '#c2185b', c2: '#f18bb2' },
  { key: 'time',       label: 'الوقت والأيام',    icon: '⏰', c1: '#6d4c41', c2: '#b79b91' },
  { key: 'jobs',       label: 'المهن',            icon: '👩‍⚕️', c1: '#00897b', c2: '#68c6bb' },
  { key: 'sports',     label: 'الرياضة',          icon: '⚽', c1: '#43a047', c2: '#93d495' },
  { key: 'places',     label: 'الأماكن',          icon: '🏙️', c1: '#3949ab', c2: '#8f9ada' },
  { key: 'tech',       label: 'التقنية',          icon: '💻', c1: '#455a64', c2: '#9aacb4' },
];

const DICTIONARY = [
  /* ---------------- الحيوانات ---------------- */
  { w: 'cat', ar: 'قِطّة', ipa: '/kæt/', pos: 'noun', g: '🐱', cat: 'animals', ex: 'The cat is sleeping on my bed.', exAr: 'القطة نائمة على سريري.' },
  { w: 'dog', ar: 'كلب', ipa: '/dɒɡ/', pos: 'noun', g: '🐶', cat: 'animals', ex: 'My dog runs very fast.', exAr: 'كلبي يجري بسرعة كبيرة.' },
  { w: 'bird', ar: 'طائر', ipa: '/bɜːd/', pos: 'noun', g: '🐦', cat: 'animals', ex: 'A small bird is singing.', exAr: 'طائر صغير يغرّد.' },
  { w: 'fish', ar: 'سمكة', ipa: '/fɪʃ/', pos: 'noun', g: '🐟', cat: 'animals', ex: 'Fish live in water.', exAr: 'الأسماك تعيش في الماء.' },
  { w: 'horse', ar: 'حصان', ipa: '/hɔːs/', pos: 'noun', g: '🐴', cat: 'animals', ex: 'The horse is very strong.', exAr: 'الحصان قويّ جدًا.' },
  { w: 'camel', ar: 'جمل', ipa: '/ˈkæməl/', pos: 'noun', g: '🐪', cat: 'animals', ex: 'A camel can walk in the desert for days.', exAr: 'يستطيع الجمل السير في الصحراء أيامًا.' },
  { w: 'lion', ar: 'أسد', ipa: '/ˈlaɪən/', pos: 'noun', g: '🦁', cat: 'animals', ex: 'The lion is the king of the jungle.', exAr: 'الأسد ملك الغابة.' },
  { w: 'elephant', ar: 'فيل', ipa: '/ˈelɪfənt/', pos: 'noun', g: '🐘', cat: 'animals', ex: 'An elephant has a long nose.', exAr: 'للفيل أنف طويل.' },
  { w: 'sheep', ar: 'خروف', ipa: '/ʃiːp/', pos: 'noun', g: '🐑', cat: 'animals', ex: 'Ten sheep are in the field.', exAr: 'عشرة خِراف في الحقل.' },
  { w: 'cow', ar: 'بقرة', ipa: '/kaʊ/', pos: 'noun', g: '🐄', cat: 'animals', ex: 'We get milk from a cow.', exAr: 'نحصل على الحليب من البقرة.' },
  { w: 'rabbit', ar: 'أرنب', ipa: '/ˈræbɪt/', pos: 'noun', g: '🐰', cat: 'animals', ex: 'The rabbit eats carrots.', exAr: 'الأرنب يأكل الجزر.' },
  { w: 'butterfly', ar: 'فراشة', ipa: '/ˈbʌtəflaɪ/', pos: 'noun', g: '🦋', cat: 'animals', ex: 'A butterfly landed on the flower.', exAr: 'حطّت فراشة على الزهرة.' },
  { w: 'bee', ar: 'نحلة', ipa: '/biː/', pos: 'noun', g: '🐝', cat: 'animals', ex: 'Bees make honey.', exAr: 'النحل يصنع العسل.' },
  { w: 'dolphin', ar: 'دلفين', ipa: '/ˈdɒlfɪn/', pos: 'noun', g: '🐬', cat: 'animals', ex: 'The dolphin is a clever animal.', exAr: 'الدلفين حيوان ذكي.' },

  /* ---------------- الطعام والشراب ---------------- */
  { w: 'bread', ar: 'خبز', ipa: '/bred/', pos: 'noun', g: '🍞', cat: 'food', ex: 'I eat bread for breakfast.', exAr: 'آكل الخبز في الفطور.' },
  { w: 'water', ar: 'ماء', ipa: '/ˈwɔːtə/', pos: 'noun', g: '💧', cat: 'food', ex: 'Please drink more water.', exAr: 'من فضلك اشرب ماءً أكثر.' },
  { w: 'milk', ar: 'حليب', ipa: '/mɪlk/', pos: 'noun', g: '🥛', cat: 'food', ex: 'She drinks milk every morning.', exAr: 'تشرب الحليب كل صباح.' },
  { w: 'apple', ar: 'تفاحة', ipa: '/ˈæpəl/', pos: 'noun', g: '🍎', cat: 'food', ex: 'An apple a day is healthy.', exAr: 'تفاحة كل يوم شيء صحّي.' },
  { w: 'banana', ar: 'موزة', ipa: '/bəˈnɑːnə/', pos: 'noun', g: '🍌', cat: 'food', ex: 'The banana is yellow.', exAr: 'الموزة صفراء.' },
  { w: 'orange', ar: 'برتقالة', ipa: '/ˈɒrɪndʒ/', pos: 'noun', g: '🍊', cat: 'food', ex: 'I like orange juice.', exAr: 'أحب عصير البرتقال.' },
  { w: 'rice', ar: 'أرز', ipa: '/raɪs/', pos: 'noun', g: '🍚', cat: 'food', ex: 'We eat rice with chicken.', exAr: 'نأكل الأرز مع الدجاج.' },
  { w: 'chicken', ar: 'دجاج', ipa: '/ˈtʃɪkɪn/', pos: 'noun', g: '🍗', cat: 'food', ex: 'My mother cooks chicken on Friday.', exAr: 'تطبخ أمي الدجاج يوم الجمعة.' },
  { w: 'egg', ar: 'بيضة', ipa: '/eɡ/', pos: 'noun', g: '🥚', cat: 'food', ex: 'I want two eggs, please.', exAr: 'أريد بيضتين من فضلك.' },
  { w: 'cheese', ar: 'جبن', ipa: '/tʃiːz/', pos: 'noun', g: '🧀', cat: 'food', ex: 'There is cheese in the sandwich.', exAr: 'يوجد جبن في الشطيرة.' },
  { w: 'tea', ar: 'شاي', ipa: '/tiː/', pos: 'noun', g: '🍵', cat: 'food', ex: 'My father drinks tea after dinner.', exAr: 'يشرب أبي الشاي بعد العشاء.' },
  { w: 'dates', ar: 'تمر', ipa: '/deɪts/', pos: 'noun', g: '🌴', cat: 'food', ex: 'We eat dates in Ramadan.', exAr: 'نأكل التمر في رمضان.' },
  { w: 'sugar', ar: 'سُكّر', ipa: '/ˈʃʊɡə/', pos: 'noun', g: '🍬', cat: 'food', ex: 'Do not put too much sugar in your tea.', exAr: 'لا تضع سكرًا كثيرًا في شايك.' },
  { w: 'soup', ar: 'شوربة', ipa: '/suːp/', pos: 'noun', g: '🍲', cat: 'food', ex: 'Hot soup is good in winter.', exAr: 'الشوربة الساخنة جيدة في الشتاء.' },

  /* ---------------- الألوان ---------------- */
  { w: 'red', ar: 'أحمر', ipa: '/red/', pos: 'adjective', g: '🟥', cat: 'colors', ex: 'My bag is red.', exAr: 'حقيبتي حمراء.' },
  { w: 'blue', ar: 'أزرق', ipa: '/bluː/', pos: 'adjective', g: '🟦', cat: 'colors', ex: 'The sky is blue today.', exAr: 'السماء زرقاء اليوم.' },
  { w: 'green', ar: 'أخضر', ipa: '/ɡriːn/', pos: 'adjective', g: '🟩', cat: 'colors', ex: 'The grass is green.', exAr: 'العشب أخضر.' },
  { w: 'yellow', ar: 'أصفر', ipa: '/ˈjeləʊ/', pos: 'adjective', g: '🟨', cat: 'colors', ex: 'The sun looks yellow.', exAr: 'تبدو الشمس صفراء.' },
  { w: 'black', ar: 'أسود', ipa: '/blæk/', pos: 'adjective', g: '⬛', cat: 'colors', ex: 'He wears black shoes.', exAr: 'يرتدي حذاءً أسود.' },
  { w: 'white', ar: 'أبيض', ipa: '/waɪt/', pos: 'adjective', g: '⬜', cat: 'colors', ex: 'Snow is white.', exAr: 'الثلج أبيض.' },
  { w: 'orange', ar: 'برتقالي (لون)', ipa: '/ˈɒrɪndʒ/', pos: 'adjective', g: '🟧', cat: 'colors', ex: 'Manara\'s colour is orange.', exAr: 'لون منارة برتقالي.' },
  { w: 'purple', ar: 'بنفسجي', ipa: '/ˈpɜːpəl/', pos: 'adjective', g: '🟪', cat: 'colors', ex: 'She has a purple pen.', exAr: 'لديها قلم بنفسجي.' },
  { w: 'brown', ar: 'بنّي', ipa: '/braʊn/', pos: 'adjective', g: '🟫', cat: 'colors', ex: 'The table is brown.', exAr: 'الطاولة بنّية.' },
  { w: 'grey', ar: 'رمادي', ipa: '/ɡreɪ/', pos: 'adjective', g: '🌫️', cat: 'colors', ex: 'The clouds are grey before rain.', exAr: 'الغيوم رمادية قبل المطر.' },
  { w: 'pink', ar: 'وردي', ipa: '/pɪŋk/', pos: 'adjective', g: '🌸', cat: 'colors', ex: 'My sister loves pink.', exAr: 'أختي تحب اللون الوردي.' },

  /* ---------------- الأرقام ---------------- */
  { w: 'one', ar: 'واحد', ipa: '/wʌn/', pos: 'number', g: '1️⃣', cat: 'numbers', ex: 'I have one brother.', exAr: 'لديّ أخ واحد.' },
  { w: 'two', ar: 'اثنان', ipa: '/tuː/', pos: 'number', g: '2️⃣', cat: 'numbers', ex: 'There are two books on the desk.', exAr: 'يوجد كتابان على المكتب.' },
  { w: 'three', ar: 'ثلاثة', ipa: '/θriː/', pos: 'number', g: '3️⃣', cat: 'numbers', ex: 'Three plus two is five.', exAr: 'ثلاثة زائد اثنين يساوي خمسة.' },
  { w: 'four', ar: 'أربعة', ipa: '/fɔː/', pos: 'number', g: '4️⃣', cat: 'numbers', ex: 'A square has four sides.', exAr: 'للمربع أربعة أضلاع.' },
  { w: 'five', ar: 'خمسة', ipa: '/faɪv/', pos: 'number', g: '5️⃣', cat: 'numbers', ex: 'My hand has five fingers.', exAr: 'في يدي خمسة أصابع.' },
  { w: 'ten', ar: 'عشرة', ipa: '/ten/', pos: 'number', g: '🔟', cat: 'numbers', ex: 'Count to ten with me.', exAr: 'عُدّ إلى عشرة معي.' },
  { w: 'twenty', ar: 'عشرون', ipa: '/ˈtwenti/', pos: 'number', g: '2️⃣0️⃣', cat: 'numbers', ex: 'Twenty students are in my class.', exAr: 'عشرون طالبًا في صفّي.' },
  { w: 'hundred', ar: 'مئة', ipa: '/ˈhʌndrəd/', pos: 'number', g: '💯', cat: 'numbers', ex: 'I got a hundred on the test.', exAr: 'حصلت على مئة في الاختبار.' },
  { w: 'first', ar: 'الأول', ipa: '/fɜːst/', pos: 'ordinal', g: '🥇', cat: 'numbers', ex: 'He is the first in his class.', exAr: 'هو الأول على صفّه.' },
  { w: 'second', ar: 'الثاني', ipa: '/ˈsekənd/', pos: 'ordinal', g: '🥈', cat: 'numbers', ex: 'This is my second book.', exAr: 'هذا كتابي الثاني.' },
  { w: 'half', ar: 'نصف', ipa: '/hɑːf/', pos: 'noun', g: '½', cat: 'numbers', ex: 'Give me half of the apple.', exAr: 'أعطني نصف التفاحة.' },

  /* ---------------- العائلة ---------------- */
  { w: 'mother', ar: 'أُمّ', ipa: '/ˈmʌðə/', pos: 'noun', g: '👩', cat: 'family', ex: 'My mother is a teacher.', exAr: 'أمي معلّمة.' },
  { w: 'father', ar: 'أب', ipa: '/ˈfɑːðə/', pos: 'noun', g: '👨', cat: 'family', ex: 'My father works in a hospital.', exAr: 'أبي يعمل في مستشفى.' },
  { w: 'brother', ar: 'أخ', ipa: '/ˈbrʌðə/', pos: 'noun', g: '👦', cat: 'family', ex: 'My brother is older than me.', exAr: 'أخي أكبر مني.' },
  { w: 'sister', ar: 'أخت', ipa: '/ˈsɪstə/', pos: 'noun', g: '👧', cat: 'family', ex: 'I play with my sister.', exAr: 'ألعب مع أختي.' },
  { w: 'grandfather', ar: 'جَدّ', ipa: '/ˈɡrænfɑːðə/', pos: 'noun', g: '👴', cat: 'family', ex: 'My grandfather tells great stories.', exAr: 'جدّي يروي قصصًا رائعة.' },
  { w: 'grandmother', ar: 'جَدّة', ipa: '/ˈɡrænmʌðə/', pos: 'noun', g: '👵', cat: 'family', ex: 'My grandmother cooks the best food.', exAr: 'جدّتي تطبخ أفضل طعام.' },
  { w: 'son', ar: 'ابن', ipa: '/sʌn/', pos: 'noun', g: '🧒', cat: 'family', ex: 'He has one son.', exAr: 'لديه ابن واحد.' },
  { w: 'daughter', ar: 'ابنة', ipa: '/ˈdɔːtə/', pos: 'noun', g: '👧', cat: 'family', ex: 'Their daughter is five years old.', exAr: 'ابنتهم عمرها خمس سنوات.' },
  { w: 'uncle', ar: 'عمّ / خال', ipa: '/ˈʌŋkəl/', pos: 'noun', g: '🧔', cat: 'family', ex: 'My uncle lives in Cairo.', exAr: 'عمّي يعيش في القاهرة.' },
  { w: 'aunt', ar: 'عمّة / خالة', ipa: '/ɑːnt/', pos: 'noun', g: '👩‍🦱', cat: 'family', ex: 'My aunt visits us every week.', exAr: 'عمّتي تزورنا كل أسبوع.' },
  { w: 'friend', ar: 'صديق', ipa: '/frend/', pos: 'noun', g: '🤝', cat: 'family', ex: 'Ali is my best friend.', exAr: 'علي أعز أصدقائي.' },
  { w: 'baby', ar: 'رضيع', ipa: '/ˈbeɪbi/', pos: 'noun', g: '👶', cat: 'family', ex: 'The baby is sleeping.', exAr: 'الرضيع نائم.' },

  /* ---------------- جسم الإنسان ---------------- */
  { w: 'head', ar: 'رأس', ipa: '/hed/', pos: 'noun', g: '🗣️', cat: 'body', ex: 'Put the hat on your head.', exAr: 'ضع القبعة على رأسك.' },
  { w: 'hand', ar: 'يد', ipa: '/hænd/', pos: 'noun', g: '✋', cat: 'body', ex: 'Raise your hand to answer.', exAr: 'ارفع يدك لتجيب.' },
  { w: 'eye', ar: 'عين', ipa: '/aɪ/', pos: 'noun', g: '👁️', cat: 'body', ex: 'She has brown eyes.', exAr: 'عيناها بنّيتان.' },
  { w: 'ear', ar: 'أذن', ipa: '/ɪə/', pos: 'noun', g: '👂', cat: 'body', ex: 'We hear with our ears.', exAr: 'نسمع بآذاننا.' },
  { w: 'nose', ar: 'أنف', ipa: '/nəʊz/', pos: 'noun', g: '👃', cat: 'body', ex: 'My nose hurts.', exAr: 'أنفي يؤلمني.' },
  { w: 'mouth', ar: 'فم', ipa: '/maʊθ/', pos: 'noun', g: '👄', cat: 'body', ex: 'Open your mouth, please.', exAr: 'افتح فمك من فضلك.' },
  { w: 'foot', ar: 'قدم', ipa: '/fʊt/', pos: 'noun', g: '🦶', cat: 'body', ex: 'My left foot hurts.', exAr: 'قدمي اليسرى تؤلمني.' },
  { w: 'hair', ar: 'شَعر', ipa: '/heə/', pos: 'noun', g: '💇', cat: 'body', ex: 'Her hair is long and black.', exAr: 'شعرها طويل وأسود.' },
  { w: 'heart', ar: 'قلب', ipa: '/hɑːt/', pos: 'noun', g: '❤️', cat: 'body', ex: 'Sport is good for your heart.', exAr: 'الرياضة مفيدة لقلبك.' },
  { w: 'tooth', ar: 'سِنّ', ipa: '/tuːθ/', pos: 'noun', g: '🦷', cat: 'body', ex: 'Brush your teeth twice a day.', exAr: 'نظّف أسنانك مرتين يوميًا.' },

  /* ---------------- الملابس ---------------- */
  { w: 'shirt', ar: 'قميص', ipa: '/ʃɜːt/', pos: 'noun', g: '👕', cat: 'clothes', ex: 'He is wearing a white shirt.', exAr: 'يرتدي قميصًا أبيض.' },
  { w: 'trousers', ar: 'بنطال', ipa: '/ˈtraʊzəz/', pos: 'noun', g: '👖', cat: 'clothes', ex: 'These trousers are too long.', exAr: 'هذا البنطال طويل جدًا.' },
  { w: 'shoes', ar: 'حذاء', ipa: '/ʃuːz/', pos: 'noun', g: '👟', cat: 'clothes', ex: 'Take off your shoes at the door.', exAr: 'اخلع حذاءك عند الباب.' },
  { w: 'dress', ar: 'فستان', ipa: '/dres/', pos: 'noun', g: '👗', cat: 'clothes', ex: 'She bought a new dress.', exAr: 'اشترت فستانًا جديدًا.' },
  { w: 'hat', ar: 'قبعة', ipa: '/hæt/', pos: 'noun', g: '🧢', cat: 'clothes', ex: 'Wear a hat in the sun.', exAr: 'ارتدِ قبعة تحت الشمس.' },
  { w: 'coat', ar: 'معطف', ipa: '/kəʊt/', pos: 'noun', g: '🧥', cat: 'clothes', ex: 'Take your coat, it is cold.', exAr: 'خذ معطفك، الجو بارد.' },
  { w: 'socks', ar: 'جوارب', ipa: '/sɒks/', pos: 'noun', g: '🧦', cat: 'clothes', ex: 'My socks are blue.', exAr: 'جواربي زرقاء.' },
  { w: 'scarf', ar: 'وشاح', ipa: '/skɑːf/', pos: 'noun', g: '🧣', cat: 'clothes', ex: 'She wears a red scarf.', exAr: 'ترتدي وشاحًا أحمر.' },
  { w: 'glasses', ar: 'نظّارة', ipa: '/ˈɡlɑːsɪz/', pos: 'noun', g: '👓', cat: 'clothes', ex: 'I need my glasses to read.', exAr: 'أحتاج نظارتي للقراءة.' },
  { w: 'watch', ar: 'ساعة يد', ipa: '/wɒtʃ/', pos: 'noun', g: '⌚', cat: 'clothes', ex: 'My watch is broken.', exAr: 'ساعتي مكسورة.' },

  /* ---------------- البيت ---------------- */
  { w: 'house', ar: 'منزل', ipa: '/haʊs/', pos: 'noun', g: '🏠', cat: 'home', ex: 'Our house has a garden.', exAr: 'منزلنا فيه حديقة.' },
  { w: 'door', ar: 'باب', ipa: '/dɔː/', pos: 'noun', g: '🚪', cat: 'home', ex: 'Please close the door.', exAr: 'من فضلك أغلق الباب.' },
  { w: 'window', ar: 'نافذة', ipa: '/ˈwɪndəʊ/', pos: 'noun', g: '🪟', cat: 'home', ex: 'Open the window for fresh air.', exAr: 'افتح النافذة لهواء منعش.' },
  { w: 'table', ar: 'طاولة', ipa: '/ˈteɪbəl/', pos: 'noun', g: '🪑', cat: 'home', ex: 'The food is on the table.', exAr: 'الطعام على الطاولة.' },
  { w: 'chair', ar: 'كرسي', ipa: '/tʃeə/', pos: 'noun', g: '💺', cat: 'home', ex: 'Sit on this chair.', exAr: 'اجلس على هذا الكرسي.' },
  { w: 'bed', ar: 'سرير', ipa: '/bed/', pos: 'noun', g: '🛏️', cat: 'home', ex: 'I go to bed at ten.', exAr: 'أذهب إلى السرير في العاشرة.' },
  { w: 'kitchen', ar: 'مطبخ', ipa: '/ˈkɪtʃɪn/', pos: 'noun', g: '🍳', cat: 'home', ex: 'Mum is in the kitchen.', exAr: 'أمي في المطبخ.' },
  { w: 'room', ar: 'غرفة', ipa: '/ruːm/', pos: 'noun', g: '🛋️', cat: 'home', ex: 'My room is small but clean.', exAr: 'غرفتي صغيرة لكنها نظيفة.' },
  { w: 'key', ar: 'مفتاح', ipa: '/kiː/', pos: 'noun', g: '🔑', cat: 'home', ex: 'Where is the key?', exAr: 'أين المفتاح؟' },
  { w: 'lamp', ar: 'مصباح', ipa: '/læmp/', pos: 'noun', g: '💡', cat: 'home', ex: 'Turn on the lamp, please.', exAr: 'أشعل المصباح من فضلك.' },
  { w: 'garden', ar: 'حديقة', ipa: '/ˈɡɑːdən/', pos: 'noun', g: '🌷', cat: 'home', ex: 'We play in the garden.', exAr: 'نلعب في الحديقة.' },

  /* ---------------- المدرسة ---------------- */
  { w: 'school', ar: 'مدرسة', ipa: '/skuːl/', pos: 'noun', g: '🏫', cat: 'school', ex: 'I go to school at seven.', exAr: 'أذهب إلى المدرسة في السابعة.' },
  { w: 'teacher', ar: 'معلّم', ipa: '/ˈtiːtʃə/', pos: 'noun', g: '👩‍🏫', cat: 'school', ex: 'Our teacher is very kind.', exAr: 'معلّمتنا لطيفة جدًا.' },
  { w: 'student', ar: 'طالب', ipa: '/ˈstjuːdənt/', pos: 'noun', g: '🧑‍🎓', cat: 'school', ex: 'I am a student in grade six.', exAr: 'أنا طالب في الصف السادس.' },
  { w: 'book', ar: 'كتاب', ipa: '/bʊk/', pos: 'noun', g: '📕', cat: 'school', ex: 'This book is interesting.', exAr: 'هذا الكتاب ممتع.' },
  { w: 'pen', ar: 'قلم حبر', ipa: '/pen/', pos: 'noun', g: '🖊️', cat: 'school', ex: 'Can I borrow your pen?', exAr: 'هل يمكنني استعارة قلمك؟' },
  { w: 'pencil', ar: 'قلم رصاص', ipa: '/ˈpensəl/', pos: 'noun', g: '✏️', cat: 'school', ex: 'Draw with a pencil first.', exAr: 'ارسم بقلم الرصاص أولًا.' },
  { w: 'notebook', ar: 'دفتر', ipa: '/ˈnəʊtbʊk/', pos: 'noun', g: '📓', cat: 'school', ex: 'Write it in your notebook.', exAr: 'اكتبها في دفترك.' },
  { w: 'bag', ar: 'حقيبة', ipa: '/bæɡ/', pos: 'noun', g: '🎒', cat: 'school', ex: 'My bag is very heavy.', exAr: 'حقيبتي ثقيلة جدًا.' },
  { w: 'lesson', ar: 'درس', ipa: '/ˈlesən/', pos: 'noun', g: '📖', cat: 'school', ex: 'Today\'s lesson is about fractions.', exAr: 'درس اليوم عن الكسور.' },
  { w: 'homework', ar: 'واجب منزلي', ipa: '/ˈhəʊmwɜːk/', pos: 'noun', g: '📝', cat: 'school', ex: 'I finished my homework.', exAr: 'أنهيت واجبي المنزلي.' },
  { w: 'exam', ar: 'امتحان', ipa: '/ɪɡˈzæm/', pos: 'noun', g: '🧾', cat: 'school', ex: 'The exam is next Sunday.', exAr: 'الامتحان يوم الأحد القادم.' },
  { w: 'answer', ar: 'إجابة', ipa: '/ˈɑːnsə/', pos: 'noun', g: '✅', cat: 'school', ex: 'Your answer is correct.', exAr: 'إجابتك صحيحة.' },
  { w: 'question', ar: 'سؤال', ipa: '/ˈkwestʃən/', pos: 'noun', g: '❓', cat: 'school', ex: 'I have a question, teacher.', exAr: 'لديّ سؤال يا أستاذ.' },

  /* ---------------- الطبيعة والطقس ---------------- */
  { w: 'sun', ar: 'شمس', ipa: '/sʌn/', pos: 'noun', g: '☀️', cat: 'nature', ex: 'The sun rises in the east.', exAr: 'تشرق الشمس من الشرق.' },
  { w: 'moon', ar: 'قمر', ipa: '/muːn/', pos: 'noun', g: '🌙', cat: 'nature', ex: 'The moon is bright tonight.', exAr: 'القمر منير الليلة.' },
  { w: 'star', ar: 'نجمة', ipa: '/stɑː/', pos: 'noun', g: '⭐', cat: 'nature', ex: 'I can see many stars.', exAr: 'أستطيع رؤية نجوم كثيرة.' },
  { w: 'rain', ar: 'مطر', ipa: '/reɪn/', pos: 'noun', g: '🌧️', cat: 'nature', ex: 'The rain stopped an hour ago.', exAr: 'توقّف المطر قبل ساعة.' },
  { w: 'snow', ar: 'ثلج', ipa: '/snəʊ/', pos: 'noun', g: '❄️', cat: 'nature', ex: 'Children love the snow.', exAr: 'يحب الأطفال الثلج.' },
  { w: 'wind', ar: 'رياح', ipa: '/wɪnd/', pos: 'noun', g: '🌬️', cat: 'nature', ex: 'The wind is strong today.', exAr: 'الرياح قوية اليوم.' },
  { w: 'tree', ar: 'شجرة', ipa: '/triː/', pos: 'noun', g: '🌳', cat: 'nature', ex: 'A big tree gives shade.', exAr: 'الشجرة الكبيرة تعطي ظلًا.' },
  { w: 'flower', ar: 'زهرة', ipa: '/ˈflaʊə/', pos: 'noun', g: '🌺', cat: 'nature', ex: 'This flower smells lovely.', exAr: 'رائحة هذه الزهرة جميلة.' },
  { w: 'sea', ar: 'بحر', ipa: '/siː/', pos: 'noun', g: '🌊', cat: 'nature', ex: 'We swim in the sea in summer.', exAr: 'نسبح في البحر في الصيف.' },
  { w: 'mountain', ar: 'جبل', ipa: '/ˈmaʊntɪn/', pos: 'noun', g: '⛰️', cat: 'nature', ex: 'That mountain is very high.', exAr: 'ذلك الجبل عالٍ جدًا.' },
  { w: 'desert', ar: 'صحراء', ipa: '/ˈdezət/', pos: 'noun', g: '🏜️', cat: 'nature', ex: 'The desert is hot in the day.', exAr: 'الصحراء حارة في النهار.' },
  { w: 'sky', ar: 'سماء', ipa: '/skaɪ/', pos: 'noun', g: '🌤️', cat: 'nature', ex: 'There are no clouds in the sky.', exAr: 'لا توجد غيوم في السماء.' },
  { w: 'fire', ar: 'نار', ipa: '/ˈfaɪə/', pos: 'noun', g: '🔥', cat: 'nature', ex: 'Do not touch the fire.', exAr: 'لا تلمس النار.' },

  /* ---------------- المواصلات ---------------- */
  { w: 'car', ar: 'سيارة', ipa: '/kɑː/', pos: 'noun', g: '🚗', cat: 'transport', ex: 'My father drives a small car.', exAr: 'يقود أبي سيارة صغيرة.' },
  { w: 'bus', ar: 'حافلة', ipa: '/bʌs/', pos: 'noun', g: '🚌', cat: 'transport', ex: 'I take the bus to school.', exAr: 'أستقل الحافلة إلى المدرسة.' },
  { w: 'train', ar: 'قطار', ipa: '/treɪn/', pos: 'noun', g: '🚆', cat: 'transport', ex: 'The train leaves at eight.', exAr: 'يغادر القطار في الثامنة.' },
  { w: 'plane', ar: 'طائرة', ipa: '/pleɪn/', pos: 'noun', g: '✈️', cat: 'transport', ex: 'The plane is in the sky.', exAr: 'الطائرة في السماء.' },
  { w: 'bicycle', ar: 'دراجة', ipa: '/ˈbaɪsɪkəl/', pos: 'noun', g: '🚲', cat: 'transport', ex: 'I ride my bicycle every day.', exAr: 'أركب دراجتي كل يوم.' },
  { w: 'boat', ar: 'قارب', ipa: '/bəʊt/', pos: 'noun', g: '⛵', cat: 'transport', ex: 'The boat is on the water.', exAr: 'القارب على الماء.' },
  { w: 'road', ar: 'طريق', ipa: '/rəʊd/', pos: 'noun', g: '🛣️', cat: 'transport', ex: 'Cross the road carefully.', exAr: 'اعبر الطريق بحذر.' },
  { w: 'ticket', ar: 'تذكرة', ipa: '/ˈtɪkɪt/', pos: 'noun', g: '🎫', cat: 'transport', ex: 'I bought two tickets.', exAr: 'اشتريت تذكرتين.' },

  /* ---------------- أفعال شائعة ---------------- */
  { w: 'go', ar: 'يذهب', ipa: '/ɡəʊ/', pos: 'verb', g: '🚶', cat: 'verbs', ex: 'I go to the park on Friday.', exAr: 'أذهب إلى الحديقة يوم الجمعة.' },
  { w: 'come', ar: 'يأتي', ipa: '/kʌm/', pos: 'verb', g: '🙋', cat: 'verbs', ex: 'Please come here.', exAr: 'تعال هنا من فضلك.' },
  { w: 'eat', ar: 'يأكل', ipa: '/iːt/', pos: 'verb', g: '🍽️', cat: 'verbs', ex: 'We eat dinner at seven.', exAr: 'نتناول العشاء في السابعة.' },
  { w: 'drink', ar: 'يشرب', ipa: '/drɪŋk/', pos: 'verb', g: '🥤', cat: 'verbs', ex: 'Drink your milk.', exAr: 'اشرب حليبك.' },
  { w: 'read', ar: 'يقرأ', ipa: '/riːd/', pos: 'verb', g: '📚', cat: 'verbs', ex: 'She reads a book every week.', exAr: 'تقرأ كتابًا كل أسبوع.' },
  { w: 'write', ar: 'يكتب', ipa: '/raɪt/', pos: 'verb', g: '✍️', cat: 'verbs', ex: 'Write your name here.', exAr: 'اكتب اسمك هنا.' },
  { w: 'play', ar: 'يلعب', ipa: '/pleɪ/', pos: 'verb', g: '🎮', cat: 'verbs', ex: 'They play football together.', exAr: 'يلعبون كرة القدم معًا.' },
  { w: 'sleep', ar: 'ينام', ipa: '/sliːp/', pos: 'verb', g: '😴', cat: 'verbs', ex: 'I sleep eight hours.', exAr: 'أنام ثماني ساعات.' },
  { w: 'run', ar: 'يجري', ipa: '/rʌn/', pos: 'verb', g: '🏃', cat: 'verbs', ex: 'He runs in the morning.', exAr: 'يجري في الصباح.' },
  { w: 'speak', ar: 'يتكلّم', ipa: '/spiːk/', pos: 'verb', g: '💬', cat: 'verbs', ex: 'I speak Arabic and English.', exAr: 'أتكلم العربية والإنجليزية.' },
  { w: 'listen', ar: 'يستمع', ipa: '/ˈlɪsən/', pos: 'verb', g: '🎧', cat: 'verbs', ex: 'Listen to the teacher.', exAr: 'استمع إلى المعلّم.' },
  { w: 'learn', ar: 'يتعلّم', ipa: '/lɜːn/', pos: 'verb', g: '🧠', cat: 'verbs', ex: 'We learn something new every day.', exAr: 'نتعلم شيئًا جديدًا كل يوم.' },
  { w: 'help', ar: 'يساعد', ipa: '/help/', pos: 'verb', g: '🆘', cat: 'verbs', ex: 'Can you help me, please?', exAr: 'هل يمكنك مساعدتي من فضلك؟' },
  { w: 'buy', ar: 'يشتري', ipa: '/baɪ/', pos: 'verb', g: '🛒', cat: 'verbs', ex: 'I want to buy some bread.', exAr: 'أريد شراء بعض الخبز.' },
  { w: 'open', ar: 'يفتح', ipa: '/ˈəʊpən/', pos: 'verb', g: '🔓', cat: 'verbs', ex: 'Open your books on page ten.', exAr: 'افتحوا كتبكم على الصفحة عشرة.' },
  { w: 'close', ar: 'يُغلق', ipa: '/kləʊz/', pos: 'verb', g: '🔒', cat: 'verbs', ex: 'Close the window, please.', exAr: 'أغلق النافذة من فضلك.' },
  { w: 'give', ar: 'يعطي', ipa: '/ɡɪv/', pos: 'verb', g: '🎁', cat: 'verbs', ex: 'Give me the book, please.', exAr: 'أعطني الكتاب من فضلك.' },
  { w: 'work', ar: 'يعمل', ipa: '/wɜːk/', pos: 'verb', g: '🛠️', cat: 'verbs', ex: 'My mother works in a school.', exAr: 'تعمل أمي في مدرسة.' },

  /* ---------------- الصفات ---------------- */
  { w: 'big', ar: 'كبير', ipa: '/bɪɡ/', pos: 'adjective', g: '🐘', cat: 'adjectives', ex: 'This is a big house.', exAr: 'هذا منزل كبير.' },
  { w: 'small', ar: 'صغير', ipa: '/smɔːl/', pos: 'adjective', g: '🐜', cat: 'adjectives', ex: 'I have a small cat.', exAr: 'لديّ قطة صغيرة.' },
  { w: 'happy', ar: 'سعيد', ipa: '/ˈhæpi/', pos: 'adjective', g: '😄', cat: 'adjectives', ex: 'I am happy today.', exAr: 'أنا سعيد اليوم.' },
  { w: 'sad', ar: 'حزين', ipa: '/sæd/', pos: 'adjective', g: '😢', cat: 'adjectives', ex: 'Why are you sad?', exAr: 'لماذا أنت حزين؟' },
  { w: 'hot', ar: 'حارّ', ipa: '/hɒt/', pos: 'adjective', g: '🥵', cat: 'adjectives', ex: 'The tea is very hot.', exAr: 'الشاي حارّ جدًا.' },
  { w: 'cold', ar: 'بارد', ipa: '/kəʊld/', pos: 'adjective', g: '🥶', cat: 'adjectives', ex: 'The water is cold.', exAr: 'الماء بارد.' },
  { w: 'fast', ar: 'سريع', ipa: '/fɑːst/', pos: 'adjective', g: '⚡', cat: 'adjectives', ex: 'That car is fast.', exAr: 'تلك السيارة سريعة.' },
  { w: 'slow', ar: 'بطيء', ipa: '/sləʊ/', pos: 'adjective', g: '🐢', cat: 'adjectives', ex: 'The turtle is slow.', exAr: 'السلحفاة بطيئة.' },
  { w: 'new', ar: 'جديد', ipa: '/njuː/', pos: 'adjective', g: '🆕', cat: 'adjectives', ex: 'I have a new bag.', exAr: 'لديّ حقيبة جديدة.' },
  { w: 'old', ar: 'قديم / كبير السن', ipa: '/əʊld/', pos: 'adjective', g: '📜', cat: 'adjectives', ex: 'This is an old book.', exAr: 'هذا كتاب قديم.' },
  { w: 'beautiful', ar: 'جميل', ipa: '/ˈbjuːtɪfəl/', pos: 'adjective', g: '🌟', cat: 'adjectives', ex: 'What a beautiful garden!', exAr: 'يا لها من حديقة جميلة!' },
  { w: 'easy', ar: 'سهل', ipa: '/ˈiːzi/', pos: 'adjective', g: '👌', cat: 'adjectives', ex: 'This question is easy.', exAr: 'هذا السؤال سهل.' },
  { w: 'difficult', ar: 'صعب', ipa: '/ˈdɪfɪkəlt/', pos: 'adjective', g: '🧗', cat: 'adjectives', ex: 'Maths is not difficult with practice.', exAr: 'الرياضيات ليست صعبة مع التدريب.' },
  { w: 'clean', ar: 'نظيف', ipa: '/kliːn/', pos: 'adjective', g: '🧼', cat: 'adjectives', ex: 'Keep your room clean.', exAr: 'حافظ على نظافة غرفتك.' },
  { w: 'strong', ar: 'قويّ', ipa: '/strɒŋ/', pos: 'adjective', g: '💪', cat: 'adjectives', ex: 'He is a strong player.', exAr: 'إنه لاعب قوي.' },

  /* ---------------- الوقت والأيام ---------------- */
  { w: 'day', ar: 'يوم', ipa: '/deɪ/', pos: 'noun', g: '📅', cat: 'time', ex: 'Today is a good day.', exAr: 'اليوم يوم جميل.' },
  { w: 'night', ar: 'ليل', ipa: '/naɪt/', pos: 'noun', g: '🌃', cat: 'time', ex: 'I study at night.', exAr: 'أدرس في الليل.' },
  { w: 'morning', ar: 'صباح', ipa: '/ˈmɔːnɪŋ/', pos: 'noun', g: '🌅', cat: 'time', ex: 'Good morning, teacher!', exAr: 'صباح الخير يا أستاذ!' },
  { w: 'evening', ar: 'مساء', ipa: '/ˈiːvnɪŋ/', pos: 'noun', g: '🌇', cat: 'time', ex: 'We meet in the evening.', exAr: 'نلتقي في المساء.' },
  { w: 'week', ar: 'أسبوع', ipa: '/wiːk/', pos: 'noun', g: '🗓️', cat: 'time', ex: 'There are seven days in a week.', exAr: 'في الأسبوع سبعة أيام.' },
  { w: 'month', ar: 'شهر', ipa: '/mʌnθ/', pos: 'noun', g: '📆', cat: 'time', ex: 'Next month I will travel.', exAr: 'الشهر القادم سأسافر.' },
  { w: 'year', ar: 'سنة', ipa: '/jɪə/', pos: 'noun', g: '🎊', cat: 'time', ex: 'I am eleven years old.', exAr: 'عمري إحدى عشرة سنة.' },
  { w: 'hour', ar: 'ساعة (مدة)', ipa: '/ˈaʊə/', pos: 'noun', g: '⏳', cat: 'time', ex: 'The lesson takes one hour.', exAr: 'يستغرق الدرس ساعة واحدة.' },
  { w: 'minute', ar: 'دقيقة', ipa: '/ˈmɪnɪt/', pos: 'noun', g: '⏱️', cat: 'time', ex: 'Wait five minutes, please.', exAr: 'انتظر خمس دقائق من فضلك.' },
  { w: 'today', ar: 'اليوم', ipa: '/təˈdeɪ/', pos: 'adverb', g: '📍', cat: 'time', ex: 'Today is Sunday.', exAr: 'اليوم هو الأحد.' },
  { w: 'tomorrow', ar: 'غدًا', ipa: '/təˈmɒrəʊ/', pos: 'adverb', g: '➡️', cat: 'time', ex: 'See you tomorrow!', exAr: 'أراك غدًا!' },
  { w: 'yesterday', ar: 'أمس', ipa: '/ˈjestədeɪ/', pos: 'adverb', g: '⬅️', cat: 'time', ex: 'Yesterday was very hot.', exAr: 'كان الجو حارًا جدًا أمس.' },
  { w: 'Monday', ar: 'الإثنين', ipa: '/ˈmʌndeɪ/', pos: 'noun', g: '1️⃣', cat: 'time', ex: 'We have maths on Monday.', exAr: 'لدينا رياضيات يوم الإثنين.' },
  { w: 'Friday', ar: 'الجمعة', ipa: '/ˈfraɪdeɪ/', pos: 'noun', g: '🕌', cat: 'time', ex: 'Friday is a holiday.', exAr: 'الجمعة يوم عطلة.' },

  /* ---------------- المهن ---------------- */
  { w: 'doctor', ar: 'طبيب', ipa: '/ˈdɒktə/', pos: 'noun', g: '👨‍⚕️', cat: 'jobs', ex: 'The doctor helps sick people.', exAr: 'الطبيب يساعد المرضى.' },
  { w: 'nurse', ar: 'ممرّضة', ipa: '/nɜːs/', pos: 'noun', g: '👩‍⚕️', cat: 'jobs', ex: 'The nurse is very kind.', exAr: 'الممرّضة لطيفة جدًا.' },
  { w: 'engineer', ar: 'مهندس', ipa: '/ˌendʒɪˈnɪə/', pos: 'noun', g: '👷', cat: 'jobs', ex: 'My brother is an engineer.', exAr: 'أخي مهندس.' },
  { w: 'farmer', ar: 'مزارع', ipa: '/ˈfɑːmə/', pos: 'noun', g: '🧑‍🌾', cat: 'jobs', ex: 'The farmer works in the field.', exAr: 'المزارع يعمل في الحقل.' },
  { w: 'driver', ar: 'سائق', ipa: '/ˈdraɪvə/', pos: 'noun', g: '🚕', cat: 'jobs', ex: 'The bus driver is friendly.', exAr: 'سائق الحافلة ودود.' },
  { w: 'cook', ar: 'طبّاخ', ipa: '/kʊk/', pos: 'noun', g: '👨‍🍳', cat: 'jobs', ex: 'He is a cook in a restaurant.', exAr: 'هو طبّاخ في مطعم.' },
  { w: 'police officer', ar: 'شرطي', ipa: '/pəˈliːs ˈɒfɪsə/', pos: 'noun', g: '👮', cat: 'jobs', ex: 'Ask the police officer for help.', exAr: 'اطلب المساعدة من الشرطي.' },
  { w: 'pilot', ar: 'طيّار', ipa: '/ˈpaɪlət/', pos: 'noun', g: '🧑‍✈️', cat: 'jobs', ex: 'The pilot flies the plane.', exAr: 'الطيّار يقود الطائرة.' },
  { w: 'scientist', ar: 'عالِم', ipa: '/ˈsaɪəntɪst/', pos: 'noun', g: '🔬', cat: 'jobs', ex: 'A scientist asks many questions.', exAr: 'العالِم يطرح أسئلة كثيرة.' },

  /* ---------------- الرياضة ---------------- */
  { w: 'football', ar: 'كرة القدم', ipa: '/ˈfʊtbɔːl/', pos: 'noun', g: '⚽', cat: 'sports', ex: 'We play football after school.', exAr: 'نلعب كرة القدم بعد المدرسة.' },
  { w: 'ball', ar: 'كرة', ipa: '/bɔːl/', pos: 'noun', g: '🏀', cat: 'sports', ex: 'Throw the ball to me.', exAr: 'ارمِ الكرة إليّ.' },
  { w: 'swim', ar: 'يسبح', ipa: '/swɪm/', pos: 'verb', g: '🏊', cat: 'sports', ex: 'I can swim very well.', exAr: 'أستطيع السباحة جيدًا.' },
  { w: 'team', ar: 'فريق', ipa: '/tiːm/', pos: 'noun', g: '🧑‍🤝‍🧑', cat: 'sports', ex: 'Our team won the match.', exAr: 'فريقنا فاز بالمباراة.' },
  { w: 'win', ar: 'يفوز', ipa: '/wɪn/', pos: 'verb', g: '🏆', cat: 'sports', ex: 'I hope we win today.', exAr: 'أتمنى أن نفوز اليوم.' },
  { w: 'game', ar: 'لعبة / مباراة', ipa: '/ɡeɪm/', pos: 'noun', g: '🎯', cat: 'sports', ex: 'The game starts at five.', exAr: 'تبدأ المباراة في الخامسة.' },
  { w: 'jump', ar: 'يقفز', ipa: '/dʒʌmp/', pos: 'verb', g: '🤸', cat: 'sports', ex: 'He can jump very high.', exAr: 'يستطيع القفز عاليًا جدًا.' },

  /* ---------------- الأماكن ---------------- */
  { w: 'city', ar: 'مدينة', ipa: '/ˈsɪti/', pos: 'noun', g: '🏙️', cat: 'places', ex: 'Riyadh is a big city.', exAr: 'الرياض مدينة كبيرة.' },
  { w: 'village', ar: 'قرية', ipa: '/ˈvɪlɪdʒ/', pos: 'noun', g: '🏘️', cat: 'places', ex: 'My grandfather lives in a village.', exAr: 'جدّي يعيش في قرية.' },
  { w: 'hospital', ar: 'مستشفى', ipa: '/ˈhɒspɪtəl/', pos: 'noun', g: '🏥', cat: 'places', ex: 'The hospital is near our house.', exAr: 'المستشفى قريب من منزلنا.' },
  { w: 'market', ar: 'سوق', ipa: '/ˈmɑːkɪt/', pos: 'noun', g: '🏪', cat: 'places', ex: 'We buy fruit at the market.', exAr: 'نشتري الفاكهة من السوق.' },
  { w: 'library', ar: 'مكتبة', ipa: '/ˈlaɪbrəri/', pos: 'noun', g: '📚', cat: 'places', ex: 'Be quiet in the library.', exAr: 'كن هادئًا في المكتبة.' },
  { w: 'park', ar: 'حديقة عامة', ipa: '/pɑːk/', pos: 'noun', g: '🏞️', cat: 'places', ex: 'The park is full of children.', exAr: 'الحديقة مليئة بالأطفال.' },
  { w: 'restaurant', ar: 'مطعم', ipa: '/ˈrestrɒnt/', pos: 'noun', g: '🍴', cat: 'places', ex: 'We ate at a new restaurant.', exAr: 'أكلنا في مطعم جديد.' },
  { w: 'mosque', ar: 'مسجد', ipa: '/mɒsk/', pos: 'noun', g: '🕌', cat: 'places', ex: 'The mosque is next to the school.', exAr: 'المسجد بجانب المدرسة.' },
  { w: 'airport', ar: 'مطار', ipa: '/ˈeəpɔːt/', pos: 'noun', g: '🛫', cat: 'places', ex: 'We arrived at the airport early.', exAr: 'وصلنا إلى المطار مبكرًا.' },

  /* ---------------- التقنية ---------------- */
  { w: 'computer', ar: 'حاسوب', ipa: '/kəmˈpjuːtə/', pos: 'noun', g: '💻', cat: 'tech', ex: 'I do my homework on the computer.', exAr: 'أنجز واجبي على الحاسوب.' },
  { w: 'phone', ar: 'هاتف', ipa: '/fəʊn/', pos: 'noun', g: '📱', cat: 'tech', ex: 'My phone battery is low.', exAr: 'بطارية هاتفي منخفضة.' },
  { w: 'internet', ar: 'الإنترنت', ipa: '/ˈɪntənet/', pos: 'noun', g: '🌐', cat: 'tech', ex: 'We learn on the internet.', exAr: 'نتعلم عبر الإنترنت.' },
  { w: 'screen', ar: 'شاشة', ipa: '/skriːn/', pos: 'noun', g: '🖥️', cat: 'tech', ex: 'Look at the screen, please.', exAr: 'انظر إلى الشاشة من فضلك.' },
  { w: 'password', ar: 'كلمة المرور', ipa: '/ˈpɑːswɜːd/', pos: 'noun', g: '🔑', cat: 'tech', ex: 'Never share your password.', exAr: 'لا تشارك كلمة مرورك أبدًا.' },
  { w: 'message', ar: 'رسالة', ipa: '/ˈmesɪdʒ/', pos: 'noun', g: '✉️', cat: 'tech', ex: 'I sent you a message.', exAr: 'أرسلت لك رسالة.' },
  { w: 'camera', ar: 'كاميرا', ipa: '/ˈkæmərə/', pos: 'noun', g: '📷', cat: 'tech', ex: 'This camera takes clear photos.', exAr: 'هذه الكاميرا تلتقط صورًا واضحة.' },
  { w: 'game console', ar: 'جهاز ألعاب', ipa: '/ɡeɪm ˈkɒnsəʊl/', pos: 'noun', g: '🕹️', cat: 'tech', ex: 'He plays on his game console.', exAr: 'يلعب على جهاز الألعاب الخاص به.' },
];
