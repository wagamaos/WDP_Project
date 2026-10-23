// Theme toggle (remembers the choice)
var themeBtn = document.getElementById('theme-btn');
function syncThemeLabel() {
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}
syncThemeLabel();
themeBtn.addEventListener('click', function () {
  var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('theme', next); } catch (e) { }
  syncThemeLabel();
});

// Mobile menu toggle
var btn = document.getElementById('menu-btn');
var nav = document.getElementById('nav');
btn.addEventListener('click', function () {
  var open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});
