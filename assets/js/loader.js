// assets/js/loader.js (CORRIGÉ)

(function() {
    const siteVersion = "1.0.8";
    window.siteVersion = siteVersion;

    const loaderScriptTag = document.currentScript;
    const pageScript = loaderScriptTag.getAttribute('data-page-script');

    // Chemins vers les fichiers
    const cssUrl = `assets/css/style.css?v=${siteVersion}`;
    const commonScriptUrl = `assets/js/common.js?v=${siteVersion}`;
    const pageScriptUrl = `assets/js/${pageScript}?v=${siteVersion}`;

    // Charger le CSS (ne change pas)
    const linkTag = document.createElement('link');
    linkTag.rel = 'stylesheet';
    linkTag.href = cssUrl;
    document.head.appendChild(linkTag);
    
    // --- Logique de chargement des scripts corrigée ---

    // 1. On crée la balise pour le script COMMUN
    const commonScriptTag = document.createElement('script');
    commonScriptTag.defer = true;
    commonScriptTag.src = commonScriptUrl;

    // 2. ON DIT AU NAVIGATEUR QUOI FAIRE QUAND COMMON.JS A FINI DE CHARGER
    commonScriptTag.onload = function() {
        // Cette fonction se déclenche SEULEMENT après que common.js est prêt.
        
        // 3. Maintenant, on peut charger le script SPÉCIFIQUE à la page en toute sécurité.
        const scriptTag = document.createElement('script');
        scriptTag.defer = true;
        scriptTag.src = pageScriptUrl;
        document.head.appendChild(scriptTag);
    };

    // 4. On ajoute le script COMMUN au document pour lancer le processus.
    document.head.appendChild(commonScriptTag);

})();