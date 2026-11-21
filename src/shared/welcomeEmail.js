import emailjs from '@emailjs/browser';
import { isoToDisplayDate } from './dates.js';

/*
 * Sign-up welcome email, sent from the browser through EmailJS (https://www.emailjs.com).
 * The email design lives in the EmailJS template (copy kept in docs/email/welcome-template.html);
 * this file only sends the values the template fills in.
 */
const CONFIG = {
  publicKey: 'TERyXz7hOociddefA',
  serviceId: 'service_6rujp0j',
  templateId: 'template_clb9nte'
};

const SEND_TIMEOUT_MS = 6000;

function firstName(name) {
  return String(name || 'there').trim().split(/\s+/)[0];
}

function siteUrl() {
  return window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'index.html';
}

// Resolves true when sent, false when skipped or too slow. Never blocks sign-up for long.
export function sendWelcomeEmail(user) {
  if (!user || !user.email) return Promise.resolve(false);
  if (!CONFIG.publicKey || !CONFIG.serviceId || !CONFIG.templateId) {
    console.info('Welcome email skipped: EmailJS keys are missing in src/shared/welcomeEmail.js.');
    return Promise.resolve(false);
  }

  const request = emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
    to_email: user.email,
    to_name: user.name,
    subject: `Welcome to Landed, ${firstName(user.name)}! ✈️`,
    first_name: firstName(user.name),
    university: user.university || 'your school',
    country: user.country || 'home',
    start_date: isoToDisplayDate(user.studyStartDate) || '-',
    points: '+' + (user.points != null ? user.points : 50),
    site_url: siteUrl()
  }, { publicKey: CONFIG.publicKey }).then(() => true);

  const timeout = new Promise((resolve) => { window.setTimeout(() => resolve(false), SEND_TIMEOUT_MS); });
  return Promise.race([request, timeout]);
}
