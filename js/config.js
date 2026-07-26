/* ============================================================
   منارة (Manara) — shared frontend configuration
   ------------------------------------------------------------
   TODO before go-live: fill in the two values below.
   - API_BASE: the Rased AI server's public HTTPS base URL
     (e.g. "https://api.example.com"). Leave empty during local
     development — every API call degrades gracefully (auth
     screens show a clear error, guest mode / local voice /
     built-in explanations keep working).
   - GOOGLE_CLIENT_ID: a Google OAuth 2.0 Web Client ID from
     Google Cloud Console. Public/non-secret value.
   ============================================================ */
const MANARA_CONFIG = {
  API_BASE: '', // e.g. 'https://api.rased.ai'
  APP_SLUG: 'manara',
  GOOGLE_CLIENT_ID: '', // e.g. '1234567890-abc.apps.googleusercontent.com'
};
