(function () {
  'use strict';

  document.documentElement.classList.add('auth-pending');
  window.addEventListener('DOMContentLoaded', function () {
    if (!window.LandedAuth) {
      window.location.replace('login.html');
      return;
    }

    window.LandedAuth.getCurrentUser().then(function (user) {
      if (user) {
        document.documentElement.classList.remove('auth-pending');
        return;
      }
      window.location.replace('login.html');
    }).catch(function (error) {
      window.alert(error.message || 'Could not verify your account.');
      window.location.replace('login.html');
    });
  });
})();
