# eldoom CBE cf - Etat interne courant

Ce fichier sert a reprendre le projet rapidement. Il doit rester court, actuel et oriente decision. Les details historiques et actions recentes vont dans `_agents/ACTIVITY_LOG.md`.

## Etat courant

eldoom CBE cf est une application web statique de lecture, visualisation, edition et export de referentiels de competences Moodle CSV.

Structure observee :
- `index.html` porte la structure de l'application et charge les scripts globaux.
- `assets/JS/Model/csvParser.js` lit les CSV Moodle avec PapaParse apres normalisation de l'en-tete.
- `assets/JS/Controller/startPanelController.js` gere les samples, l'import fichier, le chargement distant et les parametres URL.
- `assets/JS/commonUtils.js` gere le hash `#mode=...&file=...&ids=...`.
- `assets/CSS/customs.css` porte le style applicatif principal.
- `framework_samples/samples.json` indexe les exemples locaux.

Le depot est propre au moment de cette mise en place (`master...origin/master`, pas de modifications suivies avant ajout de cette meta-documentation).

## Reference PROSPECTRE

Le projet PROSPECTRE local sert de modele de travail agents :

`C:\Users\prbel\Documents\amU\Post-Doc IA\GT SNT\PROSPECTRE`

Elements repris :
- `AGENTS.md` racine comme point d'entree automatique.
- `.agents/PROJECT_STATE.md` pour l'etat durable court.
- `_agents/ACTIVITY_LOG.md` pour le journal recent.
- `_agents/docs/` pour les notes techniques et analyses plus longues.

Adaptation eldoom : rester plus leger que PROSPECTRE, car le depot est plus petit et statique.

## Premiere tache cible

Ajouter dans eldoom un bouton de menu haut, juste avant le switch d'edition, pour ouvrir le graphe PROSPECTRE dans une nouvelle fenetre a partir du CSV courant.

Connaissances deja etablies :
- PROSPECTRE charge une ressource distante avec `?source={url}`.
- Si la ressource distante est un `.csv`, PROSPECTRE verifie `isLikelyMoodleCompetencyCsv`, convertit via `convertMoodleCompetencyCsv`, puis charge le pack en memoire.
- eldoom charge deja un CSV distant si le hash contient `file=http...csv`.
- eldoom charge un sample local via `framework_samples/{fileName}` ou via les chemins de `samples.json`.
- Pour un sample local public, l'URL distante probable est `https://eldoomcbe.github.io/cf/{sample.path}`.

Point de vigilance :
- `App.utilities.updateURL()` concatene actuellement `&file=${fileName}` sans `encodeURIComponent`; les URLs contenant `&`, `#`, espaces ou caracteres speciaux peuvent etre fragiles.

## Verification minimale future

Pour la tache bouton PROSPECTRE :
1. Verifier la syntaxe des fichiers JS touches avec `node --check` si possible.
2. Servir le site localement via HTTP.
3. Charger un sample local puis verifier que le bouton construit une URL PROSPECTRE `?source=...`.
4. Charger une URL distante eldoom puis verifier que la meme URL CSV est reutilisee.
5. Verifier que le bouton est desactive ou signale proprement l'absence de CSV courant.

## Contraintes

- Ne pas creer de commit, branche ou push sans demande explicite.
- Ne pas deplacer le runtime public.
- Eviter les refactors larges pendant une tache UX ciblee.
- Ne pas modifier les fichiers vendores sous `assets/JS/tinymce/` sauf demande explicite.
