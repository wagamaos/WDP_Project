// Loads the existing data layer (js/auth.js sets window.LandedAuth) and the sidebar
// Log out / Log in link, so Vite bundles them into the page instead of leaving them out of the build.
import '../../js/auth.js';
import '../../js/session-nav.js';

export function api() {
  return window.LandedAuth;
}
