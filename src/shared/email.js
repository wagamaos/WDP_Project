import emailjs from '@emailjs/browser';

/*
 * EmailJS setup shared by every email the app sends (https://www.emailjs.com).
 * The keys below are public by design: EmailJS checks the allowed website instead of a secret.
 *
 *  - welcomeTemplateId: the sign-up welcome email (design in docs/email/welcome-template.html)
 *  - notifyTemplateId:  one general template reused for every forum and rewards email
 *                       (design in docs/email/notification-template.html)
 *
 * An empty template ID turns that email off; the app keeps working without it.
 */
export const EMAIL_CONFIG = {
  publicKey: 'TERyXz7hOociddefA',
  serviceId: 'service_6rujp0j',
  welcomeTemplateId: 'template_clb9nte',
  notifyTemplateId: 'template_2tutwaf',
  teamEmail: 'welcome.landed@gmail.com' // where the profile page's feedback form is sent
};

const SEND_GAP_MS = 1100;   // EmailJS rejects bursts, so sends are spaced out
const SEND_TIMEOUT_MS = 6000;

let queue = Promise.resolve();
let lastSentAt = 0;

const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

// Seed/demo authors (@landed.demo) and blank addresses never get emails.
export function canEmail(address) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(address || '')) && !/@landed\.demo$/i.test(address);
}

export function isNotifyEmailOn() {
  return Boolean(EMAIL_CONFIG.publicKey && EMAIL_CONFIG.serviceId && EMAIL_CONFIG.notifyTemplateId);
}

export function siteUrl(page = 'index.html') {
  return window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + page;
}

export function firstName(name) {
  return String(name || 'there').trim().split(/\s+/)[0];
}

// Sends one email through EmailJS. Resolves true when sent, false when skipped, failed or too slow.
// It never rejects, so a failed email can never break the action that triggered it.
export function sendTemplate(templateId, params) {
  if (!EMAIL_CONFIG.publicKey || !EMAIL_CONFIG.serviceId || !templateId) {
    console.info('[Landed email] skipped, no EmailJS template set up:', params.subject || templateId);
    return Promise.resolve(false);
  }
  if (!canEmail(params.to_email)) return Promise.resolve(false);

  const job = queue
    .then(() => wait(Math.max(0, lastSentAt + SEND_GAP_MS - Date.now())))
    .then(() => {
      lastSentAt = Date.now();
      const request = emailjs.send(EMAIL_CONFIG.serviceId, templateId, params, { publicKey: EMAIL_CONFIG.publicKey })
        .then(() => true);
      const timeout = wait(SEND_TIMEOUT_MS).then(() => false);
      return Promise.race([request, timeout]);
    })
    .catch((error) => {
      console.warn('[Landed email] not sent:', params.subject, error);
      return false;
    });
  queue = job;
  return job;
}

/* ---------- Building the general notification email ---------- */

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// rows: [[label, value], ...] shown as a summary box. quote: a highlighted text snippet.
function detailsHtml({ rows = [], quote = '' }) {
  let html = '';
  if (quote) {
    html += '<div style="margin:0 0 14px 0;padding:14px 16px;background-color:#F4F7FE;border-left:4px solid #5B82E0;' +
      'border-radius:8px;font-size:15px;line-height:1.6;color:#3A4A6B;white-space:pre-wrap;">' + escapeHtml(quote) + '</div>';
  }
  if (rows.length) {
    html += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="background-color:#F4F7FE;border-radius:12px;">';
    rows.forEach(([label, value], index) => {
      const border = index ? 'border-top:1px solid #DCE5F8;' : '';
      html += '<tr>' +
        `<td style="${border}padding:11px 16px;font-size:14px;color:#5B6B8C;width:40%;">${escapeHtml(label)}</td>` +
        `<td style="${border}padding:11px 16px;font-size:14px;font-weight:700;color:#0E2466;">${escapeHtml(value)}</td>` +
        '</tr>';
    });
    html += '</table>';
  }
  return html;
}

/**
 * Sends the general notification template.
 * email: { to, toName, subject, heading, intro, rows, quote, buttonLabel, buttonPage, footer, replyTo }
 */
export function sendNotification(email) {
  return sendTemplate(EMAIL_CONFIG.notifyTemplateId, {
    to_email: email.to,
    to_name: email.toName || '',
    subject: email.subject,
    heading: email.heading,
    intro: email.intro || '',
    details_html: detailsHtml(email),
    button_label: email.buttonLabel || 'Open Landed',
    button_url: siteUrl(email.buttonPage || 'index.html'),
    footer_note: email.footer || 'You are receiving this because you have a Landed account.',
    reply_to: email.replyTo || '',
    site_url: siteUrl('index.html')
  });
}
