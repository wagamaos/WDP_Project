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

  document.getElementById('signup-form').addEventListener('submit', function (event) {
    event.preventDefault();
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
      studyStartDate: form.elements.studyStartDate.value
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
