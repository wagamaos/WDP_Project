(function () {
  'use strict';

  var loginTab = document.getElementById('tab-login');
  var signupTab = document.getElementById('tab-signup');
  var loginPanel = document.getElementById('panel-login');
  var signupPanel = document.getElementById('panel-signup');
  var status = document.getElementById('auth-message');

  function showMessage(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
    status.hidden = !message;
  }

  function showPanel(showSignup) {
    loginTab.classList.toggle('active', !showSignup);
    signupTab.classList.toggle('active', showSignup);
    loginTab.setAttribute('aria-selected', String(!showSignup));
    signupTab.setAttribute('aria-selected', String(showSignup));
    loginPanel.classList.toggle('active', !showSignup);
    signupPanel.classList.toggle('active', showSignup);
    showMessage('', false);
  }

  loginTab.addEventListener('click', function () { showPanel(false); });
  signupTab.addEventListener('click', function () { showPanel(true); });
  document.getElementById('switch-to-login').addEventListener('click', function (event) {
    event.preventDefault();
    showPanel(false);
  });

  document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();
    if (!this.reportValidity()) return;

    var form = this;
    var button = document.getElementById('login-btn');
    button.disabled = true;
    showMessage('Logging in...', false);

    window.LandedAuth.authenticate(
      form.elements.email.value,
      form.elements.password.value
    ).then(function () {
      window.location.href = 'index.html';
    }).catch(function (error) {
      showMessage(error.message || 'Could not log in. Please try again.', true);
      button.disabled = false;
    });
  });

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

  var startDateInput = document.getElementById('signup-start-date');

  // Insert the slashes automatically while the user types digits.
  startDateInput.addEventListener('input', function () {
    var digits = startDateInput.value.replace(/\D/g, '').slice(0, 8);
    var formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += '/' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '/' + digits.slice(4);
    startDateInput.value = formatted;
    startDateInput.setCustomValidity('');
  });

  // Calendar button: open the browser's date picker, then show the chosen date as dd/mm/yyyy.
  var startDatePicker = document.getElementById('signup-start-date-picker');
  var today = new Date();
  startDatePicker.max = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  document.getElementById('signup-start-date-btn').addEventListener('click', function () {
    // Start the calendar on whatever date is already typed in.
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
    startDateInput.setCustomValidity('');
    startDateInput.focus();
  });

  // Confirm password: show a message as soon as the two passwords differ.
  var passwordInput = document.getElementById('signup-password');
  var confirmInput = document.getElementById('signup-password-confirm');
  var confirmError = document.getElementById('signup-password-confirm-error');

  function checkPasswordsMatch(showWhileEmpty) {
    var mismatch = (confirmInput.value || showWhileEmpty) && confirmInput.value !== passwordInput.value;
    confirmInput.setCustomValidity(mismatch ? 'Passwords do not match.' : '');
    confirmError.hidden = !mismatch;
    confirmInput.closest('.field-input-wrap').classList.toggle('has-mismatch', Boolean(mismatch));
    confirmInput.setAttribute('aria-invalid', String(Boolean(mismatch)));
    return !mismatch;
  }

  passwordInput.addEventListener('input', function () { checkPasswordsMatch(false); });
  confirmInput.addEventListener('input', function () { checkPasswordsMatch(false); });

  document.getElementById('signup-form').addEventListener('submit', function (event) {
    event.preventDefault();
    checkPasswordsMatch(true);

    var isoStartDate = parseDisplayDate(startDateInput.value);
    if (!isoStartDate) {
      startDateInput.setCustomValidity('Please enter a valid date in the format dd/mm/yyyy.');
    } else if (new Date(isoStartDate + 'T00:00:00') > new Date()) {
      startDateInput.setCustomValidity('Your study start date cannot be in the future.');
    } else {
      startDateInput.setCustomValidity('');
    }
    if (!this.reportValidity()) return;

    var form = this;
    var button = document.getElementById('signup-btn');
    button.disabled = true;
    showMessage('Creating your account...', false);

    window.LandedAuth.createAccount({
      name: form.elements.name.value,
      email: form.elements.email.value,
      country: form.elements.country.value,
      password: form.elements.password.value,
      university: form.elements.university.value,
      studentType: form.elements.studentType.value,
      studyStartDate: isoStartDate
    }).then(function (user) {
      showMessage('Account created! Sending your welcome email...', false);
      // Never block sign-up on the email: go to the home page either way.
      return window.LandedWelcomeEmail.send(user).catch(function (error) {
        console.warn('Welcome email was not sent:', error);
      });
    }).then(function () {
      window.location.href = 'index.html';
    }).catch(function (error) {
      showMessage(error.message || 'Could not create your account. Please try again.', true);
      button.disabled = false;
    });
  });

  document.getElementById('forgot-link').addEventListener('click', function (event) {
    event.preventDefault();
    showMessage('Password reset is not available for local demo accounts.', true);
  });

  document.getElementById('school-sso-btn').addEventListener('click', function () {
    showMessage('School sign-in is not configured for this local demo.', true);
  });

  window.LandedAuth.getCurrentUser().then(function (user) {
    if (user) window.location.replace('index.html');
  }).catch(function (error) {
    showMessage(error.message || 'Could not open the local database.', true);
  });
})();
