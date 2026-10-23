// Runs before the page paints so there is no light flash in dark mode
(function () {
  var t;
  try { t = localStorage.getItem('theme'); } catch (e) { }
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
})();
