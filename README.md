# JMI Vérandas · site (v2)

Site vitrine de JMI Vérandas. Statique, sans framework, **en local** : rien n'est publié.
Plan et décisions : [docs/DESIGN.md](docs/DESIGN.md).

Versions du design : branche `refonte-v6` = v6 « son site, en mieux » (voir docs/AUDIT-2026-10.md). Anciennes
versions : `git checkout design-v5-journee-pergola` (v5) ou `design-v3-dehors-dedans` (v3).

## Lancer

```bash
./dev.sh          # construit le site et le sert sur http://127.0.0.1:8765
                  # (reconstruction automatique à chaque modification de src/ ou site.json)
python3 tools/build.py   # construction seule → public/
```

Prérequis : Python 3 et Pillow (déjà présents sur cette machine). Aucune dépendance côté navigateur.

## Où modifier quoi

| Je veux changer… | Fichier |
|---|---|
| téléphone (GSM et fixe), e-mail, adresse, horaires, TVA, années d'expérience, lien Facebook, affichage des avis (`showReviews`) | `site.json` |
| un texte de page | `src/pages/*.html` |
| en-tête, pied de page, bandeau « Un projet ? » | `src/partials/*.html` |
| les photos de la page Réalisations (ordre, texte alternatif, légende seulement si elle vient du site d'origine) | `src/data/gallery.json` |
| ajouter une photo | la déposer dans `src/img-src/` (nom sans espace) ; le build crée les tailles WebP |
| couleurs, polices, espacements | `src/css/styles.css` (jetons en haut du fichier) |
| note Facebook et avis cité (masqués tant que `showReviews` est faux ; aperçu : `?avis=1`) | `src/data/facebook.json` |
| envoi direct du formulaire de devis | `site.json` → `formEndpoint` (voir ci-dessous) |

`public/` est généré : ne pas le modifier à la main.

## Formulaire de devis

Sans configuration, la demande est préparée dans le client e-mail du visiteur (`mailto:`), avec un bouton « Copier le message ».
Pour un envoi direct comme sur l'ancien site Wix, renseigner `formEndpoint` avec l'adresse d'un service de formulaires
(Formspree, Web3Forms…) : le visiteur voit alors « Merci, votre message est envoyé. » sans quitter la page.
Si un service tiers est utilisé, le texte de `src/pages/confidentialite.html` doit le mentionner.

## Outils (`tools/`)

- `build.py` : génère `public/` (pages, images, SEO) et **vérifie tous les liens, ancres et images**.
- `dev.py` : serveur local avec reconstruction automatique.
- `make_zone_map.py` : redessine la carte de zone (données Statbel dans `tools/data/`).
- `make_icons.py` : régénère favicon et icônes à partir du logo.
- `make_og.py` : régénère l'image de partage (1200×630) avec Chrome.

## Déploiement de test (GitHub Pages)

Chaque push sur `main` reconstruit et publie une **version de test** : https://gaustar.github.io/jmi-verandas/
(workflow `.github/workflows/pages.yml`). Elle est marquée `noindex` (Google ne l'indexe pas), son `robots.txt`
est fermé et un bandeau « Version de test » s'affiche. Le site officiel reste jmiverandas.be.
Pour reproduire en local : `TEST_BUILD=1 SITE_URL=https://gaustar.github.io BASE_PATH=/jmi-verandas/ python3 tools/build.py`
(`SITE_URL` = origine seule, sans chemin).

## Avant une mise en ligne définitive (non fait)

1. Faire valider les points listés dans DESIGN.md §8 (horaires, textes, légendes, confidentialité).
2. Remplacer les photos 640×480 par les originaux et le logo par une version vectorielle.
3. Choisir l'hébergement ; si le site n'est pas à la racine du domaine, adapter `basePath` dans `site.json`.
4. Rediriger les anciennes URL Wix (`/véranda-et-châssis`, `/contact`, `/politique-de-cookies`).
