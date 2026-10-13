/* JMI Vérandas — comportements communs. Le site reste lisible sans JavaScript. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  /* ---------- En-tête : resserré au défilement ---------- */
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Thème clair / sombre ---------- */
  var toggle = document.querySelector('.theme-toggle');
  function isDark() {
    var t = root.dataset.theme;
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('jmi-theme', next); } catch (e) { /* navigation privée : tant pis */ }
    });
  }

  /* ---------- Compteurs ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce || isNaN(target)) return;
    var start = null, dur = 1400;
    el.textContent = '0' + suffix;
    requestAnimationFrame(function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  var targets = document.querySelectorAll('.reveal');
  targets.forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        entry.target.querySelectorAll('.count').forEach(countUp);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Sous-navigation de la page produits ---------- */
  var subLinks = document.querySelectorAll('.subnav a');
  if (subLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    subLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        subLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[entry.target.id];
        if (a) {
          a.classList.add('is-active');
          var bar = a.parentElement;
          bar.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) so.observe(sec);
    });
  }

  /* ---------- Horaires : « ouvert maintenant » ---------- */
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var DAY_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  function toMin(t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function fmt(t) { var p = t.split(':'); return parseInt(p[0], 10) + 'h' + (p[1] !== '00' ? p[1] : ''); }

  function brusselsNow() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Brussels', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
    return { day: day, min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }

  var hoursBox = document.querySelector('[data-hours]');
  var now;
  try { now = brusselsNow(); } catch (e) { now = null; }
  if (now) {
    document.querySelectorAll('.hours tr[data-day]').forEach(function (tr) {
      if (tr.getAttribute('data-day') === DAY_KEYS[now.day]) tr.classList.add('is-today');
    });
  }
  if (hoursBox && now) {
    var hours;
    try { hours = JSON.parse(hoursBox.getAttribute('data-hours')); } catch (e) { hours = null; }
    var status = hoursBox.querySelector('[data-status]');
    var txt = hoursBox.querySelector('[data-status-text]');
    if (hours && status && txt) {
      var today = hours[DAY_KEYS[now.day]] || [];
      var current = null;
      today.forEach(function (r) { if (now.min >= toMin(r[0]) && now.min < toMin(r[1])) current = r; });
      if (current) {
        status.setAttribute('data-state', 'open');
        txt.textContent = 'Ouvert · jusqu’à ' + fmt(current[1]);
      } else {
        var label = null;
        for (var d = 0; d < 8 && !label; d++) {
          var key = DAY_KEYS[(now.day + d) % 7];
          var ranges = hours[key] || [];
          for (var i = 0; i < ranges.length && !label; i++) {
            if (d === 0 && toMin(ranges[i][0]) <= now.min) continue;
            label = (d === 0 ? 'aujourd’hui' : d === 1 ? 'demain' : DAY_FR[(now.day + d) % 7]) + ' à ' + fmt(ranges[i][0]);
          }
        }
        status.setAttribute('data-state', 'closed');
        txt.textContent = 'Fermé' + (label ? ' · rouvre ' + label : '');
      }
    }
  }
})();
