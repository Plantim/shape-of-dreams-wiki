document.addEventListener('DOMContentLoaded', () => {
    let translations = {};

    // --- Fonctions de gestion de la langue (identiques) ---
    const saveLanguage = (lang) => {
        localStorage.setItem('preferredLanguage', lang);
    };

    const getLanguage = () => {
        return localStorage.getItem('preferredLanguage') || navigator.language || 'en-US';
    };

    // --- Traduction de la page ---
    const translatePage = (lang) => {
        const T = translations[lang] || translations['en-US'];

        // Mettre à jour les textes spécifiques à la page d'accueil
        document.getElementById('main-title').textContent = T.homeTitle;
        document.getElementById('intro-text').textContent = T.homeIntro;
        document.getElementById('memories-card-title').textContent = T.memoriesCardTitle;
        document.getElementById('memories-card-desc').textContent = T.memoriesCardDesc;
        document.getElementById('essences-card-title').textContent = T.essencesCardTitle;
        document.getElementById('essences-card-desc').textContent = T.essencesCardDesc;
        
        // Mettre à jour la barre de navigation
        document.querySelector('.nav-home-link').textContent = T.navHome;
        document.querySelector('.nav-memories-link').textContent = T.navMemories;
        document.querySelector('.nav-essences-link').textContent = T.navEssences;
        // TRADUCTION DU PIED DE PAGE
        document.getElementById('footer-text').textContent = T.footerText;
    };

    // --- Configuration du sélecteur de langue ---
    const setupLanguageSelector = () => {
        const langSelectors = [
            document.getElementById('language-selector'),
            document.getElementById('language-selector-mobile')
        ];

        langSelectors.forEach(selector => {
            if (selector) {
                selector.addEventListener('change', (event) => {
                    const newLang = event.target.value;
                    saveLanguage(newLang);
                    translatePage(newLang);
                    // S'assurer que les deux sélecteurs sont synchronisés
                    langSelectors.forEach(s => { if(s) s.value = newLang });
                });
            }
        });
    };

    // --- Initialisation ---
    const init = async () => {
        try {
            const response = await fetch('rawdata/translations.json');
            if (!response.ok) throw new Error('translations.json not found');
            translations = await response.json();
            
            const currentLang = getLanguage();
            
            // Appliquer la traduction initiale
            translatePage(currentLang);
            
            // Mettre en évidence le lien de navigation actif (ici, "home" pour la page d'accueil)
            highlightActiveNav('home');
            
            // Mettre à jour la valeur des sélecteurs
            [document.getElementById('language-selector'), document.getElementById('language-selector-mobile')].forEach(s => {
                if(s) s.value = currentLang;
            });

        } catch (error) {
            console.error("Erreur lors du chargement des traductions:", error);
        }
    };



    // Fonction pour mettre en évidence le lien de navigation actif
    const highlightActiveNav = (activePage) => {
        // On retire d'abord la classe active de tous les liens de la navigation
        document.querySelectorAll('.nav-home-link, .nav-memories-link, .nav-essences-link').forEach(link => {
            link.classList.remove('nav-active');
        });

        // Ensuite, on ajoute la classe uniquement au lien de la page actuelle
        const activeLink = document.querySelector(`.nav-${activePage}-link`);
        if (activeLink) {
            activeLink.classList.add('nav-active');
        }
    };


    init();
    setupLanguageSelector();
});