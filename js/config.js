/* ============================================================
   منارة (Manara) — shared frontend configuration
   ------------------------------------------------------------
   - API_BASE: the Rased AI server's public HTTPS base URL.
     Now that this is set, accounts, progress sync, the server
     voice and the smart re-explanation all go through the real
     backend. Emptying it drops the app back to local-only
     accounts stored in the browser (see js/auth.js).
   - GOOGLE_CLIENT_ID: a Google OAuth 2.0 Web Client ID from
     Google Cloud Console. Public/non-secret value. While it is
     empty the Google button is hidden and the login screen says
     why; email + password sign-in works either way.
   ============================================================ */
const MANARA_CONFIG = {
  API_BASE: 'https://apirasseed.thegrandminds.com',
  APP_SLUG: 'manara',
  GOOGLE_CLIENT_ID: '', // e.g. '1234567890-abc.apps.googleusercontent.com'
};
