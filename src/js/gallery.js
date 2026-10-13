/* Galerie : filtres par catégorie, avec lien direct (#pergolas, #verandas…) */
(function () {
  'use strict';
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  var counter = document.getElementById('filter-count');
  if (!buttons.length || !tiles.length) return;

  function label(btn) { return btn.textContent.trim(); }

  function apply(filter, pushHash) {
    var n = 0;
    tiles.forEach(function (t) {
      var show = filter === 'all' || t.getAttribute('data-cats').split(' ').indexOf(filter) !== -1;
      t.hidden = !show;
      if (show) n++;
    });
    var active = null;
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-filter') === filter;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      if (on) active = b;
    });
    if (counter) {
      counter.textContent = n + (n > 1 ? ' photos' : ' photo') + (filter === 'all' ? '' : ' · ' + label(active));
    }
    if (pushHash && history.replaceState) {
      history.replaceState(null, '', filter === 'all' ? location.pathname : '#' + filter);
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-filter'), true); });
  });

  var initial = location.hash.slice(1);
  var valid = buttons.some(function (b) { return b.getAttribute('data-filter') === initial; });
  apply(valid ? initial : 'all', false);
})();
