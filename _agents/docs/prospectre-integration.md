# Integration eldoom vers PROSPECTRE

Note de reprise pour la premiere tache d'integration.

## Objectif fonctionnel

Ajouter dans la barre haute eldoom un bouton, place juste avant le switch d'edition, qui ouvre PROSPECTRE dans une nouvelle fenetre avec le CSV courant precharge comme graphe.

Bouton attendu :
- visible dans le menu haut, cote droit;
- icone + label;
- action `window.open(...)` avec `noopener`;
- desactive ou non actionnable tant qu'aucun CSV exploitable n'est charge.

## Cible PROSPECTRE

PROSPECTRE accepte une ressource distante avec :

```text
index.html?source={URL_CSV_ENCODEE}
```

Le code repere dans PROSPECTRE :
- `assets/js/main.js:getUrlLaunchRequest()` lit `source`, puis `url`, puis `file`.
- `loadRemoteResource()` resout l'URL, detecte l'extension et traite les `.csv`.
- Pour un `.csv`, PROSPECTRE appelle `isLikelyMoodleCompetencyCsv(text)`.
- Si le CSV est reconnu, `convertMoodleCompetencyCsv(text, { fileName })` produit un pack temporaire.
- `loadRemoteMoodlePack()` charge ce pack et remplace l'URL par `?source=...`.

Conclusion : le format le plus explicite pour eldoom est `PROSPECTRE_URL?source=${encodeURIComponent(csvUrl)}`.

## Sources CSV cote eldoom

Cas a gerer :

1. CSV distant deja dans l'URL eldoom.
   - `App.utilities.getURLParams().fileName` peut etre une URL `http` ou `https`.
   - Dans ce cas, reutiliser cette URL telle quelle apres validation `new URL(...)`.

2. Sample local charge depuis `framework_samples/samples.json`.
   - Les entrees ont un `path`, par exemple `framework_samples/2024_Sample_template.csv`.
   - L'URL publique equivalente est probablement :

```text
https://eldoomcbe.github.io/cf/{path encode par segments}
```

   - Il faudra conserver le `path` original au moment du clic sample; le simple `fileName` perd le dossier et peut etre ambigu.

3. Fichier local importe par `<input type="file">`.
   - Il n'a pas d'URL distante disponible.
   - Le bouton doit rester desactive ou afficher une alerte claire : PROSPECTRE ne peut pas ouvrir ce fichier dans une nouvelle fenetre distante sans upload ou Blob partage.

4. JSON direct ou generateur.
   - Pas de CSV source distante.
   - Meme comportement que le fichier local : bouton indisponible.

## Etat technique eldoom

Fichiers probablement touches :
- `index.html` pour ajouter le bouton avant `#editSwitch`.
- `assets/JS/Controller/startPanelController.js` pour memoriser l'origine CSV courante et brancher le clic.
- Eventuellement `assets/JS/Model/appState.js` pour ajouter un champ `sourceCsvUrl` ou `sourceCsvPath`.
- Eventuellement `assets/CSS/customs.css` pour ajuster l'espacement du bouton dans la navbar.

Pieces existantes :
- `handleFileLoad(fileName, alertMessage)` met a jour `appState.fileName`, les stats, l'URL et le titre.
- `handleSampleFileSelect(path, fileName)` connait le `path` du sample, mais ne le conserve pas actuellement.
- `handleFileSelect(event)` connait un `File`, mais pas d'URL distante.
- `handleURLFile()` reconstruit `filePath` depuis `fileName`; si `fileName.startsWith('http')`, la source distante est directement disponible.

## Proposition d'implementation

Ajouter dans `appState` :

```js
sourceCsvUrl: '',
sourceCsvPath: '',
sourceCsvKind: ''
```

Ajouter des helpers dans `startPanelController.js` :
- `setCurrentCsvSource({ kind, url, path })`
- `getCurrentCsvRemoteUrl()`
- `toPublicCfUrl(path)`
- `updateProspectreButtonState()`
- `openCurrentCsvInProspectre()`

Ajouter une constante configurable :

```js
const PROSPECTRE_BASE_URL = 'https://reseau-prospectre.github.io/explorer/';
```

Construire l'URL :

```js
const prospectreUrl = `${PROSPECTRE_BASE_URL}?source=${encodeURIComponent(csvUrl)}`;
```

## Verification

Verifier au minimum :
- sample local : le bouton ouvre `?source=https%3A%2F%2Feldoomcbe.github.io%2Fcf%2Fframework_samples%2F...csv`;
- URL distante eldoom : le bouton reutilise l'URL distante exacte;
- fichier local : bouton desactive ou alerte explicite;
- edition on/off : le bouton reste place avant le switch et ne casse pas `#sub-nav`.

## Risques

- Encodage actuel de `App.utilities.updateURL()` : `fileName` est concatene sans `encodeURIComponent`.
- Perte du chemin source pour les samples : `fileName = filePath.split('/').pop()` ne suffit pas pour deduire une URL publique robuste.
- CORS : les CSV GitHub Pages eldoom devraient etre lisibles par PROSPECTRE; les URLs tierces peuvent echouer selon leur serveur.
- Popup blockers : preferer un clic utilisateur direct pour `window.open`.
