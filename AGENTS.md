# Instructions eldoom CBE cf pour Codex

## Role du fichier
- `AGENTS.md` reste a la racine : c'est le point d'entree detecte automatiquement par les agents Codex.
- Les documents de pilotage courts vivent dans `.agents/`.
- Les analyses, notes techniques, outils, scripts, captures et sorties regenerables vivent dans `_agents/`.
- Avant une passe architecture, refactor, UX ou integration PROSPECTRE, lire `.agents/PROJECT_STATE.md`.

## Contexte projet
- eldoom CBE cf est une application web statique pour lire, visualiser, editer et exporter des referentiels de competences Moodle CSV.
- Le runtime public doit rester simple : `index.html`, `about.html`, `love.html`, `assets/`, `framework_samples/`, README/LICENSE.
- Le code applicatif historique est en scripts globaux non modules sous `assets/JS/`, avec jQuery, Bootstrap, jsTree, PapaParse, Chart.js, D3, TagCanvas et TinyMCE.
- Le depot ne contient pas actuellement de pipeline npm local; verifier avec des checks statiques et un serveur web minimal quand necessaire.
- Le versioning Git, les commits, branches et push sont pilotes par l'utilisateur, sauf demande explicite.

## Reference methodologique
- PROSPECTRE sert de reference locale pour la methode agents : `C:\Users\prbel\Documents\amU\Post-Doc IA\GT SNT\PROSPECTRE`.
- Reprendre son principe, pas son volume : racine legere, `.agents/` court, `_agents/` pour le travail interne.
- Si une information devient structurelle et durable, la remonter dans `.agents/PROJECT_STATE.md`; sinon la consigner dans `_agents/ACTIVITY_LOG.md`.

## Verification
- Apres modification JS, lancer `node --check` sur les fichiers touches quand le fichier est syntaxiquement verifiable par Node.
- Pour HTML/CSS, privilegier une verification HTTP locale et une inspection navigateur quand l'interface change.
- Ne pas boucler sur un serveur ou navigateur bloque : noter le blocage, faire les checks statiques disponibles, puis demander la suite si necessaire.
- Attention : le chargement distant et les CDN peuvent necessiter un vrai serveur HTTP; eviter de conclure depuis un simple `file://`.

## Integration PROSPECTRE
- PROSPECTRE sait charger un CSV Moodle distant via `?source={URL_CSV_ENCODEE}`.
- eldoom sait deja charger un CSV distant via son hash `#mode=preview&file=...`, mais l'encodage actuel du parametre `file` doit etre surveille.
- La premiere integration vise un bouton dans le menu haut eldoom, place avant `#editSwitch`, ouvrant PROSPECTRE dans une nouvelle fenetre avec le CSV courant.
- Lire `_agents/docs/prospectre-integration.md` avant de commencer cette tache.

## Organisation attendue
- Garder le runtime public a la racine et dans `assets/` / `framework_samples/`.
- Garder les notes longues, scripts exploratoires et resultats d'analyse dans `_agents/`.
- Garder `.agents/` petit et utile pour une reprise rapide.
- Ne pas modifier les dependances vendorees, notamment TinyMCE, sans besoin explicite.
