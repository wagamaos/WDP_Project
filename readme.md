# Landed static app

A website that helps international students settle in at universities in Korea: arrival checklist, forum, events, rewards, school and budget trackers.

The + admin password is `landed2026`.

## Running locally

Open the project with a local server (for example VS Code **Live Server**, or `npm run dev`) and go to `login.html`.
The live site on GitHub Pages works the same way, straight from the files in `main`.

## React pages (sign up, forum, rewards, events)

These pages are written in React in `src/`. Browsers cannot run that code directly, so it is pre-built into `react-dist/`, which the HTML pages load.

**After changing anything in `src/`:**

1. `npm install` (first time only)
2. `npm run build:react` (or keep `npm run watch:react` running while you work)
3. Commit the updated `react-dist/` folder together with your `src/` changes.

If you skip step 2, the site (and GitHub Pages) keeps showing the old version.

## Welcome email

New users get a welcome email after signing up. It is sent through [EmailJS](https://www.emailjs.com) from **welcome.landed@gmail.com**.

- EmailJS keys: [src/shared/welcomeEmail.js](src/shared/welcomeEmail.js)
- Email template to paste into EmailJS: [docs/email/welcome-template.html](docs/email/welcome-template.html)
- The Gmail login is **not** stored in this repository. Ask a team member for the private `CREDENTIALS.local.md` file and keep it in the project root (it is ignored by git).
