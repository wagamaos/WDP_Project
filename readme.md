# Landed static app

A website that helps international students settle in at universities in Korea: arrival checklist, forum, events, rewards, school and budget trackers.

The + admin password is `landed2026`.

## Running locally

Open the project with a local server (for example VS Code **Live Server**) and go to `login.html`.

## Welcome email

New users get a welcome email after signing up. It is sent through [EmailJS](https://www.emailjs.com) from **welcome.landed@gmail.com**.

- EmailJS keys: [src/shared/welcomeEmail.js](src/shared/welcomeEmail.js)
- Email template to paste into EmailJS: [docs/email/welcome-template.html](docs/email/welcome-template.html)
- The Gmail login is **not** stored in this repository. Ask a team member for the private `CREDENTIALS.local.md` file and keep it in the project root (it is ignored by git).
