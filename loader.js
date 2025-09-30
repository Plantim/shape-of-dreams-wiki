(function() {
    // ==========================================================
    // === A MODIFIER EGALEMENT DANS LES FICHIERS HTML (le script python modifie partout) ===
    const siteVersion = "1.0.6";
    // ==========================================================


    // --- Logique interne (pas besoin de toucher à ce qui suit) ---

    // 1. On rend la variable 'siteVersion' disponible pour les autres scripts (memories.js, etc.)
    window.siteVersion = siteVersion;

    // 2. On récupère la balise <script> qui a chargé ce fichier loader.js
    const loaderScriptTag = document.currentScript;
    // On lit l'attribut "data-page-script" pour savoir quel script de page charger (ex: "index.js")
    const pageScript = loaderScriptTag.getAttribute('data-page-script');

    // 3. On crée les URL versionnées
    const cssUrl = `style.css?v=${siteVersion}`;
    const pageScriptUrl = `${pageScript}?v=${siteVersion}`;

    // Créer la balise <link> pour le CSS
    const linkTag = document.createElement('link');
    linkTag.rel = 'stylesheet';
    linkTag.href = cssUrl;
    document.head.appendChild(linkTag);

    // Créer la balise <script> pour le JS de la page
    const scriptTag = document.createElement('script');
    scriptTag.defer = true;
    scriptTag.src = pageScriptUrl;
    document.head.appendChild(scriptTag);

})();