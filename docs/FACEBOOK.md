# Publications Facebook sur le site

## Ce qui a été constaté (13 octobre 2026)

- La page « JMI Pierrot jean-michel » : 217 abonnés, « Recommandé par 100 % (5 avis) ».
- Sa dernière publication (20 avril) est une **affiche d'événement local** (Nocturne VTT, Corbion) : ce n'est pas une
  réalisation. Afficher aveuglément « les deux dernières publications » montrerait donc ce genre de contenu.
- Le plugin d'intégration de Facebook (Page Plugin) n'affiche **aucune publication** pour cette page (seulement le
  nombre d'abonnés) : on ne peut pas l'utiliser. Il déposerait en plus des cookies Facebook sur le site.

## Ce qui est en place

`src/data/facebook.json` contient les chiffres de la page, un avis et la liste `posts`. Seules les publications avec
`"show": true` sont affichées (au plus deux, les plus récentes d'abord). Aujourd'hui aucune n'est affichée : la section
montre la note et les avis, et un lien vers la page.

Deux façons d'alimenter les publications :

1. **À la main** : ajouter une entrée dans `posts` (id commençant par `manual-`, date, texte, image dans `src/img-src/`,
   lien) avec `"show": true`.
2. **Automatique** : `tools/fetch_facebook.py` lit les dernières publications par l'API Graph, ne garde celles dont le
   texte contient un mot de `filter_keywords` (véranda, pergola, châssis…) **et** qui ont une photo, télécharge la photo
   (les adresses d'images Facebook expirent) et réécrit le fichier. Le workflow GitHub s'exécute chaque matin.

## Pour activer l'automatique (à faire par le propriétaire de la page)

1. Créer une application sur https://developers.facebook.com (type « Entreprise »), l'associer à la page.
2. Générer un **jeton d'accès de Page de longue durée** avec les autorisations `pages_show_list` et
   `pages_read_engagement`.
3. Dans GitHub (dépôt → Settings → Secrets and variables → Actions) : créer `FB_PAGE_ID` et `FB_PAGE_TOKEN`.
4. Lancer le workflow à la main une fois et vérifier le résultat.

Limites : le jeton doit être renouvelé s'il expire ; l'accès à l'API peut demander une vérification de l'application par
Meta. Ce chemin n'a pas pu être testé faute de jeton.
