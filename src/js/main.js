/* JMI Vérandas — comportements communs. Le site reste lisible sans JavaScript. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var header = document.querySelector('.site-header');
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  /* ---------- Mouvement : suit le système, avec un interrupteur dans le pied de page ---------- */
  var stored = null;
  try { stored = localStorage.getItem('jmi-motion'); } catch (e) { /* navigation privée */ }
  var osReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function motionOff() { return stored === 'off' || (osReduce && stored !== 'on'); }
  function applyMotion() {
    root.classList.toggle('no-motion', motionOff());
    document.querySelectorAll('[data-motion-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(!motionOff()));
      b.querySelector('span').textContent = motionOff() ? 'désactivées' : 'activées';
    });
    window.dispatchEvent(new Event('jmi-motion'));
  }
  applyMotion();
  document.querySelectorAll('[data-motion-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      stored = motionOff() ? 'on' : 'off';
      try { localStorage.setItem('jmi-motion', stored); } catch (e) { /* tant pis */ }
      applyMotion();
    });
  });
  window.jmiMotionOff = motionOff;

  /* ---------- En-tête : resserré au défilement, se range quand on descend, revient quand on remonte ---------- */
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    var dy = y - lastY;
    if (Math.abs(dy) > 6) {
      var menuOpen = nav && nav.classList.contains('is-open');
      if (y > 480 && dy > 0 && !menuOpen && !header.contains(document.activeElement)) header.classList.add('is-hidden');
      else if (dy < 0) header.classList.remove('is-hidden');
      lastY = y;
    }
    if (y < 200) header.classList.remove('is-hidden');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
    if (open) header.classList.remove('is-hidden');
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

  /* ---------- Titres : les mots montent un à un (masque), une seule fois ---------- */
  function splitWords(el) {
    if (el.getAttribute('data-split-done')) return;
    el.setAttribute('data-split-done', '1');
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/( +)/).forEach(function (part) {
            if (!part) return;
            if (/^ +$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var wi = document.createElement('span'); wi.className = 'wi';
            wi.style.setProperty('--i', i++);
            wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    })(el);
    el.classList.add('split');
  }
  document.querySelectorAll('.hero-title, .page-title, .h2, .cta-title').forEach(splitWords);

  /* ---------- Cartes : un reflet suit le curseur (souris uniquement) ---------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Compteurs ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (motionOff() || isNaN(target)) return;
    var start = null, dur = 1600;
    el.textContent = '0' + suffix;
    requestAnimationFrame(function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    });
  }

  /* ---------- Apparitions au défilement ---------- */
  var targets = document.querySelectorAll('.reveal, .split');
  var seen = new Map();                               /* décalage dans un même groupe de frères : 0, 0,09 s, 0,18 s… */
  targets.forEach(function (el) {
    var n = seen.get(el.parentElement) || 0;
    seen.set(el.parentElement, n + 1);
    el.style.setProperty('--d', Math.min(n, 5) * 0.09 + 's');
  });

  /* Les éléments « wipe » sont masqués par clip-path : l'observateur ne les voit pas (0 % visible).
     On observe donc leur conteneur et on les révèle avec lui. */
  var watched = new Map();
  function watch(node, el) {
    var list = watched.get(node);
    if (!list) { list = []; watched.set(node, list); }
    if (list.indexOf(el) === -1) list.push(el);
  }
  targets.forEach(function (el) { watch(el.classList.contains('wipe') ? el.parentElement : el, el); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        (watched.get(entry.target) || []).forEach(function (el) {
          el.classList.add('in');
          el.querySelectorAll('.count').forEach(countUp);
        });
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    watched.forEach(function (_list, node) { io.observe(node); });
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
          a.parentElement.scrollTo({ left: a.offsetLeft - 16, behavior: motionOff() ? 'auto' : 'smooth' });
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
