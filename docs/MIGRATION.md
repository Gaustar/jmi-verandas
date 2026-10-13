# Passage du site Wix à la v2 (à faire le jour où on décide de publier)

Rien de ceci n'est fait : le site reste en local.

## 1. Anciennes adresses → nouvelles adresses

Le site Wix expose 6 pages (relevées dans son `sitemap.xml`). Chacune doit rediriger (code 301) pour ne pas perdre le
référencement ni les liens existants (Facebook, annuaires, pagesdor.be…).

| Ancienne URL (Wix) | Nouvelle URL |
|---|---|
| `/` | `/` |
| `/véranda-et-châssis` | `/verandas-chassis/` |
| `/contact` | `/contact/` |
| `/contact-1` | `/contact/` |
| `/kopie-van-jmi-verandas-à-bouillon` | `/` |
| `/politique-de-cookies` | `/confidentialite/` |

Selon l'hébergeur, cela s'écrit dans un fichier `_redirects` (Netlify, Cloudflare Pages), un `.htaccess` (Apache) ou la
console de l'hébergeur. GitHub Pages ne sait pas faire de vraies redirections 301 : à éviter si le référencement compte.

## 2. Hébergement : critères

- Le site est 100 % statique (dossier `public/`) : n'importe quel hébergement convient.
- Il faut la **compression gzip/brotli** (le texte pèse ~45 Ko non compressé) et des **en-têtes de cache** longs sur
  `/assets/` (les fichiers sont versionnés par `?v=…`).
- Il faut que `404.html` soit servi pour les adresses inconnues.
- Si le site n'est pas servi à la racine du domaine, régler `basePath` dans `site.json`.

## 3. Domaine et messagerie

- Le domaine `jmiverandas.be` est aujourd'hui lié à Wix. Vérifier où il est enregistré (registrar) et où sont gérés les
  enregistrements DNS **avant** de toucher à quoi que ce soit.
- L'adresse e-mail de contact est une adresse Gmail (`perspectives.jmich@gmail.com`), indépendante du site : elle n'est
  pas concernée par le changement.
- Ne résilier l'abonnement Wix qu'après avoir vérifié que le nouveau site répond bien sur le domaine.

## 4. Après la mise en ligne

- Vérifier le site dans Google Search Console, envoyer `sitemap.xml`.
- Mettre à jour les liens vers le site : page Facebook, Pages d'Or (`pagesdor.be`), fiche Google de l'entreprise si elle
  existe, signature d'e-mail, véhicule, cartes de visite.
- Si un service de formulaire est branché (`formEndpoint`), le tester avec un vrai message et le citer dans la page
  Confidentialité.
- Relancer `python3 tools/build.py` : il vérifie tous les liens, les ancres et les images.
