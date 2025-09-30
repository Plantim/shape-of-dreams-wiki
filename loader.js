(function() {
    // ==========================================================
    // === LE SEUL ENDROIT À MODIFIER POUR TOUT LE SITE ===
    const siteVersion = "1.0.5";
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

    // 4. On injecte les fichiers CSS et JS dans le HTML avec la bonne version
    // Le document.write permet de s'assurer que les fichiers sont chargés et lus avant que la page ne s'affiche
    document.write(`<link rel="stylesheet" href="${cssUrl}">`);
    document.write(`<script defer src="${pageScriptUrl}"><\/script>`);

})();