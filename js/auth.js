/* ============================================================
   منارة (Manara) — auth API client
   Talks to the existing Rased AI backend's shared User/JWT auth
   system (register/login/Google/forgot-password), tagging every
   request with X-App-Id so new users are attributed to Manara.
   Works fully in guest mode when logged out — the app just
   never calls the authenticated endpoints.
   ============================================================ */
const Auth = (() => {
  const STORAGE_KEY = 'manara-auth';
  let listeners = [];

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
    if (!MANARA_CONFIG.API_BASE) {
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

  return {
    /** subscribe to login/logout changes: fn(state|null) */
    onChange(fn) { listeners.push(fn); },

    isLoggedIn() { return !!state()?.token; },
    getUser() { return state()?.user || null; },
    getToken() { return state()?.token || null; },

    async register(name, email, password) {
      const { data } = await apiFetch('/api/auth/register', { method: 'POST', body: { name, email, password } });
      setState({ token: data.token, user: data.user });
      return data.user;
    },

    async login(email, password) {
      const { data } = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
      setState({ token: data.token, user: data.user });
      return data.user;
    },

    async googleSignIn(idToken) {
      const { data } = await apiFetch('/api/auth/google-login', { method: 'POST', body: { idToken } });
      setState({ token: data.token, user: data.user });
      return data.user;
    },

    async forgotPassword(email) {
      return apiFetch('/api/auth/forgot-password', { method: 'POST', body: { email } });
    },

    async verifyResetCode(email, code) {
      return apiFetch('/api/auth/verify-reset-code', { method: 'POST', body: { email, code } });
    },

    async resetPassword(email, code, newPassword) {
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
