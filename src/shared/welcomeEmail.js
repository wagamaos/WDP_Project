import { isoToDisplayDate } from './dates.js';
import { EMAIL_CONFIG, firstName, sendTemplate, siteUrl } from './email.js';

/*
 * Sign-up welcome email, sent from the browser through EmailJS.
 * The email design lives in the EmailJS template (copy kept in docs/email/welcome-template.html);
 * this file only sends the values the template fills in. Keys are in src/shared/email.js.
 */

// Resolves true when sent, false when skipped or too slow. Never blocks sign-up for long.
export function sendWelcomeEmail(user) {
  if (!user || !user.email) return Promise.resolve(false);
  return sendTemplate(EMAIL_CONFIG.welcomeTemplateId, {
    to_email: user.email,
    to_name: user.name,
    subject: `Welcome to Landed, ${firstName(user.name)}! ✈️`,
    first_name: firstName(user.name),
    university: user.university || 'your school',
    country: user.country || 'home',
    start_date: isoToDisplayDate(user.studyStartDate) || '-',
    points: '+' + (user.points != null ? user.points : 50),
    site_url: siteUrl()
  });
}
