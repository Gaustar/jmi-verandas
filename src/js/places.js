/* Carte des réalisations : un clic sur une commune (liste ou carte) affiche sa photo. */
(function () {
  'use strict';
  var root = document.querySelector('[data-places]');
  if (!root) return;
  var btns = Array.prototype.slice.call(root.querySelectorAll('.place-btn'));
  var shots = Array.prototype.slice.call(root.querySelectorAll('.place-shot'));
  var pins = Array.prototype.slice.call(root.querySelectorAll('.zone-place[data-place]'));

  function select(id) {
    btns.forEach(function (b) {
      var on = b.getAttribute('data-place') === id;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    shots.forEach(function (s) { s.classList.toggle('is-on', s.getAttribute('data-place') === id); });
    pins.forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-place') === id); });
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-place')); });
  });

  pins.forEach(function (p) {
    var label = p.querySelector('text');
    p.setAttribute('tabindex', '0');
    p.setAttribute('role', 'button');
    p.setAttribute('aria-label', 'Voir la réalisation : ' + (label ? label.textContent : p.getAttribute('data-place')));
    p.addEventListener('click', function () { select(p.getAttribute('data-place')); });
    p.addEventListener('mouseenter', function () { select(p.getAttribute('data-place')); });
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(p.getAttribute('data-place')); }
    });
  });

  if (btns.length) select(btns[0].getAttribute('data-place'));
})();
