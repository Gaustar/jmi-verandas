/* Visionneuse photo : <a data-lightbox="groupe" data-caption="…" href="grande-image"> */
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox]'));
  if (!links.length || typeof HTMLDialogElement === 'undefined') return;

  var dlg, img, caption, count, trigger = null, group = [], idx = 0;

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'lb';
    dlg.setAttribute('aria-label', 'Visionneuse photo');
    dlg.innerHTML =
      '<div class="lb-stage">' +
      '<button type="button" class="lb-btn lb-close" aria-label="Fermer">✕</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Photo précédente">‹</button>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Photo suivante">›</button>' +
      '<div class="lb-fig"><img alt=""></div>' +
      '<div class="lb-bar"><span class="lb-caption"></span><span class="lb-count" aria-live="polite"></span></div>' +
      '</div>';
    document.body.appendChild(dlg);
    img = dlg.querySelector('img');
    caption = dlg.querySelector('.lb-caption');
    count = dlg.querySelector('.lb-count');

    dlg.querySelector('.lb-close').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    dlg.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.classList.contains('lb-stage') || e.target.classList.contains('lb-fig')) dlg.close();
    });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    dlg.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
      if (trigger) trigger.focus({ preventScroll: true });
    });

    var x0 = null;
    img.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    img.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    });
    img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  function preload(a) { if (a) { var n = new Image(); n.src = a.href; } }

  function show(i) {
    idx = (i + group.length) % group.length;
    var a = group[idx];
    var thumb = a.querySelector('img');
    var low = !!a.closest('[data-lowres]');
    img.classList.add('is-fading');
    var loader = new Image();
    loader.onload = function () {
      img.src = a.href;
      img.alt = thumb ? thumb.alt : '';
      img.style.setProperty('--natw', low ? loader.naturalWidth + 'px' : '100%');
      img.classList.remove('is-fading');
    };
    loader.src = a.href;
    caption.textContent = a.getAttribute('data-caption') || (thumb ? thumb.alt : '');
    count.textContent = group.length > 1 ? (idx + 1) + ' / ' + group.length : '';
    var single = group.length < 2;
    dlg.querySelector('.lb-prev').hidden = single;
    dlg.querySelector('.lb-next').hidden = single;
    preload(group[(idx + 1) % group.length]);
    preload(group[(idx - 1 + group.length) % group.length]);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-lightbox]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (!dlg) build();
    var name = a.getAttribute('data-lightbox');
    group = links.filter(function (l) { return l.getAttribute('data-lightbox') === name && l.offsetParent !== null; });
    trigger = a;
    document.documentElement.style.overflow = 'hidden';
    dlg.showModal();
    show(group.indexOf(a));
  });
})();
