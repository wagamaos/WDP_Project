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
  wireToggle('signup-pw-confirm-toggle', 'signup-password-confirm');

  // Convert "dd/mm/yyyy" to "yyyy-mm-dd" (the format stored in the database).
  // Returns '' when the text is not a real calendar date.
  function parseDisplayDate(text) {
    var match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
    if (!match) return '';
    var day = Number(match[1]);
    var month = Number(match[2]);
    var year = Number(match[3]);
    var date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return '';
    return match[3] + '-' + match[2] + '-' + match[1];
  }

  var startDateInput  = document.getElementById('signup-start-date');
  var startDatePicker = document.getElementById('signup-start-date-picker');

  // Insert the slashes automatically while the user types digits.
  startDateInput.addEventListener('input', function () {
    var digits = startDateInput.value.replace(/\D/g, '').slice(0, 8);
    var formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4);
    startDateInput.value = formatted;
    markError(startDateInput, 'signup-start-date-error', '');
  });

  // Calendar button: open the browser's date picker, then show the chosen date as dd/mm/yyyy.
  var today = new Date();
  startDatePicker.max = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  document.getElementById('signup-start-date-btn').addEventListener('click', function () {
    startDatePicker.value = parseDisplayDate(startDateInput.value) || '';
    try {
      if (typeof startDatePicker.showPicker === 'function') {
        startDatePicker.showPicker();
        return;
      }
    } catch (error) { /* fall through to the older approach */ }
    startDatePicker.focus();
    startDatePicker.click();
  });

  startDatePicker.addEventListener('change', function () {
    var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDatePicker.value);
    if (!parts) return;
    startDateInput.value = parts[3] + '/' + parts[2] + '/' + parts[1];
    markError(startDateInput, 'signup-start-date-error', '');
    startDateInput.focus();
  });

  // Confirm password: show a message as soon as the two passwords differ.
  var passwordInput = document.getElementById('signup-password');
  var confirmInput  = document.getElementById('signup-password-confirm');

  function checkPasswordsMatch() {
    var message = '';
    if (!confirmInput.value) message = 'Re-enter your password.';
    else if (confirmInput.value !== passwordInput.value) message = 'Passwords do not match.';
    return markError(confirmInput, 'signup-password-confirm-error', message);
  }

  function liveCheckPasswords() {
    if (confirmInput.value) checkPasswordsMatch();
    else markError(confirmInput, 'signup-password-confirm-error', '');
  }
  passwordInput.addEventListener('input', liveCheckPasswords);
  confirmInput.addEventListener('input', liveCheckPasswords);

  document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    var nameEl  = document.getElementById('signup-name');
    var emailEl = document.getElementById('signup-email');
    var cntryEl = document.getElementById('signup-country');
    var uniEl   = document.getElementById('signup-university');
    var typeEl  = document.getElementById('signup-student-type');
    var passEl  = passwordInput;
    var valid   = true;

    if (nameEl.value.trim().length < 2) { markError(nameEl,  'signup-name-error',         'Full name must be at least 2 characters.'); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) { markError(emailEl, 'signup-email-error', 'Enter a valid email address.'); valid = false; }
    if (!cntryEl.value.trim()) { markError(cntryEl, 'signup-country-error',       'Enter your home country.'); valid = false; }
    if (!uniEl.value)   { markError(uniEl,   'signup-university-error',    'Select your university.'); uniEl.classList.add('has-error');   valid = false; }
    if (!typeEl.value)  { markError(typeEl,  'signup-student-type-error',  'Select your student type.'); typeEl.classList.add('has-error'); valid = false; }

    var isoStartDate = parseDisplayDate(startDateInput.value);
    if (!startDateInput.value.trim()) { markError(startDateInput, 'signup-start-date-error', 'Enter your study start date.'); valid = false; }
    else if (!isoStartDate) { markError(startDateInput, 'signup-start-date-error', 'Enter a real date in the format dd/mm/yyyy.'); valid = false; }
    else if (new Date(isoStartDate + 'T00:00:00') > new Date()) { markError(startDateInput, 'signup-start-date-error', 'Start date must be today or earlier.'); valid = false; }

    if (passEl.value.length < 8) { markError(passEl, 'signup-password-error', 'Password must be at least 8 characters.'); valid = false; }
    if (!checkPasswordsMatch()) valid = false;
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
      studyStartDate: isoStartDate
    }).then(function (user) {
      showMessage('Account created! Sending your welcome email…', false);
      // Never block sign-up on the email: go to the home page either way.
      if (!window.LandedWelcomeEmail) return null;
      return window.LandedWelcomeEmail.send(user).catch(function (error) {
        console.warn('Welcome email was not sent:', error);
      });
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
    showMessage(err.message || 'Could not open the local app.', true);
  });

})();
