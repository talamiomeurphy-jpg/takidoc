# Kit Taki — TakiDoc

## Fichiers
- `components/taki/taki.html` : structure et dessin SVG.
- `css/taki/taki.css` : apparence, volumes et styles.
- `css/taki/taki-animations.css` : mouvements et états.
- `js/taki/taki.js` : chargement et pilotage de Taki.

## Test dans une page HTML
Dans le `<head>` :
```html
<link rel="stylesheet" href="/css/taki/taki.css">
<link rel="stylesheet" href="/css/taki/taki-animations.css">
```
Dans le `<body>` :
```html
<div id="taki-mount"></div>
<script src="/js/taki/taki.js"></script>
<script>
  let taki;
  TakiMascot.mount("#taki-mount").then(instance => {
    taki = instance;
    // États disponibles :
    // taki.setState("thinking");
    // taki.setState("working");
    // taki.setState("celebrating");
    // taki.setState("error");
  }).catch(console.error);
</script>
```

Le chargement suppose que le serveur expose `/components/taki/taki.html`.
Si ton serveur sert les fichiers depuis un autre dossier, passe l'URL correcte :
`TakiMascot.mount("#taki-mount", { templateUrl: "/chemin/taki.html" })`.

Ce kit est autonome : il ne modifie aucun fichier existant et n'est pas encore relié au vrai statut du générateur.
