
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
            englishMemoriesResponse, 
            currentLangMemoriesResponse
        ] = await Promise.all([
            fetch(`assets/data/ui_strings.json?v=${version}`),
            fetch(`assets/data/keywords.json?v=${version}`),
            fetch(`assets/data/travelers.json?v=${version}`),
            fetch(`assets/data/locales/en-US/achievements.json?v=${version}`),
            fetch(`assets/data/locales/en-US/memories.json?v=${version}`),
            fetch(`assets/data/locales/${lang}/memories.json?v=${version}`)
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
            return {
                ...englishMemory,          // On met les données anglaises en base
                ...translatedMemory,       // On écrase avec les traductions
                id: key,                   // On garantit un ID stable
                englishName: englishMemory.name || '' // On garantit que englishName est bien le nom anglais
            };
        });

        // --- ÉTAPE 2: MODIFICATION DE LA PAGE (inchangée) ---
        const T = translations[lang] || translations['en-US'];
        // Mettre à jour le titre de la page
        document.title = T.pageTitleMemories;
        document.getElementById('loading-text').textContent = T.loadingMemories;
        highlightActiveNav('memories');
        // Cette ligne met à jour la valeur du sélecteur de langue
        [document.getElementById('language-selector'), document.getElementById('language-selector-mobile')]
            .forEach(selector => { if (selector) selector.value = lang; });
        document.getElementById('search-input').placeholder = T.searchPlaceholder;
        document.getElementById('level-label-text').textContent = T.levelLabel;
        document.querySelector('.nav-home-link').textContent = T.navHome;
        document.querySelector('.nav-memories-link').textContent = T.navMemories;
        document.querySelector('.nav-essences-link').textContent = T.navEssences;
        document.getElementById('footer-text').textContent = T.footerText;
        // On rend tous les éléments traduits visibles avec une transition douce
        document.querySelectorAll('.translate-on-load').forEach(el => {
            el.classList.add('loaded');
        });

        filteredMemories = [...allMemories];
        populateFilters();
        renderMemories(filteredMemories);

    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        document.getElementById('memories-container').innerHTML = `<p class="text-center text-red-500">Oups, une erreur est survenue !<br>Message : ${error.message}</p>`;
    }
};


// --- GESTION DES ÉVÉNEMENTS ---

// Met en place l'écouteur d'événements pour la barre de recherche.
const setupSearch = () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // 'input' se déclenche à chaque fois que l'utilisateur tape ou supprime une lettre.
        searchInput.addEventListener('input', (event) => {
            searchQuery = removeAccents(event.target.value.toLowerCase()); // Met à jour la variable de recherche.
            applyFilters(); // Relance le filtrage et l'affichage.
        });
    }
};

// Met en place l'écouteur d'événements pour le slider de niveau.
const setupLevelSlider = () => {
    const levelSlider = document.getElementById('level-slider');
    const levelValueSpan = document.getElementById('level-value');
    if (levelSlider && levelValueSpan) {
        levelValueSpan.textContent = currentLevel; // Affiche la valeur initiale
        levelSlider.value = currentLevel;
        
        levelSlider.addEventListener('input', (event) => {
            currentLevel = parseInt(event.target.value, 10);
            levelValueSpan.textContent = currentLevel;
            applyFilters(); // Re-filtrez et mettez à jour l'affichage
        });
    }
};

// Met en place l'écouteur d'événements pour le sélecteur de langue.

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

                // 1. On affiche à nouveau l'état de chargement
                const container = document.getElementById('memories-container');
                const T = translations[newLang] || translations['en-US']; // On récupère la future traduction
                container.innerHTML = `
                    <span class="loading loading-spinner text-secondary loading-lg"></span>
                    <p id="loading-text" class="mt-4 text-center">${T ? T.loadingMemories : 'Loading memories...'}</p>
                `;

                // 2. On met à jour la valeur des deux sélecteurs
                langSelectors.forEach(s => { if(s) s.value = newLang });

                // 3. On relance le processus de chargement complet
                init(newLang);
            });
        }
    });
};

// --- POPULATION DES FILTRES ---
// Crée dynamiquement les boutons de filtres à partir des données.

const populateFilters = () => {
    populateRarityFilter();
    populateElementsFilter();
    populateTagsFilter();
    populateStatFilter();
    populateTravelerFilter();
};

// Crée les boutons pour les filtres de rareté.
const populateRarityFilter = () => {       
    const T = translations[getLanguage()] || translations['en-US']; // On récupère la langue actuelle
    const currentLang = getLanguage(); // <-- On récupère la langue actuelle pour la traduction des noms de voyageurs
    const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Unique', 'Character', 'Identity']; // On retire 'All'
    const rarityContainer = document.getElementById('rarity-filters'); // Le conteneur où les boutons seront ajoutés.
    
    // On utilise la traduction pour le titre du filtre
    rarityContainer.innerHTML = `<span class="font-bold">${T.rarityFilter}</span>`; 

    rarities.forEach(rarity => {
        const button = document.createElement('button');
        button.className = 'btn btn-sm rarity-filter-btn';
        // Si la rareté est déjà dans notre liste de filtres actifs, on la met en surbrillance
        if (activeRarityFilter === rarity) {
        button.classList.add('btn-active');
        }
        button.textContent = getKeywordDisplayName(rarity, 'rarities', currentLang, allKeywords);
        button.dataset.rarity = rarity;
        rarityContainer.appendChild(button);
    });
    
    // Ajoute un écouteur de clic à chaque bouton de rareté.
    document.querySelectorAll('.rarity-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const rarity = event.target.dataset.rarity;
            // Si on clique sur le bouton déjà actif, on le désactive. Sinon, on l'active.
            activeRarityFilter = activeRarityFilter === rarity ? '' : rarity;
            // On rafraîchit tous les boutons pour refléter le nouvel état
            populateRarityFilter();
            applyFilters();
        });
    });
};

// Crée les boutons pour les filtres d'éléments (logique similaire à la rareté).
const populateElementsFilter = () => {
    // 1. On récupère les traductions au début de la fonction
    const T = translations[getLanguage()] || translations['en-US'];
    const currentLang = getLanguage();
    const elementalTags = ['Cold', 'Fire', 'Light', 'Dark'];
    const elementsContainer = document.getElementById('elements-filters');
    
    // 2. On utilise la traduction pour le titre du filtre
    elementsContainer.innerHTML = `<span class="font-bold">${T.elementsFilter}</span>`;


    elementalTags.forEach(element => {
        const button = document.createElement('button');
        button.className = 'btn btn-sm element-filter-btn';
        if (activeElementFilter === element) {
            button.classList.add('btn-active');
        }
        button.textContent = getKeywordDisplayName(element, 'elements', currentLang, allKeywords);
        button.dataset.element = element;
        elementsContainer.appendChild(button);
    });        


    document.querySelectorAll('.element-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const element = event.target.dataset.element;
            activeElementFilter = activeElementFilter === element ? '' : element;
            populateElementsFilter();
            applyFilters();
        });
    });
};

// Crée les boutons pour les autres tags en les extrayant directement du JSON.
const populateTagsFilter = () => {
    // 1. On récupère les traductions
    const T = translations[getLanguage()] || translations['en-US'];
    const currentLang = getLanguage();
    const elementalTags = ['Cold', 'Fire', 'Light', 'Dark'];
    const allTags = [...new Set(allMemories.flatMap(m => m.tags || []))].sort();
    const tagsContainer = document.getElementById('tags-filters');

    // 2. On utilise la traduction pour le titre du filtre
    tagsContainer.innerHTML = `<span class="font-bold">${T.tagsFilter}</span>`;

    const otherTags = allTags.filter(tag => !elementalTags.includes(tag));

    otherTags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'btn btn-sm tag-filter-btn';
        const tagValue = tag.toLowerCase();
        if (activeTagFilter === tagValue) {
            button.classList.add('btn-active');
        }
        button.textContent = getKeywordDisplayName(tag, 'tags', currentLang, allKeywords);
        button.dataset.tag = tagValue;
        tagsContainer.appendChild(button);
    });

    document.querySelectorAll('.tag-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const tag = event.target.dataset.tag;
            activeTagFilter = activeTagFilter === tag ? '' : tag;
            populateTagsFilter();
            applyFilters();
        });
    });
};


// Crée les boutons pour les filtres de statistiques (AP/AD).
const populateStatFilter = () => {
    const T = translations[getLanguage()] || translations['en-US']; // On récupère la langue actuelle
    const statTypes = ['AP', 'AD']; // Les types de statistiques à filtrer
    const statContainer = document.getElementById('stat-filters'); // Le conteneur où les boutons seront ajoutés.
    
    // On utilise la traduction dynamique au lieu du texte en dur
    statContainer.innerHTML = `<span class="font-bold">${T.statFilter}</span>`; 

    statTypes.forEach(stat => {
        const button = document.createElement('button');
        // On garde vos classes pour la cohérence du style
        button.className = 'btn btn-sm stat-filter-btn rarity-filter-btn'; 
        
        // On applique la classe 'btn-active' si le filtre correspond
        if (stat === activeStatFilter) {
            button.classList.add('btn-active');
        }
        
        
        if (stat === 'AP') {
            // Remplace le texte "AP" par l'image du sprite 1
            button.innerHTML = `<img src="assets/game/sprites/1.png" class="inline-sprite" alt="AP Stat" style="width: 1.2em; height: 1.2em;" />`;
        } else if (stat === 'AD') {
            // Remplace le texte "AD" par l'image du sprite 2
            button.innerHTML = `<img src="assets/game/sprites/2.png" class="inline-sprite" alt="AD Stat" style="width: 1.2em; height: 1.2em;" />`;
        }

        button.dataset.stat = stat;
        statContainer.appendChild(button);
    });

    document.querySelectorAll('.stat-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const stat = event.currentTarget.dataset.stat;
            
            // Si on clique sur le bouton déjà actif, on le désactive. Sinon, on l'active.
            activeStatFilter = activeStatFilter === stat ? '' : stat;
            
            // On rafraîchit les boutons pour mettre à jour l'état visuel
            populateStatFilter(); 
            applyFilters();
        });
    });
};


// Crée les boutons pour les filtres de voyageurs.
const populateTravelerFilter = () => {
    const T = translations[getLanguage()] || translations['en-US'];
    const currentLang = getLanguage();

    // 1. Définissez l'ordre que vous souhaitez ici.
    // Utilisez les clés internes des voyageurs (ex: "Hero_Mist").
    const customOrder = [
        "Hero_Lacerta",
        "Hero_Mist",
        "Hero_Yubar",
        "Hero_Vesper",
        "Hero_Aurena",
        "Hero_Bismuth",
        "Hero_Nachia",
        "Hero_Husk"
    ];

    // 2. On récupère les voyageurs et on les trie selon votre liste.
    const travelers = [...new Set(allMemories.map(m => m.traveler).filter(Boolean))]
        .sort((a, b) => {
            const indexA = customOrder.indexOf(a);
            const indexB = customOrder.indexOf(b);
            // Si un voyageur n'est pas dans votre liste, on le met à la fin.
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

    const travelersContainer = document.getElementById('traveler-filters');

    // On utilise la traduction dynamique au lieu du texte en dur
    travelersContainer.innerHTML = `<span class="font-bold">${T.travelerFilter}</span>`;

    travelers.forEach(travelerKey => {
        const button = document.createElement('button');
        button.className = 'btn btn-sm traveler-filter-btn';
        if (activeTravelerFilter === travelerKey) {
            button.classList.add('btn-active');
        }
        button.textContent = getTravelerDisplayName(travelerKey, currentLang, allTravelerNames);
        button.dataset.traveler = travelerKey;
        travelersContainer.appendChild(button);
    });

    document.querySelectorAll('.traveler-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const traveler = event.target.dataset.traveler;
            activeTravelerFilter = activeTravelerFilter === traveler ? '' : traveler;
            populateTravelerFilter();
            applyFilters();
        });
    });
};

// --- LOGIQUE DE FILTRAGE ---
const applyFilters = () => {
    // La méthode `.filter()` crée un nouveau tableau avec uniquement les éléments qui passent le test.
    filteredMemories = allMemories.filter(memory => {
        // Test 1: La recherche textuelle (nom)
        // On vérifie si le nom ou le nom anglais contient la chaîne recherchée (insensible à la casse).
        const searchMatch = !searchQuery || 
            (memory.name && removeAccents(memory.name.toLowerCase()).includes(searchQuery)) ||
            (memory.englishName && removeAccents(memory.englishName.toLowerCase()).includes(searchQuery)) ||
            (memory.description && removeAccents(memory.description.toLowerCase()).includes(searchQuery));


        // Si le filtre est une chaîne vide, la condition est vraie (on montre tout)
        // Sinon, on vérifie la correspondance exacte.
        
        // Filtre de Rareté : la rareté doit être dans la liste des filtres actifs
        const rarityMatch = !activeRarityFilter || memory.rarity === activeRarityFilter;
        
        // Filtre d'Élément : l'élément doit être dans la liste
        const elementMatch = !activeElementFilter || (memory.tags && memory.tags.includes(activeElementFilter));
        
        // Filtre de Voyageur : le voyageur doit être dans la liste
        const travelerMatch = !activeTravelerFilter || memory.traveler === activeTravelerFilter;
        
        // Filtre de Tag : au moins un des tags de la mémoire doit être dans la liste
        const tagMatch = !activeTagFilter || (memory.tags && memory.tags.map(t => t.toLowerCase()).includes(activeTagFilter));
        
        // Filtre de Stat (inchangé, car c'est une sélection unique)
        let statMatch = true;
        // On vérifie le rawDescVars pour les valeurs basicAP et basicAD
        const hasDescVars = memory.rawDescVars && memory.rawDescVars.length > 0;
        
        if (activeStatFilter === 'AP') {
            statMatch = hasDescVars && memory.rawDescVars.some(descVar => 
                // Condition 1: Vérifie les données AP (comme avant)
                (descVar.data && ((descVar.data.basicAP || 0) > 0 || (descVar.data.addedAP || 0) > 0)) ||
                // Condition 2: OU vérifie la présence des sprites AP dans le texte rendu
                (descVar.rendered && (descVar.rendered.includes('<sprite=1>') || descVar.rendered.includes('<sprite=4>')))
            );
        } else if (activeStatFilter === 'AD') {
            statMatch = hasDescVars && memory.rawDescVars.some(descVar => 
                // Condition 1: Vérifie les données AD (comme avant)
                (descVar.data && ((descVar.data.basicAD || 0) > 0 || (descVar.data.addedAD || 0) > 0)) ||
                // Condition 2: OU vérifie la présence du sprite AD dans le texte rendu
                (descVar.rendered && descVar.rendered.includes('<sprite=2>'))
            );
        }
        
        // Une mémoire est gardée si elle passe TOUS les tests.
        return searchMatch && rarityMatch && elementMatch && travelerMatch && tagMatch && statMatch;
    });
    
    // Une fois le filtrage terminé, on met à jour l'affichage.
    renderMemories(filteredMemories);
};


// --- LOGIQUE D'AFFICHAGE (RENDU) ---
// Construit le HTML à partir des données filtrées.
const renderMemories = (memoriesToRender) => {
    const container = document.getElementById('memories-container');
    container.innerHTML = ''; // Vide le conteneur avant de le remplir à nouveau.

    // Crée un conteneur unique pour toutes les cartes
    const cardContainer = document.createElement('div');
    // C'est ici que l'on applique les classes de grille pour 1, 2 ou 3 colonnes
    cardContainer.className = 'w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6';
    // On ajoute ce conteneur au conteneur principal du site
    container.appendChild(cardContainer);

    // `reduce` est utilisé pour grouper les mémoires par rareté dans un objet.
    // ex: { "Common": [...], "Rare": [...] }
    const memoriesByRarity = memoriesToRender.reduce((acc, memory) => {
        const rarity = memory.rarity || 'Inconnue';
        if (!acc[rarity]) acc[rarity] = [];
        acc[rarity].push(memory);
        return acc;
    }, {});

    // On définit l'ordre d'affichage des sections pour une meilleure présentation.
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Unique', 'Character', 'Identity'];

    rarityOrder.forEach(rarity => {
        const memoriesInRarity = memoriesByRarity[rarity];
        if (memoriesInRarity && memoriesInRarity.length > 0) {
            
            
                // ---------------- Désactivé pour un affichage plus compact. ----------------
            // Crée le titre de la section (ex: "Epic")
            // const sectionTitle = document.createElement('h2');
            // sectionTitle.className = 'text-2xl font-bold mt-4 mb-4 text-center w-full';
            // sectionTitle.textContent = `${rarity}`;
            // container.appendChild(sectionTitle);
            // ---------------- Désactivé pour un affichage plus compact. ----------------

            // ---------------- Désactivé pour un affichage plus compact. ----------------
            // Crée le conteneur pour les cartes de cette rareté.
            // const sectionContainer = document.createElement('div');
            // C'est ici qu'on définit la grille responsive !
            // 1 colonne sur mobile, 2 sur tablette, 3 sur grand écran.
            // sectionContainer.className = 'w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6';
            // container.appendChild(sectionContainer);
            // ---------------- Désactivé pour un affichage plus compact. ----------------

            // Crée une carte HTML pour chaque mémoire dans la section.
            memoriesInRarity.forEach(memory => {
                const card = document.createElement('div');
                const cardBackgroundColorClass = getRarityBackgroundColorClass(memory.rarity);

                const currentLang = getLanguage();
                let cardTitleHtml = `<span class="card-name-main card-name-separator">${memory.name}</span>`;
                // On vérifie si la langue N'EST PAS l'anglais ET si un nom anglais de référence existe.
                if (currentLang !== 'en-US' && memory.englishName) {
                    // On utilise TOUJOURS `memory.englishName` pour le texte entre parenthèses.
                    const englishNameHtml = `<span class="english-name-wrapper">(${memory.englishName})</span>`; 
                    cardTitleHtml = `<span class="inline-flex flex-wrap items-baseline justify-start w-full">${cardTitleHtml}&nbsp;${englishNameHtml}</span>`;
                }
                // Le nom anglais sera maintenant géré par le CSS.
                
                // 'w-full' permet à la carte de prendre toute la largeur de sa colonne de grille.
                card.className = `card w-full shadow-xl rounded-xl relative ${cardBackgroundColorClass}`;

                // On prépare les petits bouts de HTML qui peuvent être optionnels.
                const formattedDescription = processDescription(memory, currentLevel, 'memory');
                const rarityColorClass = getRarityColorClass(memory.rarity);
                // Traduction des tags
                let tagsHtml = '';
                if (memory.tags && memory.tags.length > 0) {
                    tagsHtml = memory.tags.map(tag => {
                        // On détermine si c'est un 'element' ou un 'tag' générique
                        const category = ['cold', 'fire', 'light', 'dark'].includes(tag.toLowerCase()) ? 'elements' : 'tags';
                        const translatedTag = getKeywordDisplayName(tag, category, currentLang, allKeywords);
                        return `<div class="badge badge-sm text-xs text-gray-300">${translatedTag}</div>`;
                    }).join('');
                }

                const travelerMemoryLocationHtml = ""
                    ? `<p class="text-sm text-gray-400 mt-2"><b>Lieu :</b> ${memory.travelerMemoryLocation}</p>`
                    : '';
                const cooldownHtml = memory.cooldownTime
                    ? `<div class="absolute top-4 right-4 bg-gray-900 text-white rounded-full p-2 text-xs font-bold">${memory.cooldownTime}s</div>`
                    : '';
                
                const achievementHtml = getAchievementHtml(memory, translations, allAchievements);
                const keyInformationsHtml = renderKeyInformations(memory);

                card.innerHTML = `
                    ${cooldownHtml}
                    <div class="flex flex-row p-2 items-center">
                        <figure class="mr-4 flex-shrink-0">
                            <img src="assets/game/images/${memory.image}" alt="${memory.name}" class="rounded-xl w-16 h-16" />
                        </figure>
                        <div class="flex flex-col items-start text-left pr-14">
                            <h2 class="card-title text-xl font-semibold flex flex-col items-start">${cardTitleHtml}</h2>
                            
                            ${(() => {
                                let travelerText = '';
                                if (['Character', 'Identity'].includes(memory.rarity) && memory.traveler) {
                                    const travelerName = getTravelerDisplayName(memory.traveler, currentLang, allTravelerNames);
                                    travelerText = ` - ${travelerName}`;
                                }
                                // Traduction de la rareté 
                                const translatedRarity = getKeywordDisplayName(memory.rarity, 'rarities', currentLang, allKeywords);
                                const rarityDisplay = `<span class="text-sm ${rarityColorClass} mt-0">${translatedRarity}${travelerText}</span>`;
                                return rarityDisplay;
                            })()}
                            
                            <div class="flex flex-wrap gap-1 justify-start mt-1 ml-[-0.4rem]">
                                ${tagsHtml}
                            </div>
                        </div>
                    </div>
                    <div class="mx-2 mb-2 mt-0 bg-black/40 p-3 rounded-xl">
                        <p class="text-sm">${formattedDescription}</p>
                        ${achievementHtml} ${travelerMemoryLocationHtml}
                        ${keyInformationsHtml} </div>
                `;

                // ---------------- Désactivé pour un affichage plus compact. ----------------
                // sectionContainer.appendChild(card);
                // ---------------- Désactivé pour un affichage plus compact. ----------------
                cardContainer.appendChild(card);
            });
        }
    });
};

// --- FONCTIONS UTILITAIRES (HELPERS) ---

// --- DÉMARRAGE DU SCRIPT ---
const main = () => {
    setupSearch();
    setupLevelSlider();
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