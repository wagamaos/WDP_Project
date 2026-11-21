(function () {
  'use strict';

  // Puts a "Log out" link at the end of the sidebar on every page.
  // If nobody is signed in, the same spot shows "Log in" instead.
  var SESSION_KEY = 'landed-user-email';
  var nav = document.querySelector('.sidebar-nav');
  if (!nav) return;

  var signedIn = false;
  try { signedIn = Boolean(window.localStorage.getItem(SESSION_KEY)); } catch (error) { /* storage blocked */ }

  var link = document.getElementById('logout-link');
  if (!link) {
    link = document.createElement('a');
    link.id = 'logout-link';
    link.href = 'login.html';
    nav.appendChild(link);
  }

  var label = signedIn ? 'Log out' : 'Log in';
  var icon = signedIn
    ? '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'
    : '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>';
  link.setAttribute('aria-label', label);
  link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icon + '</svg><span>' + label + '</span>';

  link.addEventListener('click', function (event) {
    if (!signedIn) return; // plain link to the login page
    event.preventDefault();
    if (window.LandedAuth && typeof window.LandedAuth.logout === 'function') {
      window.LandedAuth.logout();
    } else {
      try { window.localStorage.removeItem(SESSION_KEY); } catch (error) { /* ignore */ }
    }
    window.location.href = 'login.html';
  });
})();
