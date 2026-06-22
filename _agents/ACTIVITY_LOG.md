# eldoom CBE cf - Journal interne court

Limiter ce fichier aux 20 dernieres entrees utiles. Supprimer les entrees obsoletes quand elles ne guident plus une reprise.

## Entrees recentes

- Correction de la cible PROSPECTRE publique : le bouton ouvre maintenant `https://reseau-prospectre.github.io/explorer/`.
- Ajustement UX du bouton PROSPECTRE : il est desormais invisible et hors focus tant qu'aucune URL CSV exploitable n'est disponible; libelle simplifie en `Voir en graphe` avec apparition animee.
- Ajout du bouton intelligent `Graphe PROSPECTRE` dans la navbar eldoom : il s'active pour un CSV distant ou un sample public, deduit l'URL CSV GitHub Pages et ouvre PROSPECTRE avec `?source=...`.
- Correction de l'encodage du parametre hash `file` dans `App.utilities.updateURL()` pour fiabiliser les URLs distantes et les noms de fichiers avec espaces/caracteres speciaux.
- Mise en place de la methode agents inspiree de PROSPECTRE : `AGENTS.md`, `.agents/PROJECT_STATE.md`, `_agents/ACTIVITY_LOG.md` et `_agents/docs/prospectre-integration.md`.
- Inspection de PROSPECTRE local : son organisation separe `AGENTS.md`, `.agents/PROJECT_STATE.md` et `_agents/` pour analyses, scripts et journal.
- Identification du mecanisme PROSPECTRE pour la future integration : `assets/js/main.js` lit `?source=`, `?url=` ou `?file=`; un CSV distant est converti via `assets/js/import/moodle-competency-csv.js`.
- Identification du mecanisme eldoom courant : `assets/JS/commonUtils.js` gere `#mode=...&file=...&ids=...`; `assets/JS/Controller/startPanelController.js` charge les samples locaux ou les URLs `http`.
- Point de vigilance ouvert : le parametre hash `file` eldoom n'est pas encode par `updateURL()`, alors que la future URL PROSPECTRE devra encoder strictement le CSV source.
