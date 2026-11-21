import { useEffect, useRef, useState } from 'react';
import { api } from '../shared/landed.js';
import { autoSlashDate, parseDisplayDate, todayIso } from '../shared/dates.js';
import { sendWelcomeEmail } from '../shared/welcomeEmail.js';

const UNIVERSITIES = [
  'Gachon University', 'Seoul National University', 'Korea University', 'Yonsei University',
  'Hanyang University', 'Kyung Hee University', 'Ewha Womans University',
  'Sungkyunkwan University', 'Other Korean university'
];

const EMPTY_SIGNUP = {
  name: '', email: '', country: '', university: '', studentType: '',
  startDate: '', password: '', passwordConfirm: ''
};

const icons = {
  mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
};

function Icon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{icons[name]}</svg>;
}

function FieldError({ id, message }) {
  return <span className="field-error" id={id} role="alert">{message || ''}</span>;
}

// Text/email/password input inside the bordered wrapper with an icon on the left.
function IconInput({ icon, id, error, children, ...inputProps }) {
  return (
    <div className={'field-input-wrap' + (error ? ' has-error' : '')}>
      <Icon name={icon} />
      <input
        id={id}
        className={error ? 'has-error' : undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${id}-error`}
        {...inputProps}
      />
      {children}
    </div>
  );
}

function PasswordInput({ id, value, onChange, error, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <IconInput
      icon="lock" id={id} type={visible ? 'text' : 'password'} value={value} onChange={onChange}
      error={error} placeholder={placeholder} autoComplete={autoComplete}
    >
      <button
        type="button" className="pw-toggle" tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
      >
        <Icon name="eye" />
      </button>
    </IconInput>
  );
}

function validateSignup(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = 'Full name must be at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!form.country.trim()) errors.country = 'Enter your home country.';
  if (!form.university) errors.university = 'Select your university.';
  if (!form.studentType) errors.studentType = 'Select your student type.';

  const iso = parseDisplayDate(form.startDate);
  if (!form.startDate.trim()) errors.startDate = 'Enter your study start date.';
  else if (!iso) errors.startDate = 'Enter a real date in the format dd/mm/yyyy.';
  else if (iso > todayIso()) errors.startDate = 'Start date must be today or earlier.';

  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (!form.passwordConfirm) errors.passwordConfirm = 'Re-enter your password.';
  else if (form.passwordConfirm !== form.password) errors.passwordConfirm = 'Passwords do not match.';
  return errors;
}

export default function LoginApp() {
  const [tab, setTab] = useState(() => (window.location.hash === '#signup' ? 'signup' : 'login'));
  const [message, setMessage] = useState({ text: '', isError: false });
  const [busy, setBusy] = useState(false);

  const [login, setLogin] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});

  const [signup, setSignup] = useState(EMPTY_SIGNUP);
  const [signupErrors, setSignupErrors] = useState({});
  const pickerRef = useRef(null);

  // A link to login.html#signup while already on this page only changes the hash: follow it.
  useEffect(() => {
    const onHash = () => setTab(window.location.hash === '#signup' ? 'signup' : 'login');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Already signed in? Go straight to the home page.
  useEffect(() => {
    api().getCurrentUser().then((user) => {
      if (user) window.location.replace('index.html');
    }).catch((error) => setMessage({ text: error.message || 'Could not open the local app.', isError: true }));
  }, []);

  function switchTab(next) {
    setTab(next);
    setMessage({ text: '', isError: false });
    setLoginErrors({});
    setSignupErrors({});
  }

  function updateSignup(field, value) {
    const next = { ...signup, [field]: value };
    setSignup(next);

    const updated = { ...signupErrors };
    delete updated[field];
    // Live password match check once the confirm box has something in it.
    if (field === 'password' || field === 'passwordConfirm') {
      if (next.passwordConfirm && next.passwordConfirm !== next.password) updated.passwordConfirm = 'Passwords do not match.';
      else delete updated.passwordConfirm;
    }
    setSignupErrors(updated);
  }

  function openCalendar() {
    const picker = pickerRef.current;
    picker.value = parseDisplayDate(signup.startDate) || '';
    try {
      if (typeof picker.showPicker === 'function') {
        picker.showPicker();
        return;
      }
    } catch (error) { /* fall back below */ }
    picker.focus();
    picker.click();
  }

  function handleLogin(event) {
    event.preventDefault();
    const errors = {};
    if (!login.email.trim()) errors.email = 'Enter your school email.';
    if (!login.password) errors.password = 'Enter your password.';
    setLoginErrors(errors);
    if (Object.keys(errors).length) return;

    setBusy(true);
    setMessage({ text: 'Signing in…', isError: false });
    api().authenticate(login.email.trim(), login.password)
      .then(() => { window.location.href = 'index.html'; })
      .catch((error) => {
        setMessage({ text: error.message || 'Could not sign in.', isError: true });
        setBusy(false);
      });
  }

  function handleSignup(event) {
    event.preventDefault();
    const errors = validateSignup(signup);
    setSignupErrors(errors);
    if (Object.keys(errors).length) {
      // Wait for React to paint the errors, then move focus to the first problem field.
      window.requestAnimationFrame(() => {
        const first = document.querySelector('#panel-signup [aria-invalid="true"]');
        if (first) first.focus();
      });
      return;
    }

    setBusy(true);
    setMessage({ text: 'Creating account…', isError: false });
    api().createAccount({
      name: signup.name.trim(),
      email: signup.email.trim(),
      country: signup.country.trim(),
      password: signup.password,
      university: signup.university,
      studentType: signup.studentType,
      studyStartDate: parseDisplayDate(signup.startDate)
    }).then((user) => {
      setMessage({ text: 'Account created! Sending your welcome email…', isError: false });
      // Never block sign-up on the email: go to the home page either way.
      return sendWelcomeEmail(user).catch((error) => console.warn('Welcome email was not sent:', error));
    }).then(() => {
      window.location.href = 'index.html';
    }).catch((error) => {
      setMessage({ text: error.message || 'Could not create account.', isError: true });
      setBusy(false);
    });
  }

  const isSignup = tab === 'signup';

  return (
    <>
      <div className="auth-tabs" role="tablist" aria-label="Log in or Sign up">
        <button className={'auth-tab' + (!isSignup ? ' active' : '')} id="tab-login" role="tab" type="button"
          aria-selected={!isSignup} aria-controls="panel-login" onClick={() => switchTab('login')}>Log in</button>
        <button className={'auth-tab' + (isSignup ? ' active' : '')} id="tab-signup" role="tab" type="button"
          aria-selected={isSignup} aria-controls="panel-signup" onClick={() => switchTab('signup')}>Sign up</button>
      </div>
      <p className={'auth-message' + (message.isError ? ' is-error' : '')} id="auth-message" role="status"
        aria-live="polite" hidden={!message.text}>{message.text}</p>

      {/* LOG IN */}
      <div className={'auth-panel' + (!isSignup ? ' active' : '')} id="panel-login" role="tabpanel" aria-labelledby="tab-login">
        <h1 className="auth-form-title">Welcome back</h1>
        <p className="auth-form-sub">Log in to continue your campus journey.</p>
        <p className="auth-local-note">Your account is stored only in this browser. Use a demo password, not a real password.</p>
        <form id="login-form" noValidate onSubmit={handleLogin}>
          <div className="form-field">
            <label htmlFor="login-email">School email</label>
            <IconInput icon="mail" id="login-email" type="email" name="email" placeholder="e.g. 20201234@gachon.ac.kr"
              autoComplete="email" value={login.email} error={loginErrors.email}
              onChange={(e) => { setLogin({ ...login, email: e.target.value }); setLoginErrors({ ...loginErrors, email: '' }); }} />
            <FieldError id="login-email-error" message={loginErrors.email} />
          </div>
          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <PasswordInput id="login-password" placeholder="••••••••••" autoComplete="current-password"
              value={login.password} error={loginErrors.password}
              onChange={(e) => { setLogin({ ...login, password: e.target.value }); setLoginErrors({ ...loginErrors, password: '' }); }} />
            <FieldError id="login-password-error" message={loginErrors.password} />
          </div>
          <a className="form-forgot" href="#" id="forgot-link" onClick={(e) => {
            e.preventDefault();
            setMessage({ text: 'Password reset is not available for local demo accounts.', isError: true });
          }}>Forgot password?</a>
          <button type="submit" className="btn btn-gold btn-full" id="login-btn" disabled={busy}>Log in</button>
          <p className="form-guest">Just looking? <a href="forum.html" id="guest-link">Browse the forum as a guest</a></p>
        </form>
      </div>

      {/* SIGN UP */}
      <div className={'auth-panel' + (isSignup ? ' active' : '')} id="panel-signup" role="tabpanel" aria-labelledby="tab-signup">
        <h1 className="auth-form-title">Create your account</h1>
        <p className="auth-form-sub">Start with 50 welcome points. &#127881;</p>
        <form id="signup-form" noValidate onSubmit={handleSignup}>
          <div className="form-field">
            <label htmlFor="signup-name">Full name</label>
            <IconInput icon="user" id="signup-name" name="name" placeholder="As it appears on your student ID"
              autoComplete="name" value={signup.name} error={signupErrors.name}
              onChange={(e) => updateSignup('name', e.target.value)} />
            <FieldError id="signup-name-error" message={signupErrors.name} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-email">School email</label>
            <IconInput icon="mail" id="signup-email" type="email" name="email" placeholder="e.g. 20201234@gachon.ac.kr"
              autoComplete="email" value={signup.email} error={signupErrors.email}
              onChange={(e) => updateSignup('email', e.target.value)} />
            <FieldError id="signup-email-error" message={signupErrors.email} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-country">Home country</label>
            <IconInput icon="pin" id="signup-country" name="country" placeholder="e.g. Vietnam, Malaysia, France"
              autoComplete="country-name" value={signup.country} error={signupErrors.country}
              onChange={(e) => updateSignup('country', e.target.value)} />
            <FieldError id="signup-country-error" message={signupErrors.country} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-university">School in Korea</label>
            <select id="signup-university" name="university" required value={signup.university}
              className={signupErrors.university ? 'has-error' : undefined}
              aria-invalid={signupErrors.university ? 'true' : 'false'} aria-describedby="signup-university-error"
              onChange={(e) => updateSignup('university', e.target.value)}>
              <option value="">Select your school</option>
              {UNIVERSITIES.map((name) => <option key={name}>{name}</option>)}
            </select>
            <FieldError id="signup-university-error" message={signupErrors.university} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-student-type">Student type</label>
            <select id="signup-student-type" name="studentType" required value={signup.studentType}
              className={signupErrors.studentType ? 'has-error' : undefined}
              aria-invalid={signupErrors.studentType ? 'true' : 'false'} aria-describedby="signup-student-type-error"
              onChange={(e) => updateSignup('studentType', e.target.value)}>
              <option value="">Select student type</option>
              <option value="local">Local student</option>
              <option value="exchange">Exchange student</option>
            </select>
            <FieldError id="signup-student-type-error" message={signupErrors.studentType} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-start-date">Study start date</label>
            <div className={'field-input-wrap date-picker-wrap' + (signupErrors.startDate ? ' has-error' : '')}>
              <input type="text" id="signup-start-date" name="studyStartDate" placeholder="dd/mm/yyyy"
                inputMode="numeric" maxLength={10} autoComplete="off" value={signup.startDate}
                className={signupErrors.startDate ? 'has-error' : undefined}
                aria-invalid={signupErrors.startDate ? 'true' : 'false'} aria-describedby="signup-start-date-error"
                onChange={(e) => updateSignup('startDate', autoSlashDate(e.target.value))} />
              <button type="button" className="date-picker-btn" id="signup-start-date-btn"
                aria-label="Choose study start date from calendar" onClick={openCalendar}>
                <Icon name="calendar" />
              </button>
              <input type="date" className="date-picker-native" id="signup-start-date-picker" ref={pickerRef}
                tabIndex={-1} aria-hidden="true" max={todayIso()}
                onChange={(e) => {
                  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e.target.value);
                  if (parts) updateSignup('startDate', `${parts[3]}/${parts[2]}/${parts[1]}`);
                }} />
            </div>
            <small className="auth-field-help">Type it as dd/mm/yyyy or pick from the calendar. Used to automatically unlock verification after one year.</small>
            <FieldError id="signup-start-date-error" message={signupErrors.startDate} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-password">Create password</label>
            <PasswordInput id="signup-password" placeholder="At least 8 characters" autoComplete="new-password"
              value={signup.password} error={signupErrors.password}
              onChange={(e) => updateSignup('password', e.target.value)} />
            <FieldError id="signup-password-error" message={signupErrors.password} />
          </div>
          <div className="form-field">
            <label htmlFor="signup-password-confirm">Confirm password</label>
            <PasswordInput id="signup-password-confirm" placeholder="Re-enter your password" autoComplete="new-password"
              value={signup.passwordConfirm} error={signupErrors.passwordConfirm}
              onChange={(e) => updateSignup('passwordConfirm', e.target.value)} />
            <FieldError id="signup-password-confirm-error" message={signupErrors.passwordConfirm} />
          </div>
          <button type="submit" className="btn btn-gold btn-full" id="signup-btn" disabled={busy}>Sign up and get +50 pts</button>
          <p className="form-guest">Already have an account? <a href="#" id="switch-to-login" onClick={(e) => { e.preventDefault(); switchTab('login'); }}>Log in</a></p>
        </form>
      </div>

      <p className="admin-link-row"><a href="admin.html" className="admin-link">Admin access</a></p>
    </>
  );
}
