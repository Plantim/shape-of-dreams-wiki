
// --- VARIABLES D'ÉTAT ---
// Ces variables gardent en mémoire l'état actuel de la page.

let allMemories = []; // Contiendra toutes les mémoires après chargement du JSON.
let englishMemories = {}; // Contiendra les mémoires en anglais pour les ajouter.
let allAchievements = {}; // Contiendra les données des succès (achievements.json).
let filteredMemories = []; // Contiendra les mémoires affichées après application des filtres.
let translations = {}; // Contiendra les traductions pour l'interface utilisateur.

// stockent l'état actuel de vos filtres et de votre barre de recherche
let activeRarityFilter = ''; // Singulier et initialisé comme une chaîne vide
let activeElementFilter = '';
let activeTagFilter = '';
let activeTravelerFilter = '';

let searchQuery = ''; // Le texte actuellement tapé dans la barre de recherche.
let activeStatFilter = ''; // filtre AD/AP Initialisé comme une chaîne vide

// Nouvelle variable d'état pour le niveau
let currentLevel = 0;

// Nouvelle variable pour stocker TOUTES les traductions de noms de héros
let allTravelerNames = {}; 
let allKeywords = {}; // Contiendra les mots-clés traduits (ui_keywords_localized.json).

// Dictionnaire pour traduire les ID de voyageur en noms affichables
// On le vide car il sera rempli dynamiquement
const travelerNames = {};

// --- INITIALISATION ---
// La fonction `init` est le point de départ. Elle est `async` car elle attend le chargement des données.


const init = async (lang) => {
    try {
        // --- ÉTAPE 1: CHARGEMENT DE TOUTES LES DONNÉES ---
        const version = siteVersion; // On accède directement à la variable globale

        // Afficher la version dans le coin inférieur droit
        document.getElementById('version-display').textContent = `v${version}`;

        const [
            translationsResponse,
            keywordsResponse,
            travelersResponse,
            achievementsResponse,
        ] = await Promise.all([
            fetch(`assets/data/ui_strings.json?v=${version}`),
            fetch(`assets/data/keywords.json?v=${version}`),
            fetch(`assets/data/travelers.json?v=${version}`),
            fetch(`assets/data/locales/en-US/achievements.json?v=${version}`),
        ]);

        if (!translationsResponse.ok) throw new Error("Le fichier translations.json est introuvable.");
        if (!keywordsResponse.ok) throw new Error("Le fichier ui_keywords_localized.json est introuvable.");

        translations = await translationsResponse.json();
        allKeywords = await keywordsResponse.json();
        if (travelersResponse.ok) allTravelerNames = await travelersResponse.json();
        
        if (achievementsResponse.ok) {
            const achievementsData = await achievementsResponse.json();
            allAchievements = Object.fromEntries(Object.values(achievementsData).map(ach => [ach.name, ach]));
        }

        // --- ÉTAPE 2: MODIFICATION DE LA PAGE (inchangée) ---
        const T = translations[lang] || translations['en-US'];
        
        highlightActiveNav('rest');
        // Cette ligne met à jour la valeur du sélecteur de langue
        [document.getElementById('language-selector'), document.getElementById('language-selector-mobile')]
            .forEach(selector => { if (selector) selector.value = lang; });

        document.querySelectorAll('[data-info]').forEach(el => {
            el.textContent = T[el.dataset.info];
        });
        // On rend tous les éléments traduits visibles avec une transition douce
        document.querySelectorAll('.translate-on-load').forEach(el => {
            el.classList.add('loaded');
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
    }
};


// --- GESTION DES ÉVÉNEMENTS ---

// Met en place l'écouteur d'événements pour le sélecteur de langue.

const setupLanguageSelector = () => {
    const langSelectors = [
        document.getElementById('language-selector'),
        document.getElementById('language-selector-mobile')
    ];

    langSelectors.forEach(selector => {
        selector.addEventListener('change', (event) => {
            const newLang = event.target.value;
            saveLanguage(newLang);
            init(newLang);
        });
    });
};


// --- FONCTIONS UTILITAIRES (HELPERS) ---

// --- DÉMARRAGE DU SCRIPT ---
const main = () => {
    setupLanguageSelector();
    const initialLang = getLanguage();
    init(initialLang);
};

// Logique de chargement sécurisée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}