
// --- VARIABLES D'ÉTAT ---
// Ces variables gardent en mémoire l'état actuel de la page.

let allMemories = []; // Contiendra toutes les mémoires après chargement du JSON.
let allEssences = []; // Contiendra toutes les essences après chargement du JSON.
let allItemsObj = {};
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
            englishMemoriesResponse,
            currentLangMemoriesResponse,
            englishEssencesResponse, 
            currentLangEssencesResponse
        ] = await Promise.all([
            fetch(`assets/data/ui_strings.json?v=${version}`),
            fetch(`assets/data/keywords.json?v=${version}`),
            fetch(`assets/data/travelers.json?v=${version}`),
            fetch(`assets/data/locales/en-US/achievements.json?v=${version}`),
            fetch(`assets/data/locales/en-US/memories.json?v=${version}`),
            fetch(`assets/data/locales/${lang}/memories.json?v=${version}`),
            fetch(`assets/data/locales/en-US/essences.json?v=${version}`),
            fetch(`assets/data/locales/${lang}/essences.json?v=${version}`)
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

        // On stocke les données anglaises dans un format clé -> objet
        if (englishMemoriesResponse.ok) {
            englishMemories = await englishMemoriesResponse.json();
        }

        let currentLangData = {};
        if (currentLangMemoriesResponse.ok) {
            currentLangData = await currentLangMemoriesResponse.json();
        } else if (lang !== 'en-US') {
            // Fallback sur l'anglais si la langue n'est pas trouvée
            currentLangData = englishMemories;
        }

        // On fusionne les données correctement pour garantir que `englishName` est toujours correct
        allMemories = Object.keys(currentLangData).map(key => {
            const translatedMemory = currentLangData[key];
            const englishMemory = englishMemories[key] || {};
            let obj = {
                ...englishMemory,          // On met les données anglaises en base
                ...translatedMemory,       // On écrase avec les traductions
                id: key,                   // On garantit un ID stable
                englishName: englishMemory.name || '' // On garantit que englishName est bien le nom anglais
            };
            allItemsObj[key] = obj;
            return obj;
        });

        if (englishEssencesResponse.ok) {
            englishEssences = await englishEssencesResponse.json();
        }

        let currentLangData2 = {};
        if (currentLangEssencesResponse.ok) {
            currentLangData2 = await currentLangEssencesResponse.json();
        } else if (lang !== 'en-US') {
            currentLangData2 = englishEssences;
        }

        allEssences = Object.keys(currentLangData2).map(key => {
            const translatedEssence = currentLangData2[key];
            const englishEssence = englishEssences[key] || {};
            let obj = {
                ...englishEssence,
                ...translatedEssence,
                id: key,
                englishName: englishEssence.name || ''
            };
            allItemsObj[key] = obj;
            return obj;
        });

        // --- ÉTAPE 2: MODIFICATION DE LA PAGE (inchangée) ---
        const T = translations[lang] || translations['en-US'];
        
        highlightActiveNav('deja-vu');
        // Cette ligne met à jour la valeur du sélecteur de langue
        [document.getElementById('language-selector'), document.getElementById('language-selector-mobile')]
            .forEach(selector => { if (selector) selector.value = lang; });

        document.querySelectorAll('[data-info]').forEach(el => {
            el.textContent = T[el.dataset.info];
        });
        let currentSet = JSON.parse(localStorage.getItem('currentSet')) || {};
        let totalLvl = 0;
        document.querySelectorAll('[data-item]').forEach(el => {
            if (allItemsObj[el.dataset.item]) {
                let { name, rarity } = allItemsObj[el.dataset.item];
                let maxLevel = rarity === "Common" ? 6: rarity === "Rare" ? 5: rarity === "Epic" ? 4: 3;
                totalLvl += maxLevel;
                if (!currentSet[el.dataset.item]) {
                    currentSet[el.dataset.item] = {
                        name,
                        rarity,
                        level: 0,
                        maxLevel,
                    };
                }
                let currentLevel = currentSet[el.dataset.item].level;
                let lvlHTML = "";
                for (let index = 0; index < maxLevel; index++) {
                    lvlHTML += `<div class=""></div>`;
                }
                let html = `
                <figure class="flex-shrink-0">
                    <img src="assets/game/images/${allItemsObj[el.dataset.item].image}" alt="${name}" class="w-16 h-16">
                </figure>
                <div class="item_progress">
                    ${lvlHTML}
                    <div class="item_progress-control item_progress-minus" data-sign="-" title="Reduce ${name} level">-</div>
                    <div class="item_progress-control item_progress-plus" data-sign="+" title="Increase ${name} level">+</div>
                </div>
                `;
                el.dataset.rarity = rarity;
                el.dataset.level = currentLevel;
                if (currentLevel === maxLevel) {
                    el.dataset.complete = true;
                }
                el.classList.add(`card-bg-${rarity}`, "shadow-xl");
                el.title = name;
                el.innerHTML = html;
                el.querySelector(".item_progress-minus").addEventListener("click", () => {
                    let newLevel = +el.dataset.level - 1;
                    currentSet[el.dataset.item].level = newLevel;
                    el.dataset.complete = false;
                    el.dataset.level = newLevel;
                    localStorage.setItem('currentSet', JSON.stringify(currentSet));
                    calculateProgress(currentSet);
                });
                el.querySelector(".item_progress-plus").addEventListener("click", () => {
                    let newLevel = +el.dataset.level + 1;
                    currentSet[el.dataset.item].level = newLevel;
                    el.dataset.level = newLevel;
                    if (newLevel === maxLevel) {
                        el.dataset.complete = true;
                    }
                    localStorage.setItem('currentSet', JSON.stringify(currentSet));
                    calculateProgress(currentSet);
                });
            }
        });

        let resetSpan = document.getElementById("deja-vu-amount");

        resetSpan.addEventListener("click", () => {
            localStorage.removeItem('currentSet');
            location.reload();
        });

        resetSpan.addEventListener("contextmenu", () => {
            console.log(currentSet, localStorage.getItem('currentSet').length);
        });

        function calculateProgress(obj) {
            let currentTotal = 0;
            document.querySelectorAll('[data-item]').forEach(el => {
                currentTotal += +el.dataset.level;
            });
            let value = Math.round(currentTotal / totalLvl * 10000) / 100;
            resetSpan.textContent = `(${value}%)`;
        }
        calculateProgress(currentSet);
        // On rend tous les éléments traduits visibles avec une transition douce
        document.querySelectorAll('.translate-on-load').forEach(el => {
            el.classList.add('loaded');
        });
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        document.getElementById('deja-vu-container').innerHTML = `<p class="text-center text-red-500">Oups, une erreur est survenue !<br>Message : ${error.message}</p>`;
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