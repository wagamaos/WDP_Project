(function () {
  'use strict';

  /*
   * Sign-up welcome email, sent from the browser through EmailJS (https://www.emailjs.com).
   *
   * Setup (one time, free plan is enough):
   *  1. Create an EmailJS account -> Email Services -> Add service (e.g. Gmail). Copy the Service ID.
   *  2. Email Templates -> Create template:
   *       To Email:  {{to_email}}
   *       From Name: Landed
   *       Subject:   {{subject}}
   *       Content:   Edit Content -> Code Editor, paste all of docs/email/welcome-template.html
   *     Save and copy the Template ID.
   *  3. Account -> General -> copy your Public Key.
   *  4. Paste the three values below.
   *
   * While the values are blank, sign-up still works; the email is just skipped.
   */
  var CONFIG = {
    publicKey: 'TERyXz7hOociddefA',
    serviceId: 'service_6rujp0j',
    templateId: 'template_clb9nte',
    siteUrl: window.location.origin + window.location.pathname.replace(/[^/]*$/, '')
  };

  var SEND_TIMEOUT_MS = 6000;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  function formatDate(isoDate) {
    var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
    return parts ? parts[3] + '/' + parts[2] + '/' + parts[1] : '';
  }

  function firstName(name) {
    return String(name || 'there').trim().split(/\s+/)[0];
  }

  function step(emoji, title, text) {
    return '' +
      '<tr><td style="padding:0 0 14px 0;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FE;border-radius:12px;">' +
          '<tr>' +
            '<td width="52" style="padding:14px 0 14px 16px;font-size:24px;vertical-align:top;">' + emoji + '</td>' +
            '<td style="padding:14px 16px 14px 8px;font-family:Arial,Helvetica,sans-serif;">' +
              '<div style="font-size:15px;font-weight:bold;color:#0E2466;">' + title + '</div>' +
              '<div style="font-size:14px;line-height:1.5;color:#4a5b78;margin-top:2px;">' + text + '</div>' +
            '</td>' +
          '</tr>' +
        '</table>' +
      '</td></tr>';
  }

  function buildHtml(user) {
    var name = escapeHtml(firstName(user.name));
    var school = escapeHtml(user.university || 'your school');
    var country = escapeHtml(user.country || '');
    var startDate = escapeHtml(formatDate(user.studyStartDate));
    var siteUrl = escapeHtml(CONFIG.siteUrl);
    var points = escapeHtml(user.points != null ? user.points : 50);

    return '' +
      '<div style="margin:0;padding:0;background:#F4F7FE;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FE;padding:24px 12px;">' +
      '<tr><td align="center">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(11,42,91,.08);">' +

        // Header
        '<tr><td style="background:#1B44B8;padding:36px 32px 30px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;">' +
          '<div style="font-size:13px;letter-spacing:3px;color:#F5B73B;font-weight:bold;">LANDED</div>' +
          '<div style="font-size:44px;line-height:1;margin:18px 0 10px 0;">&#9992;&#65039;</div>' +
          '<div style="font-size:26px;font-weight:bold;color:#ffffff;">Welcome aboard, ' + name + '!</div>' +
          '<div style="font-size:15px;color:#c9d6ee;margin-top:8px;line-height:1.5;">You have officially landed. We are so glad you are here.</div>' +
        '</td></tr>' +

        // Points badge
        '<tr><td align="center" style="padding:26px 32px 6px 32px;">' +
          '<table role="presentation" cellpadding="0" cellspacing="0" style="background:#FFF1CF;border:2px solid #F5B73B;border-radius:999px;">' +
            '<tr><td style="padding:10px 22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#8a5a00;">' +
              '&#127881; +' + points + ' welcome points are already in your account' +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +

        // Intro
        '<tr><td style="padding:18px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#2c3a55;">' +
          'Starting life at <strong>' + school + '</strong>' + (country ? ' all the way from <strong>' + country + '</strong>' : '') +
          ' is a big step, and you do not have to figure it all out alone. Landed is here to help you settle in, ' +
          'find your people, and have fun while you do it.' +
        '</td></tr>' +

        // Steps
        '<tr><td style="padding:16px 32px 4px 32px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;color:#7a8aa8;">A FEW THINGS TO TRY FIRST</td></tr>' +
        '<tr><td style="padding:10px 32px 6px 32px;">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
            step('&#9989;', 'Tick off your arrival checklist', 'Bank account, phone plan, ARC and more, one step at a time.') +
            step('&#128172;', 'Say hello in the forum', 'Ask anything about housing, visas, food or study. Helpful answers earn points.') +
            step('&#127873;', 'Collect points, claim rewards', 'Trade your points for treats from home, donated by the community.') +
          '</table>' +
        '</td></tr>' +

        // Button
        '<tr><td align="center" style="padding:14px 32px 10px 32px;">' +
          '<a href="' + siteUrl + 'index.html" style="display:inline-block;background:#F5B73B;color:#0E2466;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 34px;border-radius:999px;">Start exploring Landed &rarr;</a>' +
        '</td></tr>' +

        // Account summary
        '<tr><td style="padding:22px 32px 6px 32px;">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e3e9f3;">' +
            '<tr><td style="padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:#7a8aa8;">' +
              '<strong style="color:#4a5b78;">Your account</strong><br>' +
              'Email: ' + escapeHtml(user.email) + '<br>' +
              'School: ' + school + '<br>' +
              (startDate ? 'Study start date: ' + startDate : '') +
            '</td></tr>' +
          '</table>' +
        '</td></tr>' +

        // Footer
        '<tr><td style="padding:22px 32px 30px 32px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#2c3a55;">' +
          'Welcome to the community. We cannot wait to see you around!<br><br>' +
          'Warmly,<br><strong>The Landed team</strong> &#128153;' +
        '</td></tr>' +
        '<tr><td style="background:#F4F7FE;padding:16px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#97a3ba;">' +
          'You are receiving this because you just created a Landed account. If this was not you, you can ignore this email.' +
        '</td></tr>' +

      '</table>' +
      '</td></tr></table>' +
      '</div>';
  }

  function isConfigured() {
    return Boolean(CONFIG.publicKey && CONFIG.serviceId && CONFIG.templateId && window.emailjs);
  }

  function send(user) {
    if (!user || !user.email) return Promise.resolve(false);
    if (!isConfigured()) {
      console.info('Welcome email skipped: add your EmailJS keys in js/welcome-email.js.');
      return Promise.resolve(false);
    }

    var request = window.emailjs.send(CONFIG.serviceId, CONFIG.templateId, {
      to_email: user.email,
      to_name: user.name,
      subject: 'Welcome to Landed, ' + firstName(user.name) + '! ✈️',
      // Values used by the EmailJS template in docs/email/welcome-template.html
      first_name: firstName(user.name),
      university: user.university || 'your school',
      country: user.country || 'home',
      start_date: formatDate(user.studyStartDate) || '-',
      points: '+' + (user.points != null ? user.points : 50),
      site_url: CONFIG.siteUrl + 'index.html',
      // Alternative: a template whose content is only {{{message_html}}} uses this ready-made version.
      message_html: buildHtml(user)
    }, { publicKey: CONFIG.publicKey });

    // Do not keep the user waiting on the sign-up page if the email service is slow.
    var timeout = new Promise(function (resolve) {
      window.setTimeout(function () { resolve(false); }, SEND_TIMEOUT_MS);
    });

    return Promise.race([request.then(function () { return true; }), timeout]);
  }

  window.LandedWelcomeEmail = {
    send: send,
    buildHtml: buildHtml
  };
})();
