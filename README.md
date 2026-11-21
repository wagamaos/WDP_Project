# Landed

A website that helps international students settle in at universities in Korea: arrival checklist, forum, events, rewards, school and budget trackers.

## Running locally

Open the project with a local server (for example VS Code **Live Server**) and go to `login.html`.
Opening the HTML files directly from the folder will not work, because sign-up needs `localhost` or `https`.

All data (accounts, forum posts, likes) is stored in each browser's own IndexedDB, so it is not shared between devices.

## Welcome email

New users get a welcome email after signing up. It is sent through [EmailJS](https://www.emailjs.com) from **welcome.landed@gmail.com**.

- EmailJS keys and setup steps: [js/welcome-email.js](js/welcome-email.js)
- The Gmail login is **not** stored in this repository. Ask a team member for the private `CREDENTIALS.local.md` file and keep it in the project root (it is ignored by git).
