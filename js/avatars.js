/* ============================================================
   منارة (Manara) — صور الملف الشخصي
   ------------------------------------------------------------
   Five hand-drawn SVG characters, inline so they cost no network
   request, scale to any size, and stay crisp on retina screens.
   The stored value is just the key ('avatar-1' … 'avatar-5'),
   which is also what the server validates against.
   ============================================================ */
const AVATARS = (() => {
  /* Shared scaffolding so all five read as one family: same circular
     badge, same head geometry, only the palette and details change. */
  function frame(bg1, bg2, inner) {
    return `
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">
      <defs>
        <linearGradient id="g${bg1.slice(1)}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/>
        </linearGradient>
        <clipPath id="c${bg1.slice(1)}"><circle cx="60" cy="60" r="58"/></clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#g${bg1.slice(1)})"/>
      <g clip-path="url(#c${bg1.slice(1)})">${inner}</g>
      <circle cx="60" cy="60" r="57" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="3"/>
    </svg>`;
  }

  const eyes = (cx1, cx2, cy) => `
    <circle cx="${cx1}" cy="${cy}" r="4.2" fill="#2b2b3a"/>
    <circle cx="${cx2}" cy="${cy}" r="4.2" fill="#2b2b3a"/>
    <circle cx="${cx1 + 1.4}" cy="${cy - 1.6}" r="1.5" fill="#fff"/>
    <circle cx="${cx2 + 1.4}" cy="${cy - 1.6}" r="1.5" fill="#fff"/>`;

  const smile = (y) => `<path d="M50 ${y} Q60 ${y + 7} 70 ${y}" stroke="#2b2b3a" stroke-width="3"
                        fill="none" stroke-linecap="round"/>`;

  const LIST = [
    {
      key: 'avatar-1',
      name: 'الطالبة النشيطة',
      art: frame('#ffd08a', '#ff9600', `
        <!-- hijab / hair -->
        <path d="M28 62c0-20 14-34 32-34s32 14 32 34c0 18-8 28-14 34H42c-6-6-14-16-14-34Z" fill="#7c4dff"/>
        <!-- face -->
        <ellipse cx="60" cy="62" rx="22" ry="24" fill="#ffdcbe"/>
        ${eyes(52, 68, 60)}
        ${smile(70)}
        <!-- cheeks -->
        <circle cx="44" cy="68" r="4.5" fill="#ff8a9b" opacity=".5"/>
        <circle cx="76" cy="68" r="4.5" fill="#ff8a9b" opacity=".5"/>
        <!-- shoulders -->
        <path d="M22 120c0-18 17-28 38-28s38 10 38 28Z" fill="#5e35b1"/>
        <path d="M60 92c-6 6-6 12 0 18 6-6 6-12 0-18Z" fill="#7c4dff"/>`)
    },
    {
      key: 'avatar-2',
      name: 'العالِم الصغير',
      art: frame('#a5e4ff', '#1cb0f6', `
        <path d="M32 58c0-16 12-28 28-28s28 12 28 28v6H32Z" fill="#3d2b1f"/>
        <ellipse cx="60" cy="64" rx="22" ry="24" fill="#f6c9a0"/>
        <!-- glasses -->
        <circle cx="51" cy="62" r="9" fill="#fff" opacity=".85" stroke="#2b2b3a" stroke-width="2.5"/>
        <circle cx="69" cy="62" r="9" fill="#fff" opacity=".85" stroke="#2b2b3a" stroke-width="2.5"/>
        <line x1="60" y1="62" x2="60" y2="62" stroke="#2b2b3a" stroke-width="2.5"/>
        <path d="M60 62h0" stroke="#2b2b3a" stroke-width="2.5"/>
        <line x1="58" y1="61" x2="62" y2="61" stroke="#2b2b3a" stroke-width="2.5"/>
        <circle cx="51" cy="62" r="3.4" fill="#2b2b3a"/>
        <circle cx="69" cy="62" r="3.4" fill="#2b2b3a"/>
        ${smile(74)}
        <path d="M22 120c0-18 17-28 38-28s38 10 38 28Z" fill="#0d9488"/>
        <path d="M52 93h16l-8 12Z" fill="#fff"/>`)
    },
    {
      key: 'avatar-3',
      name: 'المستكشف',
      art: frame('#c3f0c8', '#34c759', `
        <!-- explorer cap -->
        <path d="M30 56c0-17 13-30 30-30s30 13 30 30H30Z" fill="#e2574c"/>
        <rect x="24" y="54" width="72" height="7" rx="3.5" fill="#c1443b"/>
        <ellipse cx="60" cy="68" rx="22" ry="23" fill="#c98b5e"/>
        ${eyes(52, 68, 66)}
        ${smile(76)}
        <circle cx="44" cy="73" r="4.5" fill="#a05a34" opacity=".45"/>
        <circle cx="76" cy="73" r="4.5" fill="#a05a34" opacity=".45"/>
        <path d="M22 120c0-18 17-28 38-28s38 10 38 28Z" fill="#f5a623"/>
        <circle cx="60" cy="103" r="6" fill="#fff"/>
        <path d="M60 99v8M56 103h8" stroke="#f5a623" stroke-width="2.4" stroke-linecap="round"/>`)
    },
    {
      key: 'avatar-4',
      name: 'بطلة الرياضيات',
      art: frame('#ffc7e0', '#ff4b8b', `
        <!-- long hair behind -->
        <path d="M28 70c0-24 14-40 32-40s32 16 32 40v34H28Z" fill="#2b2b3a"/>
        <ellipse cx="60" cy="64" rx="21" ry="23" fill="#ffdcbe"/>
        <!-- fringe -->
        <path d="M39 56c4-12 13-18 21-18s17 6 21 18c-8-5-14-7-21-7s-13 2-21 7Z" fill="#2b2b3a"/>
        ${eyes(52, 68, 62)}
        ${smile(72)}
        <circle cx="43" cy="69" r="4.5" fill="#ff8a9b" opacity=".55"/>
        <circle cx="77" cy="69" r="4.5" fill="#ff8a9b" opacity=".55"/>
        <path d="M22 120c0-18 17-28 38-28s38 10 38 28Z" fill="#1cb0f6"/>
        <text x="60" y="110" font-size="15" font-weight="800" text-anchor="middle"
              fill="#fff" font-family="Nunito,sans-serif">π</text>`)
    },
    {
      key: 'avatar-5',
      name: 'منير الدلفين',
      art: frame('#bdeeff', '#29b6e8', `
        <path d="M18 84Q6 66 16 46Q32 62 44 76Z" fill="#0e7ab0"/>
        <path d="M30 78C30 44 56 22 88 22c26 0 44 16 48 40-4 22-26 36-56 38-28 2-50-8-50-22Z" fill="#29b6e8"/>
        <path d="M46 82c6-16 28-26 54-24 20 2 32 12 36 20-14 12-40 18-64 16-16-2-24-6-26-12Z" fill="#eaf9ff"/>
        <path d="M78 24Q88 -2 106 14Q94 24 84 32Z" fill="#1a90c2"/>
        <circle cx="96" cy="54" r="12" fill="#fff"/>
        <circle cx="99" cy="56" r="5.6" fill="#123"/>
        <circle cx="101" cy="53" r="2" fill="#fff"/>
        <path d="M124 66Q138 70 136 78Q122 82 112 78Z" fill="#1a90c2"/>
        <circle cx="40" cy="40" r="3" fill="#eaf9ff"/>
        <circle cx="54" cy="30" r="2" fill="#eaf9ff"/>`)
    },
  ];

  const byKey = Object.fromEntries(LIST.map(a => [a.key, a]));
  const DEFAULT_KEY = 'avatar-5';

  return {
    list: LIST,
    defaultKey: DEFAULT_KEY,
    /** SVG markup for a key, falling back to the mascot avatar */
    art(key) { return (byKey[key] || byKey[DEFAULT_KEY]).art; },
    name(key) { return (byKey[key] || byKey[DEFAULT_KEY]).name; },
    isValid(key) { return !!byKey[key]; },
  };
})();
