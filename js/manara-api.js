/* ============================================================
   منارة (Manara) — progress/stats/subscription API client
   All calls require login (Auth.isLoggedIn()) — guests never
   call these; their progress stays in localStorage until they
   create an account (see syncProgress()).
   ============================================================ */
const ManaraAPI = (() => {
  async function apiFetch(path, { method = 'GET', body } = {}) {
    if (!MANARA_CONFIG.API_BASE) throw new Error('الخدمة غير متاحة حالياً');
    const token = Auth.getToken();
    if (!token) throw new Error('يجب تسجيل الدخول أولاً');

    const headers = {
      'Content-Type': 'application/json',
      'X-App-Id': MANARA_CONFIG.APP_SLUG,
      'Authorization': `Bearer ${token}`
    };
    let res;
    try {
      res = await fetch(MANARA_CONFIG.API_BASE + path, {
        method, headers, body: body ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new Error('تعذّر الاتصال بالخادم');
    }
    // A route the running server doesn't have yet (404/501) is a deployment
    // gap, not a user error — callers degrade to local-only instead of
    // showing "حدث خطأ في الخادم" for something the user can't fix.
    if (res.status === 404 || res.status === 501) {
      const err = new Error('هذه الميزة غير متاحة على الخادم بعد');
      err.notDeployed = true;
      throw err;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) throw new Error(data.message || 'حدث خطأ في الخادم');
    return data;
  }

  return {
    /** true when there is a real server + a real (non-local) session */
    available() { return !!MANARA_CONFIG.API_BASE && Auth.isServerBacked() && Auth.isLoggedIn(); },

    getStats() { return apiFetch('/api/manara/stats').then(r => r.data); },

    /** partial profile update — send only the fields that changed */
    updateProfile(patch) {
      return apiFetch('/api/manara/profile', { method: 'PATCH', body: patch }).then(r => r.data);
    },

    postProgress(attempt) {
      return apiFetch('/api/manara/progress', { method: 'POST', body: attempt }).then(r => r.data);
    },

    syncProgress(attempts) {
      return apiFetch('/api/manara/progress/sync', { method: 'POST', body: { attempts } }).then(r => r.data);
    },

    /** prices come from the server — never hardcode money in the client */
    getPlans() { return apiFetch('/api/manara/plans').then(r => r.data); },

    /** returns { checkoutUrl } — send the learner to Stripe */
    startCheckout(billingCycle, webReturnUrl) {
      return apiFetch('/api/manara/checkout', {
        method: 'POST', body: { billingCycle, webReturnUrl }
      }).then(r => r.data);
    },

    /** confirm payment after Stripe redirects back */
    verifyCheckout(sessionId) {
      return apiFetch('/api/manara/verify', { method: 'POST', body: { sessionId } }).then(r => r.data);
    },

    unsubscribe() { return apiFetch('/api/manara/unsubscribe', { method: 'POST' }).then(r => r.data); },
  };
})();
