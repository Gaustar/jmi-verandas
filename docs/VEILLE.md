# Veille : animations des sites d'aujourd'hui et des concurrents (13 octobre 2026)

## Ce que disent les articles de tendances 2025-2026

Sources : recherches web (articles de blogs et d'agences, pas de classement Awwwards consulté).

- Le **défilement devient un outil narratif** (scrollytelling) : le décor change au fil du scroll, chaque défilement se lit comme
  un chapitre.
- Les animations pilotées par le défilement passent au **CSS natif** (`animation-timeline`) ; GSAP reste utilisé pour les cas
  complexes.
- Les titres se révèlent **mot à mot** (kinetic typography, type « SplitText »).
- **En-têtes intelligents** (ils se rangent quand on descend), micro-interactions (retours immédiats sur boutons, cartes),
  transitions de page (View Transitions).
- Le mouvement devient **plus calme et plus intelligent**, avec respect de `prefers-reduced-motion`.

## Ce qu'on a mesuré chez les concurrents (dans Chrome, le 13 octobre 2026)

| Site | Technique | Ce qui bouge | Autre |
|---|---|---|---|
| Renson (fabricant de pergolas, `renson.net/fr-be/produits/pergolas`) | jQuery, ~840 animations CSS actives, aucune animation liée au défilement | bandeaux, fondus génériques | catalogue de gammes, bandeau « Offre temporaire » |
| Skylux (revendeur en ligne, `skylux.eu`) | GSAP + 2 règles de scroll CSS | carrousels, titres | bandeau cookies dès l'arrivée |
| WB Outdoor Concept (revendeur Renson à Habay) | pas de site propre trouvé (pages promotionnelles sur info-lux.com) | | garantie, prix de départ, gammes de marque |

Échantillon : 2 sites inspectés, à prendre comme un aperçu et pas comme une étude de marché.

Constat : aucun n'a une animation qui **raconte le produit**. Ils montrent des photos de gammes ; personne ne fait vivre la
pergola.

## Ce qu'on fait pour JMI (et qu'ils ne font pas)

| Idée | Pourquoi ça le distingue |
|---|---|
| **« Une journée sous la pergola »** : le défilement fait passer matin, midi, pluie, soir (lames qui tournent, soleil qui traverse, fenêtre et liseré LED qui s'allument) | le site se comporte comme le produit ; aucun concurrent ne le fait |
| **Baie vitrée qui s'ouvre** sur la photo du hero | l'image d'arrivée est la baie coulissante qu'il pose |
| **Titres mot à mot** | geste actuel, sobre, lisible dès 1 s |
| **Carte des réalisations** qui se trace + photo punaisée | ancrage local réel (Arlon, Marche, Bertrix, Beauraing) |
| **Mètre ruban** « Trente ans, ça se mesure » | son métier (le sur-mesure) comme motif |
| **Chiffres qui comptent**, **reflets sur les cartes**, **en-tête qui se range** | micro-interactions classiques mais soignées |
| **Aucun cookie, aucune bibliothèque d'animation** | plus rapide, rien à consentir (Renson et Skylux : jQuery / GSAP + cookies) |

## Garde-fous

- `prefers-reduced-motion` respecté, **plus un interrupteur « Animations » dans le pied de page** (mémorisé).
- Aucun mouvement sur du texte déjà affiché ; les mots montent une seule fois, en moins de 1,5 s.
- Mesuré : décalage de mise en page (CLS) < 0,02, Lighthouse 100 en bureau, 88 en mobile simulé.
