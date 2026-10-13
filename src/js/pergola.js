/* Pergola bioclimatique : une journée pilotée par le défilement (matin, midi, pluie, soir),
   ou à la main (curseur, soleil / pluie). Rien d'autre que du CSS sur des variables : léger. */
(function () {
  'use strict';
  var root = document.querySelector('.sim');
  if (!root) return;
  var svg = root.querySelector('[data-sim]');
  var NS = 'http://www.w3.org/2000/svg';

  /* géométrie : l'intérieur de la pergola va de x=112 à x=648 */
  var X0 = 112, W = 536, N = 12, PITCH = W / N;

  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }

  var louvres = svg.querySelector('.sim-louvres');
  var beams = svg.querySelector('.sim-beams');
  for (var i = 0; i < N; i++) {
    louvres.appendChild(el('rect', { x: (X0 + i * PITCH - 1.2).toFixed(1), y: 117, width: (PITCH + 2.4).toFixed(1), height: 9, rx: 3 }));
    var x = X0 + i * PITCH + PITCH * 0.28, w = PITCH * 0.44, dx = 120;
    beams.appendChild(el('polygon', {
      points: [x, 126, x + w, 126, x + w + dx, 360, x + dx, 360].map(function (n) { return +n.toFixed(1); }).join(' ')
    }));
  }

  /* pluie : positions pseudo-aléatoires mais fixes */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  svg.querySelectorAll('.sim-rain').forEach(function (g, gi) {
    var rand = rng(7 + gi * 11);
    var inside = g.classList.contains('sim-rain--in');
    var count = inside ? 40 : 70;
    for (var k = 0; k < count; k++) {
      var rx = inside ? X0 + rand() * W : rand() * 760;
      var line = el('line', { x1: rx.toFixed(1), y1: 0, x2: (rx - 7).toFixed(1), y2: 26 });
      line.style.setProperty('--dur', (0.55 + rand() * 0.45).toFixed(2) + 's');
      line.style.setProperty('--del', (-rand() * 1.2).toFixed(2) + 's');
      g.appendChild(line);
    }
  });

  var input = root.querySelector('#louvre');
  var stateEl = root.querySelector('#sim-state');
  var meters = {
    light: root.querySelector('[data-meter="light"]'),
    air: root.querySelector('[data-meter="air"]'),
    shelter: root.querySelector('[data-meter="shelter"]')
  };
  var TEXT = {
    sun: [
      'Lames fermées : à l’abri du soleil et de la pluie.',
      'Lames inclinées : la lumière est filtrée, l’air circule.',
      'Lames ouvertes : plein soleil et grand air.'
    ],
    rain: [
      'Lames fermées : vous restez au sec, même sous la pluie.',
      'Lames inclinées : l’air circule, mais la pluie passe entre les lames.',
      'Lames ouvertes : à réserver aux beaux jours.'
    ]
  };

  function weatherBtns(weather) {
    root.querySelectorAll('.seg-btn').forEach(function (o) {
      var on = o.getAttribute('data-weather') === weather;
      o.classList.toggle('is-on', on);
      o.setAttribute('aria-pressed', String(on));
    });
  }

  /* état « à la main » : lames, météo, jauges, texte */
  function update(skipText) {
    var v = +input.value / 100;
    var weather = root.getAttribute('data-weather') || 'sun';
    root.style.setProperty('--o', v);
    root.style.setProperty('--rain-in', v > 0.12 ? 1 : 0);
    meters.light.style.setProperty('--v', weather === 'rain' ? v * 0.35 : v);
    meters.air.style.setProperty('--v', v);
    meters.shelter.style.setProperty('--v', weather === 'rain' ? (v > 0.12 ? 1 - v : 1) : 1 - v * 0.7);
    var level = v < 0.12 ? 0 : v < 0.7 ? 1 : 2;
    if (!skipText) stateEl.textContent = TEXT[weather][level];
    input.setAttribute('aria-valuetext', ['Fermées', 'Inclinées', 'Ouvertes'][level] + ', ' + Math.round(v * 100) + ' %');
  }

  /* ---------- la journée ---------- */
  var STEPS = [
    { id: 'matin', c: 0.125, text: 'Le matin, les lames sont inclinées : la lumière est douce, l’air circule.' },
    { id: 'midi',  c: 0.375, text: 'À midi, elles s’ouvrent : plein soleil et grand air.' },
    { id: 'pluie', c: 0.625, text: 'Quand il pleut, elles se referment : vous restez au sec.' },
    { id: 'soir',  c: 0.875, text: 'Le soir, l’éclairage intégré prend le relais.' }
  ];
  var K = {                                              /* valeurs aux centres des 4 étapes */
    open:  [0.35, 1, 0, 0.5],
    night: [0.12, 0, 0.22, 1],
    sunX:  [0, 290, 400, 520],
    sunY:  [64, -20, 10, 74],
    sky1:  [[93, 134, 192], [121, 193, 241], [138, 152, 164], [11, 23, 48]],
    sky2:  [[246, 201, 168], [211, 236, 250], [196, 205, 212], [43, 58, 99]],
    win:   [[169, 208, 232], [169, 208, 232], [169, 208, 232], [255, 210, 122]]
  };
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); }
  function seg(p) {                                      /* entre quelles étapes sommes-nous ? */
    var cs = STEPS.map(function (s) { return s.c; });
    if (p <= cs[0]) return [0, 0, 0];
    if (p >= cs[3]) return [3, 3, 0];
    for (var j = 0; j < 3; j++) if (p <= cs[j + 1]) return [j, j + 1, ease((p - cs[j]) / (cs[j + 1] - cs[j]))];
    return [3, 3, 0];
  }
  function num(key, a, b, t) { return lerp(K[key][a], K[key][b], t); }
  function rgb(key, a, b, t) {
    var A = K[key][a], B = K[key][b];
    return 'rgb(' + [0, 1, 2].map(function (n) { return Math.round(lerp(A[n], B[n], t)); }).join(',') + ')';
  }

  var story = root.querySelector('[data-story]');
  var rail = root.querySelectorAll('[data-step]');
  var railFill = root.querySelector('.story-fill');
  var current = -1;
  var manualUntil = 0;

  function setScene(p) {
    var s = seg(p), a = s[0], b = s[1], t = s[2];
    var open = num('open', a, b, t);
    var night = num('night', a, b, t);
    var raining = p >= 0.5 && p < 0.75;
    var led = p < 0.7 ? 0 : Math.min(1, (p - 0.7) / 0.14);

    input.value = Math.round(open * 100);
    root.setAttribute('data-weather', raining ? 'rain' : 'sun');
    weatherBtns(raining ? 'rain' : 'sun');
    update(true);

    var st = root.style;
    st.setProperty('--sun-x', num('sunX', a, b, t).toFixed(1) + 'px');
    st.setProperty('--sun-y', num('sunY', a, b, t).toFixed(1) + 'px');
    st.setProperty('--sim-sky-1', rgb('sky1', a, b, t));
    st.setProperty('--sim-sky-2', rgb('sky2', a, b, t));
    st.setProperty('--win', rgb('win', a, b, t));
    st.setProperty('--night', night.toFixed(3));
    st.setProperty('--led', led.toFixed(3));
    st.setProperty('--sun', raining || p > 0.84 ? 0 : 1);

    var idx = Math.min(3, Math.floor(p * 4));
    if (idx !== current) {
      current = idx;
      stateEl.textContent = STEPS[idx].text;
      rail.forEach(function (b2, n) {
        b2.classList.toggle('is-on', n === idx);
        b2.setAttribute('aria-current', n === idx ? 'step' : 'false');
      });
    }
    if (railFill) railFill.style.setProperty('--p', p.toFixed(3));
  }

  function progress() {
    var r = story.getBoundingClientRect();
    var span = story.offsetHeight - window.innerHeight;
    return span > 0 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
  }

  var ticking = false, storyOn = false;
  function frame() {
    ticking = false;
    if (!storyOn || Date.now() < manualUntil) return;
    setScene(progress());
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  function enableStory() {
    var on = !!story && !(window.jmiMotionOff && window.jmiMotionOff());
    root.classList.toggle('story', on);
    if (on && !storyOn) { storyOn = true; window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll); setScene(progress()); }
    if (!on && storyOn) { storyOn = false; window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); resetManual(); }
  }
  function resetManual() {                              /* retour à l'état « à la main » par défaut */
    root.style.removeProperty('--sun-x'); root.style.removeProperty('--sun-y');
    ['--sim-sky-1', '--sim-sky-2', '--win', '--night', '--led', '--sun'].forEach(function (k) { root.style.removeProperty(k); });
    root.setAttribute('data-weather', 'sun'); weatherBtns('sun');
    input.value = 55; update();
  }

  /* commandes manuelles : elles reprennent la main pendant 6 s */
  function takeOver() { manualUntil = Date.now() + 6000; }
  input.addEventListener('input', function () { takeOver(); update(); });
  root.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () { takeOver(); input.value = b.getAttribute('data-preset'); update(); });
  });
  root.querySelectorAll('.seg-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      takeOver();
      root.setAttribute('data-weather', b.getAttribute('data-weather'));
      weatherBtns(b.getAttribute('data-weather'));
      update();
    });
  });

  /* rail : aller directement à une étape */
  rail.forEach(function (b, n) {
    b.addEventListener('click', function () {
      if (!storyOn) { manualUntil = 0; setScene(STEPS[n].c); return; }
      var top = window.scrollY + story.getBoundingClientRect().top;
      var span = story.offsetHeight - window.innerHeight;
      manualUntil = 0;
      window.scrollTo({ top: top + span * STEPS[n].c, behavior: 'smooth' });
    });
  });

  update();
  window.addEventListener('jmi-motion', enableStory);
  enableStory();
})();
