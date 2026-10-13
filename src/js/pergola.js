/* Simulateur de pergola bioclimatique : orientation des lames, soleil / pluie. */
(function () {
  'use strict';
  var root = document.querySelector('.sim');
  if (!root) return;
  var svg = root.querySelector('[data-sim]');
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* pluie : positions pseudo-aléatoires mais fixes (pas de scintillement d'un rechargement à l'autre) */
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

  function update() {
    var v = +input.value / 100;
    var weather = root.getAttribute('data-weather') || 'sun';
    root.style.setProperty('--o', v);
    root.style.setProperty('--rain-in', v > 0.12 ? 1 : 0);
    meters.light.style.setProperty('--v', weather === 'rain' ? v * 0.35 : v);
    meters.air.style.setProperty('--v', v);
    meters.shelter.style.setProperty('--v', weather === 'rain' ? (v > 0.12 ? 1 - v : 1) : 1 - v * 0.7);
    var level = v < 0.12 ? 0 : v < 0.7 ? 1 : 2;
    stateEl.textContent = TEXT[weather][level];
    input.setAttribute('aria-valuetext', ['Fermées', 'Inclinées', 'Ouvertes'][level] + ', ' + Math.round(v * 100) + ' %');
  }

  var touched = false;
  input.addEventListener('input', function () { touched = true; update(); });

  root.querySelectorAll('[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      touched = true;
      input.value = b.getAttribute('data-preset');
      update();
    });
  });

  root.querySelectorAll('[data-weather]').forEach(function (b) {
    b.addEventListener('click', function () {
      root.setAttribute('data-weather', b.getAttribute('data-weather'));
      root.querySelectorAll('[data-weather]').forEach(function (o) {
        if (!o.classList.contains('seg-btn')) return;
        var on = o === b;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', String(on));
      });
      update();
    });
  });

  update();

  /* petite démonstration à la première apparition, interrompue dès que l'on touche au curseur */
  if (!reduce && 'IntersectionObserver' in window) {
    var demo = new IntersectionObserver(function (entries, o) {
      if (!entries[0].isIntersecting) return;
      o.disconnect();
      var start = null, dur = 2800, from = +input.value;
      requestAnimationFrame(function tick(ts) {
        if (touched) return;
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var path = Math.sin(p * Math.PI * 2);             /* ouvre puis ferme puis revient */
        input.value = Math.round(Math.min(100, Math.max(0, from + path * 45 * (1 - p * 0.2))));
        update();
        if (p < 1) requestAnimationFrame(tick); else { input.value = from; update(); }
      });
    }, { threshold: 0.55 });
    demo.observe(svg);
  }
})();
