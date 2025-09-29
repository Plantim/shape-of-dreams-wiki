// Attend que le contenu de la page HTML soit entièrement chargé avant d'exécuter le script.
document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES D'ÉTAT ---
    // Ces variables gardent en mémoire l'état actuel de la page.

    let allEssences = []; // Contiendra toutes les essences après chargement du JSON.
    let englishEssences = {}; // Contiendra les essences en anglais.
    let allAchievements = {}; // Contiendra les données des succès (achievements.json).
    let filteredEssences = []; // Contiendra les essences affichées après application des filtres.
    let translations = {}; // Contiendra les traductions pour l'interface utilisateur.
    let allKeywords = {}; // Contiendra les traductions des mots-clés (rarités, éléments, tags).

    // stockent l'état actuel de vos filtres et de votre barre de recherche
    let activeRarityFilter = '';
    let activeElementFilter = '';
    let activeTagFilter = '';
    // NOTE : Le filtre de voyageur (activeTravelerFilter) est retiré.

    let searchQuery = ''; // Le texte actuellement tapé dans la barre de recherche.
    let activeStatFilter = 'All'; // Le filtre AP/AD actuellement sélectionné.

    // La variable de niveau est maintenue mais sera fixée à 0 car inutile pour les essences
    let qualityPercentage = 100; // Toujours 100% de base pour les essences
    
    // --- GESTION DE LA LANGUE ---
    // (Fonctions inchangées)

    const saveLanguage = (lang) => {
        localStorage.setItem('preferredLanguage', lang);
    };

    const getLanguage = () => {
        return localStorage.getItem('preferredLanguage') || navigator.language || 'en-US';
    };

    // --- INITIALISATION ---
    
    const init = async (lang) => {
        try {
            // 1. On charge le fichier de traductions externe
            const responseTranslations = await fetch('rawdata/translations.json'); // Assurez-vous que le chemin est correct
            if (!responseTranslations.ok) throw new Error("Le fichier translations.json est introuvable.");
            translations = await responseTranslations.json();

            // On charge le fichier de traductions des mots-clés
            const responseKeywords = await fetch('rawdata/ui_keywords_localized.json');
            if (!responseKeywords.ok) throw new Error("Le fichier ui_keywords_localized.json est introuvable.");
            allKeywords = await responseKeywords.json();

            const langSelectorDesktop = document.getElementById('language-selector');
            const langSelectorMobile = document.getElementById('language-selector-mobile');
            if (langSelectorDesktop) {
                langSelectorDesktop.value = lang;
            }
            if (langSelectorMobile) {
                langSelectorMobile.value = lang;
            }

            const T = translations[lang] || translations['en-US'];

            // Mettre en évidence le lien de navigation actif (ici, "essences" pour la page des essences)
            highlightActiveNav('essences');

            // Mise à jour du placeholder de recherche
            document.getElementById('search-input').placeholder = T.searchPlaceholder;
            // On utilise la nouvelle clé "levelPLabel" pour cette page
            const levelLabelElement = document.getElementById('level-label-text');
            if (levelLabelElement) levelLabelElement.textContent = T.levelPLabel; ;
            
            // TRADUCTION DE LA NAVIGATION
            document.querySelector('.nav-home-link').textContent = T.navHome;
            document.querySelector('.nav-memories-link').textContent = T.navMemories;
            document.querySelector('.nav-essences-link').textContent = T.navEssences;
            // TRADUCTION DU PIED DE PAGE
            document.getElementById('footer-text').textContent = T.footerText;

            try {
                // 1. On charge les données anglaises (essences.json)
                if (Object.keys(englishEssences).length === 0) {
                    const englishResponse = await fetch('rawdata/en-US/essences.json');
                    if (!englishResponse.ok) throw new Error("Le fichier de langue anglais (en-US/essences.json) est introuvable.");
                    englishEssences = await englishResponse.json();
                }

                // 2. On charge les données de la langue sélectionnée (essences.json)
                const response = await fetch(`rawdata/${lang}/essences.json`);
                let data; 

                if (response.ok) {
                    data = await response.json();
                } else {
                    console.warn(`Fichier essences.json pour la langue '${lang}' non trouvé. On charge 'fr-FR' à la place.`);
                    const fallbackResponse = await fetch('rawdata/fr-FR/essences.json');
                    if (!fallbackResponse.ok) throw new Error("Le fichier de langue par défaut 'fr-FR/essences.json' est introuvable.");
                    data = await fallbackResponse.json();
                }

                // 3. On fusionne les données anglaises avec les données de la langue sélectionnée.
                allEssences = Object.keys(data).map(key => {
                    const translatedEssence = data[key];
                    const englishEssence = englishEssences[key] || {};
                    
                    const essence = {
                        id: key, 
                        name: translatedEssence.name || '',
                        englishName: englishEssence.name || '',
                        
                        ...englishEssence, 
                        ...translatedEssence,
                    };
                    
                    return essence;
                });
                // Renomme la variable pour la clarté (remplace allMemories)
                let allMemories = allEssences; 
                
                // 4. Chargement des corrections est optionnel pour les Essences, mais on garde la structure si vous en ajoutez plus tard
                try {
                    // NOTE: Vous aurez besoin de créer un fichier rawdata/corrections_essences.json si vous avez des corrections spécifiques aux essences
                    const correctionsResponse = await fetch('rawdata/corrections_essences.json'); 
                    if (correctionsResponse.ok) {
                        const correctionsData = await correctionsResponse.json();
                        
                        allEssences = allEssences.map(essence => {
                            const correction = correctionsData[essence.id];
                            
                            if (correction) {
                                const correctedEssence = { ...essence, ...correction };
                                const originalTags = essence.tags || [];
                                const correctionTags = correction.tags || [];
                                correctedEssence.tags = Array.from(new Set([...originalTags, ...correctionTags]));
                                
                                if (essence.informations && correction.informations) {
                                    correctedEssence.informations = { ...essence.informations, ...correction.informations };
                                }
                                
                                return correctedEssence;
                            }
                            return essence;
                        });

                    } else {
                        console.info("Fichier de corrections (corrections_essences.json) non trouvé. Aucune correction spécifique aux essences appliquée.");
                    }
                } catch (e) {
                    console.error("Erreur lors de l'application des corrections manuelles aux essences:", e);
                }


                // 5. Chargement des Achievements
                try {
                    const achievementResponse = await fetch(`rawdata/${lang}/achievements.json`);
                    if (achievementResponse.ok) {
                        allAchievements = await achievementResponse.json();
                    } else {
                        console.warn(`Fichier d'Achievements pour la langue '${lang}' non trouvé.`);
                        allAchievements = {};
                    }
                } catch (e) {
                    console.error("Erreur lors du chargement des achievements:", e);
                    allAchievements = {};
                }


                // Une fois les données chargées, on lance les fonctions pour construire la page.
                populateFilters(); 
                applyFilters(); 

            } catch (error) {
                console.error('Erreur lors du chargement des essences:', error);
                document.getElementById('memories-container').innerHTML = `<p class="text-center text-red-500">Oups, une erreur est survenue lors du chargement des essences !<br>Message technique : ${error.message}</p>`;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des essences:', error);
            document.getElementById('memories-container').innerHTML = `<p class="text-center text-red-500">Oups, une erreur est survenue lors du chargement des essences !<br>Message technique : ${error.message}</p>`;
        }
    };

    // --- GESTION DES ÉVÉNEMENTS ---
    // (Fonctions inchangées, mais levelSlider est inactif)

    const setupSearch = () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                searchQuery = event.target.value.toLowerCase();
                applyFilters();
            });
        }
    };


    // Met en place l'écouteur d'événements pour le slider de qualité. 
    const setupLevelSlider = () => {
        const qualitySlider = document.getElementById('level-slider');
        const qualityValueSpan = document.getElementById('level-value');
        
        if (qualitySlider && qualityValueSpan) {
            // Configuration de la plage de valeurs
            qualitySlider.min = 100;
            qualitySlider.max = 5000;
            qualitySlider.step = 100; // Incrémentation par 100
            
            qualitySlider.value = qualityPercentage;
            qualityValueSpan.textContent = qualityPercentage; 
            
            qualitySlider.addEventListener('input', (event) => {
                qualityPercentage = parseInt(event.target.value, 10);
                qualityValueSpan.textContent = qualityPercentage;
                applyFilters();
            });
        }
    };

    const setupLanguageSelector = () => {
        const selectors = ['language-selector', 'language-selector-mobile']
            .map(id => document.getElementById(id)).filter(s => s !== null);

        selectors.forEach(selector => {
            selector.addEventListener('change', (event) => {
                const selectedLang = event.target.value;
                saveLanguage(selectedLang); 
                selectors.forEach(s => {
                    if (s !== event.target) {
                        s.value = selectedLang;
                    }
                });
                init(selectedLang);
            });
        });
    };

    // --- POPULATION DES FILTRES ---
    
    const populateFilters = () => {
        populateRarityFilter();
        populateElementsFilter();
        populateTagsFilter();
        populateStatFilter();
        // NOTE : populateTravelerFilter est retiré.
    };

    // NOTE : populateRarityFilter est inchangé.
    const populateRarityFilter = () => {
        const T = translations[getLanguage()] || translations['en-US'];
        const currentLang = getLanguage();
        const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Unique'];
        const rarityContainer = document.getElementById('rarity-filters');
        
        rarityContainer.innerHTML = `<span class="font-bold">${T.rarityFilter}</span>`;

        rarities.forEach(rarity => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm rarity-filter-btn';
            if (activeRarityFilter === rarity) button.classList.add('btn-active');
            button.textContent = getKeywordDisplayName(rarity, 'rarities', currentLang);
            button.dataset.rarity = rarity;
            rarityContainer.appendChild(button);
        });
        
        document.querySelectorAll('.rarity-filter-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const rarity = event.target.dataset.rarity;
                activeRarityFilter = activeRarityFilter === rarity ? '' : rarity;
                populateRarityFilter();
                applyFilters();
            });
        });
    };

    const populateElementsFilter = () => {
        const T = translations[getLanguage()] || translations['en-US'];
        const currentLang = getLanguage();
        const elementalTags = ['Cold', 'Fire', 'Light', 'Dark'];
        const elementsContainer = document.getElementById('elements-filters');
        
        elementsContainer.innerHTML = `<span class="font-bold">${T.elementsFilter}</span>`;

        elementalTags.forEach(element => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm element-filter-btn';
            if (activeElementFilter === element) button.classList.add('btn-active');
            button.textContent = getKeywordDisplayName(element, 'elements', currentLang);
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


    const populateTagsFilter = () => {
        const T = translations[getLanguage()] || translations['en-US'];
        const currentLang = getLanguage();
        const elementalTags = ['Cold', 'Fire', 'Light', 'Dark'];
        const allTags = [...new Set(allEssences.flatMap(m => m.tags || []))].sort();
        const tagsContainer = document.getElementById('tags-filters');

        tagsContainer.innerHTML = `<span class="font-bold">${T.tagsFilter}</span>`;

        const otherTags = allTags.filter(tag => !elementalTags.includes(tag));

        otherTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm tag-filter-btn';
            const tagValue = tag.toLowerCase();
            if (activeTagFilter === tagValue) button.classList.add('btn-active');
            button.textContent = getKeywordDisplayName(tag, 'tags', currentLang);
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
            
            // On utilise une image pour représenter AP/AD
            if (stat === 'AP') {
                // Remplace le texte "AP" par l'image du sprite 1
                button.innerHTML = `<img src="sprites/1.png" class="inline-sprite" alt="AP Stat" style="width: 1.2em; height: 1.2em;" />`;
            } else if (stat === 'AD') {
                // Remplace le texte "AD" par l'image du sprite 2
                button.innerHTML = `<img src="sprites/2.png" class="inline-sprite" alt="AD Stat" style="width: 1.2em; height: 1.2em;" />`;
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

    // NOTE : populateTravelerFilter est retiré.


    
    // --- LOGIQUE DE FILTRAGE ---
    
    const applyFilters = () => {
        // Utilise allEssences pour le filtrage
        filteredEssences = allEssences.filter(essence => {
            // Test 1: La recherche textuelle (nom)
            const searchMatch = !searchQuery || 
                (essence.name && essence.name.toLowerCase().includes(searchQuery)) ||
                (essence.englishName && essence.englishName.toLowerCase().includes(searchQuery)) ||
                (essence.description && essence.description.toLowerCase().includes(searchQuery));

            // Test 2: Le filtre de rareté
            const rarityMatch = !activeRarityFilter || essence.rarity === activeRarityFilter;
            
            // Test 3: Le filtre d'élément
            const elementMatch = !activeElementFilter || (essence.tags && essence.tags.includes(activeElementFilter));
            
            // Test 4: Le filtre de tag (en excluant les éléments déjà gérés)
            const tagMatch = !activeTagFilter || (essence.tags && essence.tags.map(t => t.toLowerCase()).includes(activeTagFilter));
            
            // TEST 5: Le filtre de statistiques (AP/AD)
            let statMatch = true;
            const hasDescVars = essence.rawDescVars && essence.rawDescVars.length > 0;
            
            if (activeStatFilter === 'AP') {
                statMatch = hasDescVars && essence.rawDescVars.some(descVar => 
                    // Condition 1: Vérifie les données AP
                    (descVar.data && ((descVar.data.basicAP || 0) > 0 || (descVar.data.addedAP || 0) > 0)) ||
                    // Condition 2: OU vérifie la présence des sprites AP
                    (descVar.rendered && (descVar.rendered.includes('<sprite=1>') || descVar.rendered.includes('<sprite=4>')))
                );
            } else if (activeStatFilter === 'AD') {
                statMatch = hasDescVars && essence.rawDescVars.some(descVar => 
                    // Condition 1: Vérifie les données AD
                    (descVar.data && ((descVar.data.basicAD || 0) > 0 || (descVar.data.addedAD || 0) > 0)) ||
                    // Condition 2: OU vérifie la présence du sprite AD
                    (descVar.rendered && descVar.rendered.includes('<sprite=2>'))
                );
            }

            return searchMatch && rarityMatch && elementMatch && tagMatch && statMatch;
        });

        renderEssences(filteredEssences);
    };




    // --- LOGIQUE D'AFFICHAGE (RENDU) ---
    // Fonction renommée pour la clarté (renderEssences au lieu de renderMemories)
    const renderEssences = (essencesToRender) => {
        const container = document.getElementById('memories-container'); // Garde le même ID pour minimiser les changements HTML
        container.innerHTML = '';
    
        const cardContainer = document.createElement('div');
        cardContainer.className = 'w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-6';
        container.appendChild(cardContainer);

        const essencesByRarity = essencesToRender.reduce((acc, essence) => {
            const rarity = essence.rarity || 'Inconnue';
            if (!acc[rarity]) acc[rarity] = [];
            acc[rarity].push(essence);
            return acc;
        }, {});
    
        // Ordre d'affichage des raretés des Essences
        const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary', 'Unique'];
    
        rarityOrder.forEach(rarity => {
            const essencesInRarity = essencesByRarity[rarity];
            if (essencesInRarity && essencesInRarity.length > 0) {
    
                essencesInRarity.forEach(essence => { // essence au lieu de memory
                    const card = document.createElement('div');
                    const cardBackgroundColorClass = getRarityBackgroundColorClass(essence.rarity);

                    const currentLang = getLanguage();
                    let cardTitleHtml = `<span class="card-name-main card-name-separator">${essence.name}</span>`;
                    if (currentLang !== 'en-US' && essence.englishName) {
                        const englishNameHtml = `<span class="english-name-wrapper">(${essence.englishName})</span>`; 
                        cardTitleHtml = `<span class="inline-flex flex-wrap items-baseline justify-start w-full">` + cardTitleHtml + `&nbsp;` + englishNameHtml + `</span>`;
                    }
                    
                    // ...
                    card.className = `card w-full shadow-xl rounded-xl relative ${cardBackgroundColorClass}`;
    
                    // MODIFIÉ : Passage du qualityPercentage à la fonction
                    const formattedDescription = processDescription(essence, qualityPercentage);
                    const rarityColorClass = getRarityColorClass(essence.rarity);

                    // MODIFICATION 1 : Traduction des tags
                    let tagsHtml = '';
                    if (essence.tags && essence.tags.length > 0) {
                        tagsHtml = essence.tags.map(tag => {
                            const category = ['cold', 'fire', 'light', 'dark'].includes(tag.toLowerCase()) ? 'elements' : 'tags';
                            const translatedTag = getKeywordDisplayName(tag, category, currentLang);
                            return `<div class="badge badge-sm text-xs text-gray-300">${translatedTag}</div>`;
                        }).join('');
                    }
                    
                    const cooldownHtml = ''; 
                    const keyInformationsHtml = renderKeyInformations(essence);
                    const achievementHtml = getAchievementHtml(essence); 
                    
                    // MODIFICATION 2 : Traduction de la rareté
                    const translatedRarityText = getKeywordDisplayName(essence.rarity, 'rarities', currentLang);

                    card.innerHTML = `
                        ${cooldownHtml}
                        <div class="flex flex-row p-2 items-center">
                            <figure class="mr-4 flex-shrink-0">
                                <img src="images/${essence.image}" alt="${essence.name}" class="rounded-xl w-16 h-16" />
                            </figure>
                            <div class="flex flex-col items-start text-left pr-14">
                                <h2 class="card-title text-xl font-semibold flex flex-col items-start">${cardTitleHtml}</h2>
                                
                                <span class="text-sm ${rarityColorClass} mt-0">${translatedRarityText}</span>
                                
                                <div class="flex flex-wrap gap-1 justify-start mt-1 ml-[-0.4rem]">
                                    ${tagsHtml}
                                </div>
                            </div>
                        </div>
                        <div class="mx-2 mb-2 mt-0 bg-black/40 p-3 rounded-xl">
                            <p class="text-sm">${formattedDescription}</p>
                            ${achievementHtml} 
                            ${keyInformationsHtml} 
                        </div>
                    `;
    
                    cardContainer.appendChild(card);
                });
            }
        });
    };

    // --- FONCTIONS UTILITAIRES (HELPERS) ---

    function renderKeyInformations(essence) {
        // S'assure que le champ 'informations' existe et est bien un tableau non vide.
        if (!essence.informations || !Array.isArray(essence.informations) || essence.informations.length === 0) {
            return '';
        }

        let html = '<div class="key-infos mt-2 pt-2 border-t border-gray-700/50 flex flex-wrap gap-x-4 gap-y-1">';

        // On parcourt simplement le tableau d'informations.
        essence.informations.forEach(info => {
            // On vérifie que l'objet a bien un libellé et une valeur.
            if (info.label && info.value) {
                html += `
                    <div class="flex items-center text-sm text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-400 inline-sprite" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-12a1 1 0 102 0V9a1 1 0 10-2 0V6zm2 4a1 1 0 102 0v-4z" clip-rule="evenodd" />
                        </svg>
                        <b>${info.label} :</b> <span class="ml-1 text-white font-semibold">${info.value}</span>
                    </div>
                `;
            }
        });

        html += '</div>';
        
        // On retourne le HTML uniquement si on y a ajouté du contenu.
        return html.includes('<b>') ? html : '';
    }

    // Nouvelle fonction pour générer le HTML de la condition de déblocage (Achievement)
    function getAchievementHtml(essence) { // essence au lieu de memory
        // 1. On récupère les traductions actuelles
        const T = translations[getLanguage()] || translations['en-US'];
        
        const achievementKey = essence.achievementKey;

        if (!achievementKey) {
            return '';
        }

        const achievement = allAchievements[achievementKey];

        const achName = achievement ? achievement.name : essence.achievementName;
        const achDesc = achievement ? achievement.description : essence.achievementDescription;

        if (!achName || !achDesc) {
            return '';
        }

        // On utilise la clé de traduction au lieu du texte en dur
        const html = `
            <div class="achievement-info mt-2 pt-2 border-t border-gray-700/50">
                <p class="text-xs italic text-gray-500">
                    <b>${T.unlockCondition}</b> 
                    <span class="text-yellow-600 font-semibold">${achName}</span> 
                    (${achDesc})
                </p>
            </div>
        `;
        return html;
    }


    // Transforme les balises personnalisées du JSON (couleurs, sprites) en vrai HTML.
    function formatText(text) {
        if (!text) return '';
        let formattedText = text.replace(/<color=(.*?)>/g, (match, color) => {
            const cssColor = color.startsWith('#') ? color : color.toLowerCase();
            return `<span style="color: ${cssColor}">`;
        });
        formattedText = formattedText.replace(/<\/color>/g, '</span>');
        formattedText = formattedText.replace(/<sprite=(\d+)>/g, (match, spriteId) => {
            return `<img src="sprites/${spriteId}.png" class="inline-sprite" alt="Sprite">`;
        });
        formattedText = formattedText.replace(/\n/g, '<br>');
        return formattedText;
    }

    // ProcessDescription avec calcul de Quality Percentage (level)
    function processDescription(essence, qualityPercentage) {
        if (!essence.rawDesc) {
            return formatText(essence.description);
        }

        let description = essence.rawDesc;
        const qualityMultiplier = qualityPercentage;

        if (essence.rawDescVars) {
            essence.rawDescVars.forEach((descVar, index) => {
                let valueToRender = descVar.rendered;
                
                if (descVar.rendered.includes('<sprite=5>')) {
                    
                    const hasCalculableData = descVar.data && (
                        (descVar.data.basicConstant || 0) > 0 ||
                        (descVar.data.basicAP || 0) > 0 ||
                        (descVar.data.basicAD || 0) > 0 ||
                        (descVar.data.basicLvl || 0) > 0 ||
                        (descVar.data.basicAddedMultiplierPerLevel || 0) > 0
                    );

                    if (!hasCalculableData || descVar.scalingType === 'unknown') {
                        const numericValueMatch = valueToRender.match(/[\d.,]+/);
                        if(numericValueMatch) {
                           valueToRender = valueToRender.replace(numericValueMatch[0], `${numericValueMatch[0]}?`);
                        } else {
                           valueToRender += "?";
                        }

                    } else {
                        const basicConstant = descVar.data.basicConstant || 0;
                        const basicAP = descVar.data.basicAP || 0;
                        const basicAD = descVar.data.basicAD || 0;
                        const basicLvl = descVar.data.basicLvl || 0;
                        const basicAddedMultiplierPerLevel = descVar.data.basicAddedMultiplierPerLevel || 0;
                        
                        let finalValue = (basicConstant + basicAP + basicAD + basicLvl) * (1 + qualityMultiplier * basicAddedMultiplierPerLevel) + 
                                        (basicLvl * qualityMultiplier); 
                        
                        const calculatedValue = (Math.round((finalValue + Number.EPSILON) * 100) / 100);

                        let valueToInsert;
                        const isP0Format = descVar.format === "P0";
                        // --- CORRECTION 2 : Détecter le format où la valeur est DÉJÀ un pourcentage ---
                        const isAlreadyPercentage = descVar.format.includes("'%'");

                        if (isAlreadyPercentage) {
                            // Si le format est #,##0'%', on n'effectue PAS de multiplication par 100.
                            valueToInsert = `${parseFloat(calculatedValue.toFixed(2))}%`;
                        } else if (isP0Format || descVar.rendered.includes('%')) {
                            // Pour les formats P0 ou les autres cas avec un '%', on traite la valeur comme un ratio.
                            valueToInsert = `${parseFloat((calculatedValue * 100).toFixed(2))}%`;
                        } else {
                            // C'est un nombre brut, sans pourcentage.
                            valueToInsert = parseFloat(calculatedValue.toFixed(2));
                        }
                        
                        if (valueToRender.includes('<color=')) {
                            const numericValueMatch = valueToRender.match(/<color=.*?>(.*?)<\/color>/);
                            if (numericValueMatch && numericValueMatch[1]) {
                                valueToRender = valueToRender.replace(numericValueMatch[1], valueToInsert);
                            }
                        } else {
                            // --- CORRECTION 1 : Remplacer le nombre ET le % optionnel pour éviter les doublons ---
                            const numericAndPercentMatch = valueToRender.match(/[\d.,]+%?/);
                            if(numericAndPercentMatch) {
                                valueToRender = valueToRender.replace(numericAndPercentMatch[0], valueToInsert);
                            }
                        }
                    }
                }
                
                description = description.replace(`{${index}}`, valueToRender);
            });
        }
        return formatText(description);
    }

    // Retourne la classe CSS de couleur de texte en fonction de la rareté.
    function getRarityColorClass(rarity) {
        switch(rarity) {
            case 'Common': return 'rarity-Common';
            case 'Rare': return 'rarity-Rare';
            case 'Epic': return 'rarity-Epic';
            case 'Legendary': return 'rarity-Legendary';
            case 'Unique': return 'rarity-Unique';
            // Les raretés Character et Identity sont retirées pour les Essences
            default: return 'text-white';
        }
    }

    // Retourne la classe CSS de couleur de fond de la carte en fonction de la rareté.
    function getRarityBackgroundColorClass(rarity) {
        switch(rarity) {
            case 'Common': return 'card-bg-Common';
            case 'Rare': return 'card-bg-Rare';
            case 'Epic': return 'card-bg-Epic';
            case 'Legendary': return 'card-bg-Legendary';
            case 'Unique': return 'card-bg-Unique';
            // Les raretés Character et Identity sont retirées pour les Essences
            default: return 'bg-gray-800';
        }
    }


    const getKeywordDisplayName = (key, category, lang) => {
        // Sélectionne le dictionnaire pour la langue actuelle, avec fallback sur l'anglais
        const langDict = allKeywords[lang] || allKeywords['en-US'] || {};
        
        // Sélectionne la bonne catégorie (ex: "rarities", "elements", "tags")
        const categoryDict = langDict[category] || {};
        
        // Retourne la traduction, ou la clé originale si non trouvée
        return categoryDict[key] || key;
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

    // --- DÉMARRAGE DU SCRIPT ---
    
    setupSearch(); 
    setupLevelSlider(); 
    setupLanguageSelector();

    // On récupère la langue sauvegardée (ou celle du navigateur) et on lance l'initialisation.
    const currentLang = getLanguage();
    init(currentLang);
});