# JMI Vérandas · refonte du site (v2, local)

Site vitrine de JMI Vérandas (Pierrot Jean-Michel), Corbion-sur-Semois / Bouillon.
Remplace le site Wix actuel (jmiverandas.be). **Reste en local** tant que rien n'est décidé sur l'hébergement.

## 1. Ce que le site actuel contenait (et que la v1 avait raté)

Relevé complet du site Wix, pages cachées comprises (`/kopie-van-jmi-verandas-à-bouillon`, `/contact-1`) :

| Fait | Source |
|---|---|
| « À votre service depuis plus de 30 ans » (une page ancienne dit 29 ans) | page Véranda & châssis |
| Matériaux : châssis aluminium, PVC ou bois | page Véranda & châssis |
| Points forts : fermeture, sécurité, isolation thermique et acoustique, design | page Véranda & châssis |
| Croquis et simulation 3D, devis gratuit sans engagement, aide permis de construire | page cachée |
| Réalisations localisées : Arlon, Marche, Bertrix, Beauraing | alt des photos |
| Horaires **contradictoires** : lun–ven 9h–12h / 14h–18h sur rendez-vous (page Contact) ; lun–ven 9h–18h, dimanche sur rendez-vous (page cachée) | à trancher |
| Formulaire : nom, e-mail, téléphone, demande + 14 types de projet | page Contact |
| Cookies : Google Analytics, Facebook Pixel, Hotjar-style | politique de cookies Wix |
| Facebook : facebook.com/JMI.pierrotjeanmichel | pied de page |

Photos : ~26 sur le site, dont 14 en bonne résolution (1867×1400) et 8 en 640×480 ou moins.

## 2. Principes de design

1. **Les photos sont le produit.** Un client achète un résultat : terrasse, véranda, lumière. Photo grande, texte court.
2. **Éditorial, pas gabarit.** Grande typo serif (Fraunces), texte en Manrope, beaucoup d'air, une seule couleur d'action (bleu du logo `#008BCC`).
3. **Zéro invention.** Aucun chiffre, prix, garantie, marque ou délai qui ne soit pas dans le site d'origine. Les textes de présentation des produits sont génériques et marqués « à valider » ci-dessous.
4. **Mobile d'abord.** La majorité des visiteurs d'un artisan arrivent depuis un téléphone : appeler en un geste, devis en trois étapes.
5. **Respect de la vie privée.** Plus aucun pisteur, plus de bannière de cookies : polices hébergées localement, pas de script tiers.
6. **Durable.** Site statique généré, sans framework, modifiable sans connaissance particulière (voir §7).

## 3. Plan du site

| Page | URL | Rôle |
|---|---|---|
| Accueil | `/` | Promesse, simulateur de pergola, produits, réalisations, pourquoi nous, zone, appel à l'action |
| Véranda & châssis | `/verandas-chassis/` | Les 8 familles de produits, matériaux, simulation 3D, devis par produit |
| Réalisations | `/realisations/` | Galerie filtrable + visionneuse plein écran |
| Contact & devis | `/contact/` | Assistant de devis en 3 étapes, coordonnées, horaires « ouvert maintenant », carte de zone |
| Confidentialité | `/confidentialite/` | Remplace la politique de cookies Wix |
| 404 | `/404.html` | Page d'erreur utile |

## 4. Système visuel (v6 « son site, en mieux », 15 octobre 2026)

Historique : v2 (serif, bleu) → v3 « Dehors / Dedans » (tag `design-v3-dehors-dedans`) → v4/v5 (serif éditoriale,
papier beige, « Une journée sous la pergola » ; tag `design-v5-journee-pergola`) → **v6**, issue de
[l'audit du 15/10/2026](AUDIT-2026-10.md).

**Règle de contenu (demandée par Gauthier)** : le site ne reprend **que** le texte du site Wix actuel. Rien d'inventé,
rien de déduit des photos. Seuls changent la mise en page, le look et les animations. Exceptions assumées :
libellés d'interface (boutons, formulaire), page Confidentialité (elle décrit le nouveau site), avis Facebook
(masqués, voir ci-dessous).

- **Il se reconnaît** : son logo, le bleu `#008BCC`, sa photo de pergola en plein écran, son H1 (« JMI Verandas, votre
  spécialiste en vérandas et pergolas dans les provinces de Luxembourg et de Namur »), ses phrases.
- **Une seule police** : Archivo variable (graisse et largeur), hébergée localement. Titres en gras semi-condensé
  (écho moderne des titres condensés de son site Wix), texte en largeur normale.
- **Couleurs** : fond blanc, gris clair pour l'alternance, anthracite (`#1a1f24`, ses structures alu) pour les bandeaux,
  bleu `#0072a8` (contraste AA) pour les actions, bleu du logo pour les accents. Thème sombre automatique
  (`light-dark()`), sans bouton ; `?theme=dark` pour les essais.
- **Accueil** : photo + titre + « Demander un devis gratuit » + téléphone dès le premier écran (téléphone compris) →
  bandeau de preuves (30+ ans, devis gratuit, croquis 3D, sur mesure) → « Améliorez le confort de votre habitation »
  + sa devise → produits en photos → **« Pourquoi choisir JMI Verandas ? »** avec « le patron vous accompagne pas à
  pas » et sa liste « c'est bénéficier de » en étapes numérotées (dans son ordre) → bandeau « qualité-prix » →
  réalisations → carte des communes → « Contactez M. Pierrot Jean-Michel » (GSM + fixe).
- **Mouvement, peu et utile** : rien n'est caché au chargement (seuls les blocs sous l'écran apparaissent en fondu),
  photo d'arrivée qui se pose, compteur « 30+ », ligne « pas à pas » qui se remplit au défilement, contour des
  provinces qui se dessine, survols des photos et boutons. `prefers-reduced-motion` coupe tout.
- **Avis Facebook** : absents de son site, donc masqués (`site.json` → `showReviews: false`). Pour les lui montrer :
  ajouter `?avis=1` à l'adresse (accueil ou réalisations). S'il accepte : `showReviews: true`.
- **Fixe 061 46 68 66** : présent sur son site (lien de la page `/contact-1`), confirmé valide le 15/10/2026.

### v6.1 (15 octobre 2026) : finitions design et performance

Après analyse de toutes les pages (bureau, téléphone, thème sombre) et une veille de 8 sites du secteur (Renson,
Solarlux, Veranco, Akena, Reynaers, Les Vérandas 4 Saisons, AT Véranda, Veranda Line ; captures dans le dossier de
travail de la session) :

- **Logo vectoriel** (`src/partials/logo.html`), redessiné d'après son logo 148 × 69 px et le monogramme « icoon » du
  site Wix (les originaux sur Wix sont aussi petits) ; net sur tous les écrans. **À faire valider** ; un fichier
  vectoriel officiel le remplacerait.
- **Icônes au trait « croquis »** (`src/partials/icons.html`, sprite SVG) pour chaque famille de produits : cartes
  produits, liste de devis, choix du formulaire, pied de page. Tracé animé à l'apparition.
- **En-tête transparent** posé sur la photo (accueil, Véranda & châssis), qui devient blanc au défilement.
- **Accueil sur téléphone** : la photo entière en haut, le texte dessous ; la barre « Appeler / Devis gratuit »
  n'apparaît qu'une fois les boutons de l'accueil dépassés.
- **Sa devise en grand** (« Allez dehors en restant dedans… ») comme respiration entre présentation et produits ;
  aplat bleu décalé derrière la photo de présentation ; carte « Le patron » (nom + GSM) sous « Pourquoi choisir » ;
  fond « papier millimétré » discret ; photo du bandeau qualité-prix qui glisse au défilement.
- **Carte** : seulement les deux provinces, étiquettes détourées ; **galerie** en grille régulière (photos verticales
  sur deux rangées, légendes d'origine en pastilles) ; **Contact** : photo à côté du titre ; pied de page en fiche
  de contact avec icônes.
- **Typographie française** automatique au build (espace fine insécable avant ; : ! ? et dans « »).
- **Transitions douces entre pages** (View Transitions, navigateurs récents).
- **Performance** : police réduite aux caractères utiles et aux plages de graisse et de largeur employées (90 → 72 Ko),
  préchargement de la photo d'en-tête, apparitions sans mesure forcée de la mise en page, `content-visibility` sur les
  sections hors écran. Lighthouse mobile : accueil 89 → 99 (LCP 2,9 → 2,0 s, TBT 260 → 30-80 ms).

Écartés faute de matière réelle : photo du patron ou de l'équipe, avant/après de chantiers.

## 5. Contact et devis

- Assistant en 3 étapes (projet → détails → coordonnées), pré-rempli depuis les pages produit (`?projet=pergola-bioclimatique`).
- Sans serveur : le message est préparé et ouvert dans le client mail (`mailto:`), avec bouton « copier ». Si un service de formulaire est configuré (`formEndpoint` dans `site.json`), l'envoi se fait en direct avec confirmation, comme sur le site Wix.
- Horaires affichés avec un état « ouvert / fermé » calculé en heure de Bruxelles.

## 6. SEO et technique

- Une balise `title` / `description` par page, Open Graph, JSON-LD `HomeAndConstructionBusiness` (adresse, coordonnées GPS, zone desservie, horaires, TVA), `sitemap.xml`, `robots.txt`.
- Images : WebP en 4 tailles + `srcset`, dimensions déclarées (pas de saut de mise en page), chargement différé.
- Accessibilité : lien d'évitement, focus visible, contrastes AA, visionneuse en `<dialog>`, formulaires étiquetés avec erreurs annoncées.

## 7. Arborescence

```
src/pages/*.html        pages (gabarit + variables)
src/partials/*.html     mise en page, en-tête, pied de page, bandeau d'appel, carte de zone générée
src/data/gallery.json   photos de la page Réalisations (légendes, catégories)
src/css, src/js         styles et scripts (un fichier JS par fonction)
src/fonts, src/img-src  polices et photos sources
src/static/             copié tel quel (logo, icônes, image de partage)
site.json               coordonnées, horaires, URL, formEndpoint
tools/build.py          assemble tout vers public/ et contrôle liens, ancres, images
tools/dev.py, dev.sh    build + serveur local (gzip) sur http://127.0.0.1:8765, reconstruction automatique
tools/make_*.py         carte de zone, icônes, image de partage
public/                 site généré (ne pas éditer à la main)
README.md               mode d'emploi    docs/MIGRATION.md   passage de Wix à la v2
```

## 8. À valider avec Jean-Michel

- **Horaires** : lesquels sont les bons ? (le site affiche ceux de la page Contact).
- **Avis Facebook** : les afficher ? (aperçu avec `?avis=1`).
- **« Plus de 30 ans »** (la page cachée dit 29 ans).
- **Textes de présentation des produits** : écrits à partir des photos et des intitulés du site Wix ; à relire.
- **« Permis de construire »** : le site dit seulement que c'est un avantage ; la v2 écrit « nous vous aidons dans vos démarches de permis » : à confirmer.
- **Légendes et lieux des photos** : seuls Arlon, Marche, Bertrix et Beauraing viennent du site d'origine.
- **Photos d'origine en haute résolution** (le site Wix les a réduites ; plusieurs sont en 640×480 ou 360×240).
- **Logo en vectoriel** (le fichier actuel fait 148×69 px).
- **Page Facebook** : à garder en lien.
- **Texte de confidentialité** : à faire relire (modèle simple, pas un avis juridique).

## 9. État et vérifications (13 octobre 2026)

Fait et vérifié :

- **HTML** : 0 erreur au validateur W3C (Nu) sur les 6 pages. Les erreurs CSS que ce validateur affiche (`light-dark()`, `animation-timeline`, `@view-transition`…) viennent de son retard sur le CSS récent, pas du site.
- **Navigateur réel (Chrome piloté)** : 0 erreur console ; simulateur (curseur, présélections, soleil/pluie), filtres, visionneuse (flèches, Échap, retour du focus, photos basse résolution à taille native), assistant de devis (pré-remplissage, validation, résultat), bascule de thème et thème sombre automatique, menu mobile, absence de défilement horizontal à 390 px.
- **Lighthouse** (serveur local avec gzip) : accessibilité, bonnes pratiques et SEO à 100 sur les 4 pages. Performance : 100 en version bureau ; en mobile simulé (processeur ralenti ×4) 90 sur l'accueil, 95 à 98 sur les autres pages.
- **Liens** : `build.py` vérifie à chaque génération tous les liens, ancres et images internes.
- **Sans JavaScript** : le texte et les liens restent lisibles ; simulateur et assistant de devis sont masqués, remplacés par le téléphone et l'e-mail.

Non vérifié :

- Safari et Firefox (seul Chrome a été utilisé), vrai téléphone, lecteur d'écran.
- Mesures de performance sur un vrai hébergement (compression, cache, CDN).
- L'envoi réel du formulaire (`formEndpoint` est vide : seul le chemin `mailto:` est testé).
- La réception de l'e-mail de devis par Jean-Michel.

Décisions de conception notables :

- Le titre de chaque page apparaît par animation CSS immédiate (et non par le JavaScript) : c'est lui l'élément le plus gros affiché, il ne doit pas attendre.
- Thème clair/sombre défini une seule fois avec `light-dark()` ; pas de filtre global.
- Polices hébergées localement : aucune requête vers Google, donc aucune bannière de cookies à prévoir.
