(function () {
  'use strict';

  // Every page has a sidebar ".logout-link". auth.js wires it up and shows it while signed in.
  // This script makes sure the spot is never empty: guests (e.g. on the forum) see "Log in" instead.
  var nav = document.querySelector('.sidebar-nav');
  if (!nav || !window.LandedAuth) return;

  var link = nav.querySelector('.logout-link');
  if (!link) {
    // Fallback for a page whose sidebar has no link yet.
    link = document.createElement('a');
    link.href = 'login.html';
    link.className = 'logout-link';
    link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Log out</span>';
    link.addEventListener('click', function (event) {
      event.preventDefault();
      Promise.resolve(window.LandedAuth.logout()).then(function () {
        window.location.href = 'login.html';
      });
    });
    nav.appendChild(link);
  }

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (user) {
      link.hidden = false;
      return;
    }
    // Signed out: turn the slot into a plain "Log in" link.
    var plain = document.createElement('a');
    plain.href = 'login.html';
    plain.setAttribute('aria-label', 'Log in');
    plain.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Log in</span>';
    link.replaceWith(plain);
  }).catch(function () { /* leave the sidebar as it is */ });
})();
