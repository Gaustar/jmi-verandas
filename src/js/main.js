/* JMI Vérandas — comportements communs. Le site reste entièrement lisible sans JavaScript. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  /* ---------- En-tête : ombre dès qu'on a défilé ---------- */
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
    root.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* ---------- Compteur « 30+ » : la valeur finale est déjà dans la page ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce || isNaN(target)) return;
    var start = null, dur = 1400;
    requestAnimationFrame(function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    });
  }

  /* ---------- Apparitions au défilement (seulement sous la ligne de flottaison) ---------- */
  var targets = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var groups = new Map();
  targets.forEach(function (el) {
    var n = groups.get(el.parentElement) || 0;
    groups.set(el.parentElement, n + 1);
    el.style.setProperty('--d', Math.min(n, 5) * 0.08 + 's');
  });

  var counters = Array.prototype.slice.call(document.querySelectorAll('.count'));
  if ('IntersectionObserver' in window && !reduce) {
    var fold = window.innerHeight;
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top < fold) el.classList.add('in');   /* déjà visible : rien ne bouge */
      else el.classList.add('pending');
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (el) { if (el.classList.contains('pending')) io.observe(el); });

    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        co.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Horaires : le jour d'aujourd'hui est mis en évidence ---------- */
  try {
    var wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', weekday: 'short' }).format(new Date());
    var key = { Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun' }[wd];
    document.querySelectorAll('.hours tr[data-day="' + key + '"]').forEach(function (tr) { tr.classList.add('is-today'); });
  } catch (e) { /* ancien navigateur : pas de mise en évidence */ }

  /* ---------- Avis Facebook : aperçu avec ?avis=1 (pour les montrer avant de décider) ---------- */
  try {
    if (new URLSearchParams(location.search).get('avis') === '1') {
      document.querySelectorAll('[data-reviews]').forEach(function (s) { s.hidden = false; });
    }
  } catch (e) { /* rien */ }
})();
