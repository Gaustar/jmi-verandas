/* Assistant de devis en 3 étapes.
   - sans service de formulaire : le message est préparé dans le client e-mail (mailto:)
   - avec data-endpoint (site.json → formEndpoint) : envoi direct (POST JSON) + confirmation */
(function () {
  'use strict';
  var form = document.getElementById('devis');
  if (!form) return;

  var LABELS = {
    'veranda': 'Véranda', 'extension': 'Extension', 'pergola-classique': 'Pergola classique',
    'pergola-bioclimatique': 'Pergola bioclimatique', 'carport': 'Carport', 'store-exterieur': 'Store extérieur',
    'store-interieur': 'Store intérieur', 'protection-solaire': 'Protection solaire', 'volet-roulant': 'Volet roulant',
    'fenetre': 'Fenêtre', 'porte': 'Porte', 'porte-garage': 'Porte de garage', 'moustiquaire': 'Moustiquaires',
    'entretien': 'Entretien / réparation', 'documentation': 'Documentation'
  };
  var endpoint = form.getAttribute('data-endpoint') || '';
  var toEmail = form.getAttribute('data-email');
  var phone = form.getAttribute('data-phone');

  var steps = Array.prototype.slice.call(form.querySelectorAll('.wstep'));
  var inds = Array.prototype.slice.call(form.querySelectorAll('[data-step-ind]'));
  var prev = form.querySelector('[data-prev]');
  var next = form.querySelector('[data-next]');
  var submit = form.querySelector('[data-submit]');
  var result = form.querySelector('[data-result]');
  var nav = form.querySelector('.wizard-nav');
  var cur = 0;

  /* pré-remplissage : /contact/?projet=veranda,extension */
  var preset = (new URLSearchParams(location.search).get('projet') || '').split(',');
  form.querySelectorAll('input[name="projet"]').forEach(function (c) {
    if (preset.indexOf(c.value) !== -1) c.checked = true;
  });

  function showError(name, on) {
    var e = form.querySelector('[data-error="' + name + '"]');
    if (e) e.hidden = !on;
  }

  function go(n, focus) {
    cur = n;
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    inds.forEach(function (li, i) {
      li.classList.toggle('is-current', i === n);
      li.classList.toggle('is-done', i < n);
      if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    prev.hidden = n === 0;
    next.hidden = n === steps.length - 1;
    submit.hidden = n !== steps.length - 1;
    if (focus !== false) {
      var f = steps[n].querySelector('input:not([type=checkbox]), textarea') || steps[n].querySelector('input');
      if (f && n > 0) f.focus({ preventScroll: true });
      var top = form.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) form.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }

  function validate(n) {
    var ok = true;
    if (n === 0) {
      ok = form.querySelectorAll('input[name="projet"]:checked').length > 0;
      showError('projet', !ok);
    }
    if (n === 2) {
      var nom = form.elements.nom, tel = form.elements.tel, mail = form.elements.email;
      var nomOk = nom.value.trim().length > 1;
      nom.setAttribute('aria-invalid', String(!nomOk));
      showError('nom', !nomOk);
      var telOk = tel.value.replace(/[^\d+]/g, '').length >= 8;
      var mailOk = mail.value.trim() !== '' && mail.validity.valid;
      var anyContact = telOk || mailOk;
      var badMail = mail.value.trim() !== '' && !mail.validity.valid;
      tel.setAttribute('aria-invalid', String(!anyContact));
      mail.setAttribute('aria-invalid', String(!anyContact || badMail));
      showError('contact', !anyContact || badMail);
      ok = nomOk && anyContact && !badMail;
      if (!ok) (!nomOk ? nom : (badMail ? mail : tel)).focus();
    }
    return ok;
  }

  next.addEventListener('click', function () { if (validate(cur)) go(cur + 1); });
  prev.addEventListener('click', function () { go(cur - 1); });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && cur < steps.length - 1) {
      e.preventDefault();
      if (validate(cur)) go(cur + 1);
    }
  });

  function data() {
    var projets = Array.prototype.map.call(form.querySelectorAll('input[name="projet"]:checked'),
      function (c) { return LABELS[c.value] || c.value; });
    return {
      projets: projets,
      commune: form.elements.commune.value.trim(),
      message: form.elements.message.value.trim(),
      nom: form.elements.nom.value.trim(),
      tel: form.elements.tel.value.trim(),
      email: form.elements.email.value.trim()
    };
  }

  function buildMessage(d) {
    var lines = ['Bonjour,', '', 'Je souhaite un devis pour : ' + d.projets.join(', ') + '.'];
    if (d.commune) lines.push('Commune du projet : ' + d.commune);
    if (d.message) lines.push('', 'Ma demande :', d.message);
    lines.push('', 'Mes coordonnées :', 'Nom : ' + d.nom);
    if (d.tel) lines.push('Téléphone : ' + d.tel);
    if (d.email) lines.push('E-mail : ' + d.email);
    lines.push('', 'Message envoyé depuis le site jmiverandas.be');
    return lines.join('\n');
  }

  function button(text, cls, handler, href) {
    var b = document.createElement(href ? 'a' : 'button');
    b.className = 'btn ' + cls + ' btn--sm';
    b.textContent = text;
    if (href) b.href = href; else { b.type = 'button'; b.addEventListener('click', handler); }
    return b;
  }

  function finish(title, text, actions) {
    steps.forEach(function (s) { s.hidden = true; });
    nav.hidden = true;
    form.querySelector('.wizard-steps').hidden = true;
    result.hidden = false;
    result.querySelector('[data-result-title]').textContent = title;
    result.querySelector('[data-result-text]').textContent = text;
    var box = result.querySelector('[data-result-actions]');
    box.textContent = '';
    (actions || []).forEach(function (a) { box.appendChild(a); });
    result.focus();
    result.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function copy(text, btn) {
    function done() { btn.textContent = 'Message copié ✓'; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { btn.textContent = 'Copie impossible'; }
      document.body.removeChild(ta);
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(0)) { go(0); return; }
    if (!validate(2)) return;
    var d = data();
    var msg = buildMessage(d);
    var subject = 'Demande de devis : ' + d.projets.join(', ');

    if (endpoint) {
      submit.disabled = true;
      submit.textContent = 'Envoi…';
      fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ subject: subject, projets: d.projets.join(', '), commune: d.commune, message: d.message, nom: d.nom, tel: d.tel, email: d.email, texte: msg })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        finish('Merci, votre message est envoyé.', 'Nous revenons vers vous rapidement.', []);
      }).catch(function () {
        submit.disabled = false;
        submit.textContent = 'Envoyer ma demande';
        var copyBtn = button('Copier le message', 'btn--ghost', function () { copy(msg, copyBtn); });
        finish('L’envoi n’a pas abouti.', 'Écrivez-nous directement ou appelez-nous, votre message est prêt à copier.',
          [copyBtn, button(toEmail, 'btn--primary', null, 'mailto:' + toEmail), button(phone, 'btn--ghost', null, 'tel:' + phone.replace(/\s/g, ''))]);
      });
      return;
    }

    var link = 'mailto:' + toEmail + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(msg);
    var copyBtn = button('Copier le message', 'btn--ghost', function () { copy(msg, copyBtn); });
    finish('Votre message est prêt.',
      'Votre application e-mail s’ouvre avec votre demande : il ne reste qu’à l’envoyer. ' +
      'Rien ne s’est ouvert ? Copiez le message, ou appelez-nous.',
      [button('Ouvrir mon e-mail', 'btn--primary', null, link), copyBtn,
       button(phone, 'btn--ghost', null, 'tel:' + phone.replace(/\s/g, ''))]);
    window.location.href = link;
  });

  go(0, false);
})();
