(function () {
  'use strict';

  var loginTab    = document.getElementById('tab-login');
  var signupTab   = document.getElementById('tab-signup');
  var loginPanel  = document.getElementById('panel-login');
  var signupPanel = document.getElementById('panel-signup');
  var statusEl    = document.getElementById('auth-message');

  function showMessage(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('is-error', Boolean(isError));
    statusEl.hidden = !msg;
  }

  function markError(inputEl, errorId, msg) {
    var errEl = document.getElementById(errorId);
    if (errEl) errEl.textContent = msg || '';
    if (inputEl) {
      var wrap = inputEl.closest ? inputEl.closest('.field-input-wrap') : null;
      if (wrap) wrap.classList.toggle('has-error', Boolean(msg));
      inputEl.classList.toggle('has-error', Boolean(msg));
    }
    return !msg;
  }

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach(function (el) { el.textContent = ''; });
    document.querySelectorAll('.has-error').forEach(function (el) { el.classList.remove('has-error'); });
  }

  function showPanel(showSignup) {
    loginTab.classList.toggle('active', !showSignup);
    signupTab.classList.toggle('active', showSignup);
    loginTab.setAttribute('aria-selected', String(!showSignup));
    signupTab.setAttribute('aria-selected', String(showSignup));
    loginPanel.classList.toggle('active', !showSignup);
    signupPanel.classList.toggle('active', showSignup);
    clearErrors();
    showMessage('', false);
  }

  loginTab.addEventListener('click', function () { showPanel(false); });
  signupTab.addEventListener('click', function () { showPanel(true); });
  document.getElementById('switch-to-login').addEventListener('click', function (e) {
    e.preventDefault(); showPanel(false);
  });

  /* Password show/hide */
  function wireToggle(btnId, inputId) {
    var btn = document.getElementById(btnId);
    var inp = document.getElementById(inputId);
    if (!btn || !inp) return;
    btn.addEventListener('click', function () {
      var isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    });
  }
  wireToggle('login-pw-toggle',  'login-password');
  wireToggle('signup-pw-toggle', 'signup-password');

  /* ── LOGIN ── */
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    var emailEl = document.getElementById('login-email');
    var passEl  = document.getElementById('login-password');
    var valid = true;
    if (!emailEl.value.trim()) { markError(emailEl, 'login-email-error',    'Enter your school email.'); valid = false; }
    if (!passEl.value)         { markError(passEl,  'login-password-error', 'Enter your password.');    valid = false; }
    if (!valid) return;

    var btn = document.getElementById('login-btn');
    btn.disabled = true;
    showMessage('Signing in…', false);
    window.LandedAuth.authenticate(emailEl.value.trim(), passEl.value)
      .then(function () { window.location.href = 'index.html'; })
      .catch(function (err) {
        showMessage(err.message || 'Could not sign in.', true);
        btn.disabled = false;
      });
  });

  /* ── SIGN UP ── */
  document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    var nameEl  = document.getElementById('signup-name');
    var emailEl = document.getElementById('signup-email');
    var cntryEl = document.getElementById('signup-country');
    var uniEl   = document.getElementById('signup-university');
    var typeEl  = document.getElementById('signup-student-type');
    var dateEl  = document.getElementById('signup-start-date');
    var passEl  = document.getElementById('signup-password');
    var valid   = true;

    if (nameEl.value.trim().length < 2) { markError(nameEl,  'signup-name-error',         'Full name must be at least 2 characters.'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) { markError(emailEl, 'signup-email-error', 'Enter a valid email address.'); valid = false; }
    if (!cntryEl.value.trim()) { markError(cntryEl, 'signup-country-error',       'Enter your home country.'); valid = false; }
    if (!uniEl.value)   { markError(uniEl,   'signup-university-error',    'Select your university.'); uniEl.classList.add('has-error');   valid = false; }
    if (!typeEl.value)  { markError(typeEl,  'signup-student-type-error',  'Select your student type.'); typeEl.classList.add('has-error'); valid = false; }
    if (!dateEl.value)  { markError(dateEl,  'signup-start-date-error',    'Enter your study start date.'); dateEl.classList.add('has-error'); valid = false; }
    else {
      var d = new Date(dateEl.value + 'T00:00:00');
      if (isNaN(d.getTime()) || d > new Date()) { markError(dateEl, 'signup-start-date-error', 'Start date must be today or earlier.'); valid = false; }
    }
    if (passEl.value.length < 8) { markError(passEl, 'signup-password-error', 'Password must be at least 8 characters.'); valid = false; }
    if (!valid) return;

    var btn = document.getElementById('signup-btn');
    btn.disabled = true;
    showMessage('Creating account…', false);
    window.LandedAuth.createAccount({
      name:          nameEl.value.trim(),
      email:         emailEl.value.trim(),
      country:       cntryEl.value.trim(),
      password:      passEl.value,
      university:    uniEl.value,
      studentType:   typeEl.value,
      studyStartDate: dateEl.value
    }).then(function () {
      window.location.href = 'index.html';
    }).catch(function (err) {
      showMessage(err.message || 'Could not create account.', true);
      btn.disabled = false;
    });
  });

  document.getElementById('forgot-link').addEventListener('click', function (e) {
    e.preventDefault();
    showMessage('Password reset is not available for local demo accounts.', true);
  });

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (user) window.location.replace('index.html');
  }).catch(function (err) {
    showMessage(err.message || 'Could not open the local database.', true);
  });

})();
