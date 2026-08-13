/* ============================================================
   منارة (Manara) — shared frontend configuration
   ------------------------------------------------------------
   - API_BASE: the Rased AI server's public HTTPS base URL.
     Now that this is set, accounts, progress sync, the server
     voice and the smart re-explanation all go through the real
     backend. Emptying it drops the app back to local-only
     accounts stored in the browser (see js/auth.js).
   - GOOGLE_CLIENT_ID: a Google OAuth 2.0 Web Client ID. Public by
     design — it ships in the page source of every site that uses
     Google sign-in. The client *secret* is a different value and
     must never appear here: this flow doesn't use one, because
     Google Identity Services hands an ID token to the browser and
     the Rased server verifies it with verifyIdToken().

     Requires, in Google Cloud Console → Clients:
       Authorized JavaScript origins:
         https://yassin6up.github.io
         http://localhost:4215        (local development)
       Authorized redirect URIs: none — the GSI button uses a
         popup and never redirects.

     The same id must also be set as GOOGLE_OAUTH_CLIENT_ID in the
     Rased server's .env, or google-login answers 501.
   ============================================================ */
const MANARA_CONFIG = {
  API_BASE: 'https://apirasseed.thegrandminds.com',
  APP_SLUG: 'manara',
  GOOGLE_CLIENT_ID: '114545674322-tcn0u8c0ugn7mme6unandptfbo13fr47.apps.googleusercontent.com',
};
