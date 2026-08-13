/* ============================================================
   منارة (Manara) — auth API client
   Talks to the existing Rased AI backend's shared User/JWT auth
   system (register/login/Google/forgot-password), tagging every
   request with X-App-Id so new users are attributed to Manara.

   Local fallback
   --------------
   The app now requires an account to be used at all. Until
   MANARA_CONFIG.API_BASE is filled in there is no server to talk
   to, so signing in would be impossible and the app unusable.
   In that case only, accounts are created and verified against
   localStorage instead. This is a development convenience, NOT
   security — anyone with devtools can read it. As soon as
   API_BASE is set, every call goes to the real server and the
   local store is ignored.
   ============================================================ */
const Auth = (() => {
  const STORAGE_KEY = 'manara-auth';
  const LOCAL_USERS_KEY = 'manara-local-users';
  let listeners = [];

  const serverConfigured = () => !!MANARA_CONFIG.API_BASE;

  function state() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }
  function setState(next) {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
    listeners.forEach(fn => { try { fn(next); } catch {} });
  }

  async function apiFetch(path, { method = 'GET', body, auth = false } = {}) {
    if (!serverConfigured()) {
      throw new Error('الخدمة غير متاحة حالياً — لم يتم إعداد الخادم بعد');
    }
    const headers = { 'Content-Type': 'application/json', 'X-App-Id': MANARA_CONFIG.APP_SLUG };
    if (auth) {
      const s = state();
      if (s?.token) headers['Authorization'] = `Bearer ${s.token}`;
    }
    let res;
    try {
      res = await fetch(MANARA_CONFIG.API_BASE + path, {
        method, headers, body: body ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error('تعذّر الاتصال بالخادم — تحقق من اتصالك بالإنترنت');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.message || 'حدث خطأ في الخادم');
    }
    return data;
  }

  /* ---------------- local (server-less) account store ---------------- */
  const Local = {
    all() {
      try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}'); }
      catch { return {}; }
    },
    saveAll(map) { localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(map)); },

    /* Not a password hash in any real sense — just avoids storing the
       password as literal plaintext in a store the user can already read. */
    scramble(password) {
      let h = 5381;
      for (let i = 0; i < password.length; i++) h = ((h << 5) + h + password.charCodeAt(i)) | 0;
      return 'lh' + (h >>> 0).toString(36);
    },

    register(name, email, password) {
      const users = Local.all();
      const key = email.toLowerCase();
      if (users[key]) throw new Error('هذا البريد مسجّل بالفعل — سجّل الدخول بدلًا من ذلك');
      if (password.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      users[key] = { id: 'local-' + Date.now(), name, email, pw: Local.scramble(password), resetCode: null };
      Local.saveAll(users);
      return { id: users[key].id, name, email };
    },

    login(email, password) {
      const rec = Local.all()[email.toLowerCase()];
      if (!rec || rec.pw !== Local.scramble(password)) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
      return { id: rec.id, name: rec.name, email: rec.email };
    },

    forgotPassword(email) {
      const users = Local.all();
      const rec = users[email.toLowerCase()];
      if (!rec) throw new Error('لا يوجد حساب بهذا البريد الإلكتروني');
      rec.resetCode = String(Math.floor(100000 + Math.random() * 900000));
      Local.saveAll(users);
      // No mail server locally, so the code is handed straight back to the UI.
      return rec.resetCode;
    },

    resetPassword(email, code, newPassword) {
      const users = Local.all();
      const rec = users[email.toLowerCase()];
      if (!rec) throw new Error('لا يوجد حساب بهذا البريد الإلكتروني');
      if (!rec.resetCode || rec.resetCode !== String(code).trim()) throw new Error('رمز التحقق غير صحيح');
      if (newPassword.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      rec.pw = Local.scramble(newPassword);
      rec.resetCode = null;
      Local.saveAll(users);
      return { id: rec.id, name: rec.name, email: rec.email };
    },

    updateName(email, name) {
      const users = Local.all();
      const rec = users[(email || '').toLowerCase()];
      if (rec) { rec.name = name; Local.saveAll(users); }
    },
  };

  return {
    /** subscribe to login/logout changes: fn(state|null) */
    onChange(fn) { listeners.push(fn); },

    /** false while MANARA_CONFIG.API_BASE is empty — accounts are local-only */
    isServerBacked() { return serverConfigured(); },

    isLoggedIn() { return !!state()?.token; },
    getUser() { return state()?.user || null; },
    getToken() { return state()?.token || null; },

    /** patch the cached user object (after a profile update) */
    updateCachedUser(patch) {
      const current = state();
      if (!current) return null;
      const user = { ...current.user, ...patch };
      setState({ ...current, user });
      if (!serverConfigured() && patch.name) Local.updateName(user.email, patch.name);
      return user;
    },

    async register(name, email, password) {
      if (!serverConfigured()) {
        const user = Local.register(name, email, password);
        setState({ token: 'local', user, local: true });
        return { user, isNewUser: true };
      }
      const { data } = await apiFetch('/api/auth/register', { method: 'POST', body: { name, email, password } });
      setState({ token: data.token, user: data.user });
      return { user: data.user, isNewUser: true }; // registration is always a brand-new account
    },

    async login(email, password) {
      if (!serverConfigured()) {
        const user = Local.login(email, password);
        setState({ token: 'local', user, local: true });
        return { user, isNewUser: false };
      }
      const { data } = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
      setState({ token: data.token, user: data.user });
      return { user: data.user, isNewUser: false };
    },

    async googleSignIn(idToken) {
      const { data } = await apiFetch('/api/auth/google-login', { method: 'POST', body: { idToken } });
      setState({ token: data.token, user: data.user });
      return { user: data.user, isNewUser: !!data.isNewUser };
    },

    /** resolves to a dev code string when running server-less, otherwise null */
    async forgotPassword(email) {
      if (!serverConfigured()) return { devCode: Local.forgotPassword(email) };
      await apiFetch('/api/auth/forgot-password', { method: 'POST', body: { email } });
      return { devCode: null };
    },

    async verifyResetCode(email, code) {
      return apiFetch('/api/auth/verify-reset-code', { method: 'POST', body: { email, code } });
    },

    async resetPassword(email, code, newPassword) {
      if (!serverConfigured()) {
        const user = Local.resetPassword(email, code, newPassword);
        setState({ token: 'local', user, local: true });
        return user;
      }
      const { data } = await apiFetch('/api/auth/reset-password', {
        method: 'POST', body: { email, code, newPassword }
      });
      setState({ token: data.token, user: data.user });
      return data.user;
    },

    async me() {
      const { data } = await apiFetch('/api/auth/me', { auth: true });
      const current = state();
      if (current) setState({ ...current, user: data.user });
      return data.user;
    },

    logout() { setState(null); }
  };
})();
