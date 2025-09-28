// Attend que le contenu de la page HTML soit entièrement chargé avant d'exécuter le script.
document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES D'ÉTAT ---
    // Ces variables gardent en mémoire l'état actuel de la page.

    let allMemories = []; // Contiendra toutes les mémoires après chargement du JSON.
    let englishMemories = {}; // Contiendra les mémoires en anglais pour les ajouter.
    let allAchievements = {}; // Contiendra les données des succès (achievements.json).
    let filteredMemories = []; // Contiendra les mémoires affichées après application des filtres.

    // stockent l'état actuel de vos filtres et de votre barre de recherche
    let activeRarityFilter = 'All'; // Le filtre de rareté actuellement sélectionné.
    let activeElementFilter = 'All'; // Le filtre d'élément actuellement sélectionné.
    let activeTagFilter = 'All'; // Le filtre de tag actuellement sélectionné.
    let activeTravelerFilter = 'All'; // Le filtre de voyageur actuellement sélectionné.

    let searchQuery = ''; // Le texte actuellement tapé dans la barre de recherche.
    let activeStatFilter = 'All'; // Le filtre AP/AD actuellement sélectionné.

    // Nouvelle variable d'état pour le niveau
    let currentLevel = 0;

    // Dictionnaire pour traduire les ID de voyageur en noms affichables
    const travelerNames = {
            'Hero_Mist': 'Mist',
            'Hero_Vesper': 'Vesper',
            'Hero_Aurena': 'Aurena',
            'Hero_Nachia': 'Nakia',
            'Hero_Yubar': 'Yubar',
            'Hero_Lacerta': 'Lacerta',
            'Hero_Husk': 'Husk',
            'Hero_Bismuth': 'Bismuth',
            // Ajoutez ici d'autres voyageurs si nécessaire
        };

    // ==========================================================
    // ▼▼▼ DICTIONNAIRE DE TRADUCTIONS COMPLET ▼▼▼
    // ==========================================================
    const translations = {
        'fr-FR': {
            pageTitle: "Base de Données des Mémoires",
            searchPlaceholder: "Rechercher une mémoire...",
            rarityFilter: "Rareté:",
            elementsFilter: "Éléments:",
            tagsFilter: "Tags:",
            levelLabel: "Niveau :",
            allButton: "Tout"
        },
        'en-US': {
            pageTitle: "Memories Database",
            searchPlaceholder: "Search for a memory...",
            rarityFilter: "Rarity:",
            elementsFilter: "Elements:",
            tagsFilter: "Tags:",
            levelLabel: "Level:",
            allButton: "All"
        },
        'de-DE': {
            pageTitle: "Erinnerungsdatenbank",
            searchPlaceholder: "Erinnerung suchen...",
            rarityFilter: "Seltenheit:",
            elementsFilter: "Elemente:",
            tagsFilter: "Tags:",
            levelLabel: "Stufe:",
            allButton: "Alle"
        },
        'es-MX': {
            pageTitle: "Base de Datos de Recuerdos",
            searchPlaceholder: "Buscar un recuerdo...",
            rarityFilter: "Rareza:",
            elementsFilter: "Elementos:",
            tagsFilter: "Etiquetas:",
            levelLabel: "Nivel:",
            allButton: "Todos"
        },
        'it-IT': {
            pageTitle: "Database delle Memorie",
            searchPlaceholder: "Cerca una memoria...",
            rarityFilter: "Rarità:",
            elementsFilter: "Elementi:",
            tagsFilter: "Tag:",
            levelLabel: "Livello:",
            allButton: "Tutti"
        },
        'ja-JP': {
            pageTitle: "記憶のデータベース",
            searchPlaceholder: "記憶を検索...",
            rarityFilter: "レア度:",
            elementsFilter: "属性:",
            tagsFilter: "タグ:",
            levelLabel: "レベル:",
            allButton: "すべて"
        },
        'ko-KR': {
            pageTitle: "기억 데이터베이스",
            searchPlaceholder: "기억 검색...",
            rarityFilter: "희귀도:",
            elementsFilter: "속성:",
            tagsFilter: "태그:",
            levelLabel: "레벨:",
            allButton: "전체"
        },
        'pl-PL': {
            pageTitle: "Baza Danych Wspomnień",
            searchPlaceholder: "Szukaj wspomnienia...",
            rarityFilter: "Rzadkość:",
            elementsFilter: "Żywioły:",
            tagsFilter: "Tagi:",
            levelLabel: "Poziom:",
            allButton: "Wszystko"
        },
        'pt-BR': {
            pageTitle: "Banco de Dados de Memórias",
            searchPlaceholder: "Procurar uma memória...",
            rarityFilter: "Raridade:",
            elementsFilter: "Elementos:",
            tagsFilter: "Tags:",
            levelLabel: "Nível:",
            allButton: "Todos"
        },
        'ru-RU': {
            pageTitle: "База данных Воспоминаний",
            searchPlaceholder: "Поиск воспоминания...",
            rarityFilter: "Редкость:",
            elementsFilter: "Элементы:",
            tagsFilter: "Теги:",
            levelLabel: "Уровень:",
            allButton: "Все"
        },
        'tr-TR': {
            pageTitle: "Anı Veritabanı",
            searchPlaceholder: "Bir anı ara...",
            rarityFilter: "Nadirlik:",
            elementsFilter: "Elementler:",
            tagsFilter: "Etiketler:",
            levelLabel: "Seviye:",
            allButton: "Tümü"
        },
        'zh-CN': {
            pageTitle: "记忆数据库",
            searchPlaceholder: "搜索记忆...",
            rarityFilter: "稀有度:",
            elementsFilter: "元素:",
            tagsFilter: "标签:",
            levelLabel: "等级:",
            allButton: "全部"
        },
        'zh-TW': {
            pageTitle: "記憶資料庫",
            searchPlaceholder: "搜尋記憶...",
            rarityFilter: "稀有度:",
            elementsFilter: "元素:",
            tagsFilter: "標籤:",
            levelLabel: "等級:",
            allButton: "全部"
        }
    };
    // ==========================================================
    // ▲▲▲ FIN DU DICTIONNAIRE ▲▲▲
    // ==========================================================
    
    // --- GESTION DE LA LANGUE ---

    // Fonction pour sauvegarder le choix de la langue dans la mémoire du navigateur.
    const saveLanguage = (lang) => {
        localStorage.setItem('preferredLanguage', lang);
    };

    // Fonction pour récupérer la langue : 1. Choix sauvegardé, 2. Langue du navigateur, 3. 'fr-FR' par défaut.
    const getLanguage = () => {
        return localStorage.getItem('preferredLanguage') || navigator.language || 'en-US';
    };

    // --- INITIALISATION ---
    // La fonction `init` est le point de départ. Elle est `async` car elle attend le chargement des données.
    const init = async (lang) => {
        
        // Mettre à jour la valeur du sélecteur pour qu'elle corresponde à la langue chargée.
        const langSelectorDesktop = document.getElementById('language-selector');
        const langSelectorMobile = document.getElementById('language-selector-mobile');
        if (langSelectorDesktop) {
            langSelectorDesktop.value = lang;
        }
        if (langSelectorMobile) {
            langSelectorMobile.value = lang;
        }

        // On choisit le bon dictionnaire de traductions en fonction de la langue détectée.
        const T = translations[lang] || translations['en-US'];

        // On met à jour le texte visible sur la page.
        // document.querySelector('h1').textContent = T.pageTitle;
        document.getElementById('search-input').placeholder = T.searchPlaceholder;
        document.getElementById('level-label-text').textContent = T.levelLabel;


        try {
            // 1. On charge les données anglaises EN PREMIER (si ce n'est pas déjà fait)
            if (Object.keys(englishMemories).length === 0) {
                const englishResponse = await fetch('rawdata/en-US/memories.json');
                if (!englishResponse.ok) throw new Error("Le fichier de langue anglais (en-US) est introuvable.");
                englishMemories = await englishResponse.json();
            }

            // 2. On charge les données de la langue sélectionnée (logique de secours inchangée)
            // `fetch` récupère les données du fichier JSON. `await` met en pause l'exécution jusqu'à ce que la requête soit terminée.
            // On construit le chemin du fichier dynamiquement
            const response = await fetch(`rawdata/${lang}/memories.json`);
            let data; // On déclare une variable pour stocker les données finales.

            // Si la réponse est OK (le fichier existe).
            if (response.ok) {
                // On lit la réponse et on la stocke. C'est la SEULE lecture de cette réponse.
                data = await response.json();
            // Sinon (fichier non trouvé, erreur 404).
            } else {
                console.warn(`Fichier pour la langue '${lang}' non trouvé. On charge 'fr-FR' à la place.`);
                // On charge le fichier de secours.
                const fallbackResponse = await fetch('rawdata/fr-FR/memories.json');
                // On vérifie que le fichier de secours existe bien.
                if (!fallbackResponse.ok) throw new Error("Le fichier de langue par défaut 'fr-FR' est introuvable.");
                 // On lit la réponse de secours. C'est la SEULE lecture de cette réponse.
                data = await fallbackResponse.json();
            }

            // 3. On fusionne les données anglaises avec les données de la langue sélectionnée.
            allMemories = Object.keys(data).map(key => {
                const translatedMemory = data[key];
                const englishMemory = englishMemories[key] || {}; // Si la mémoire n'existe pas en anglais, on prend un objet vide.
                
                // On fusionne l'objet anglais avec l'objet traduit.
                // CORRECTION CRITIQUE : Assurer que les noms et l'ID sont toujours définis.
                const memory = {
                    id: key, 
                    name: translatedMemory.name || '', // Garantit que 'name' est une chaîne vide si absent
                    englishName: englishMemory.name || '', // Garantit que 'englishName' est une chaîne vide si absent
                    
                    ...englishMemory, // Prépare les champs de l'anglais
                    ...translatedMemory, // Écrase avec les traductions
                };
                
                return memory;
            });

            // 4. Chargement et application des corrections manuelles (corrections.json) <-- CORRIGÉ
            try {
                const correctionsResponse = await fetch('rawdata/corrections.json');
                if (correctionsResponse.ok) {
                    const correctionsData = await correctionsResponse.json();
                    
                    allMemories = allMemories.map(memory => {
                        const correction = correctionsData[memory.id];
                        
                        if (correction) {
                            // On fusionne la mémoire existante avec la correction
                            const correctedMemory = { ...memory, ...correction };
                            
                            // Fusionner les tags pour éviter d'écraser ceux d'origine (si la correction n'en a pas)
                            const originalTags = memory.tags || [];
                            const correctionTags = correction.tags || [];
                            correctedMemory.tags = Array.from(new Set([...originalTags, ...correctionTags]));
                            
                            // Correction spécifique pour les informations clés
                            if (memory.informations && correction.informations) {
                                correctedMemory.informations = { ...memory.informations, ...correction.informations };
                            }
                            
                            return correctedMemory;
                        }
                        return memory;
                    });

                } else {
                    console.warn("Fichier de corrections (corrections.json) non trouvé. Aucune correction appliquée.");
                }
            } catch (e) {
                console.error("Erreur lors de l'application des corrections manuelles:", e);
            }


            // 5. Chargement des données d'Achievements pour la langue sélectionnée (achievements.json) <-- NOUVEAU
            try {
                const achievementResponse = await fetch(`rawdata/${lang}/achievements.json`);
                if (achievementResponse.ok) {
                    allAchievements = await achievementResponse.json();
                } else {
                    console.warn(`Fichier d'Achievements pour la langue '${lang}' non trouvé. On charge 'fr-FR' à la place.`);
                    const fallbackAchievementResponse = await fetch('rawdata/fr-FR/achievements.json');
                    if (fallbackAchievementResponse.ok) {
                        allAchievements = await fallbackAchievementResponse.json();
                    } else {
                        console.error("Le fichier d'Achievements par défaut 'fr-FR' est introuvable.");
                        allAchievements = {};
                    }
                }
            } catch (e) {
                console.error("Erreur lors du chargement des achievements:", e);
                allAchievements = {};
            }

            // Une fois les données chargées, on lance les fonctions pour construire la page.
            populateFilters(); // Crée les boutons de filtres (maintenant traduits).
            applyFilters(); // Applique les filtres et affiche les mémoires.

        } catch (error) {
            // Si une erreur survient pendant le chargement, un message clair est affiché à l'utilisateur.
            console.error('Erreur lors du chargement des mémoires:', error);
            document.getElementById('memories-container').innerHTML = `<p class="text-center text-red-500">Oups, une erreur est survenue !<br>Vérifie que ton fichier 'memories.json' et tes images sont bien au bon endroit.<br>Message technique : ${error.message}</p>`;
        }
    };

    // --- GESTION DES ÉVÉNEMENTS ---

    // Met en place l'écouteur d'événements pour la barre de recherche.
    const setupSearch = () => {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            // 'input' se déclenche à chaque fois que l'utilisateur tape ou supprime une lettre.
            searchInput.addEventListener('input', (event) => {
                searchQuery = event.target.value.toLowerCase(); // Met à jour la variable de recherche.
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
        const selectors = ['language-selector', 'language-selector-mobile']
            .map(id => document.getElementById(id)).filter(s => s !== null);

        selectors.forEach(selector => {
            selector.addEventListener('change', (event) => {
                const selectedLang = event.target.value;
                saveLanguage(selectedLang); // On sauvegarde le nouveau choix.

                // Synchroniser l'autre sélecteur pour que l'affichage soit correct
                selectors.forEach(s => {
                    if (s !== event.target) {
                        s.value = selectedLang;
                    }
                });

                init(selectedLang);         // On recharge la page avec la nouvelle langue.
            });
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
        const rarities = ['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Unique', 'Character', 'Identity'];
        const rarityContainer = document.getElementById('rarity-filters'); // Le conteneur où les boutons seront ajoutés.
        
        // On utilise la traduction pour le titre du filtre
        rarityContainer.innerHTML = `<span class="font-bold">${T.rarityFilter}</span>`; 

        rarities.forEach(rarity => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm rarity-filter-btn';
            if (rarity === activeRarityFilter) button.classList.add('btn-active');// Le bouton "All" est actif par défaut.
            // On utilise la traduction pour le bouton "Tout"
            button.textContent = rarity === 'All' ? T.allButton : rarity;// "Si la valeur de rarity est 'All', utilise le texte 'Tout'. Sinon, utilise la valeur de rarity.
            button.dataset.rarity = rarity;// Stocke la valeur du filtre dans l'attribut `data-`.
            rarityContainer.appendChild(button);
        });
        
        // Ajoute un écouteur de clic à chaque bouton de rareté.
        document.querySelectorAll('.rarity-filter-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                document.querySelectorAll('.rarity-filter-btn').forEach(btn => btn.classList.remove('btn-active'));
                event.target.classList.add('btn-active');
                activeRarityFilter = event.target.dataset.rarity; // Met à jour le filtre actif.
                applyFilters(); // Relance le filtrage.
            });
        });
    };

    // Crée les boutons pour les filtres d'éléments (logique similaire à la rareté).
    const populateElementsFilter = () => {
        // 1. On récupère les traductions au début de la fonction
        const T = translations[getLanguage()] || translations['en-US'];
        const elementalTags = ['cold', 'fire', 'light', 'dark'];
        const elementsContainer = document.getElementById('elements-filters');
        
        // 2. On utilise la traduction pour le titre du filtre
        elementsContainer.innerHTML = `<span class="font-bold">${T.elementsFilter}</span>`;
        
        const allButton = document.createElement('button');
        allButton.className = 'btn btn-sm element-filter-btn';
        if ('All' === activeElementFilter) allButton.classList.add('btn-active');
        allButton.textContent = T.allButton;
        allButton.dataset.element = 'All';
        elementsContainer.appendChild(allButton);
        
        elementalTags.forEach(element => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm element-filter-btn';
            if (element === activeElementFilter) button.classList.add('btn-active');
            button.textContent = element.charAt(0).toUpperCase() + element.slice(1);
            button.dataset.element = element;
            elementsContainer.appendChild(button);
        });

        document.querySelectorAll('.element-filter-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                document.querySelectorAll('.element-filter-btn').forEach(btn => btn.classList.remove('btn-active'));
                event.target.classList.add('btn-active');
                activeElementFilter = event.target.dataset.element;
                applyFilters();
            });
        });
    };

    // Crée les boutons pour les autres tags en les extrayant directement du JSON.
    const populateTagsFilter = () => {
        // 1. On récupère les traductions
        const T = translations[getLanguage()] || translations['en-US'];
        const elementalTags = ['cold', 'fire', 'light', 'dark'];
        const allTags = [...new Set(allMemories.flatMap(m => m.tags || []))].sort();
        const tagsContainer = document.getElementById('tags-filters');

        // 2. On utilise la traduction pour le titre du filtre
        tagsContainer.innerHTML = `<span class="font-bold">${T.tagsFilter}</span>`;

        const otherTags = allTags.filter(tag => !elementalTags.includes(tag.toLowerCase()));
        
        const allButton = document.createElement('button');
        allButton.className = 'btn btn-sm tag-filter-btn';
        if ('All' === activeTagFilter) allButton.classList.add('btn-active');
        // 3. On utilise la traduction pour le bouton "Tout"
        allButton.textContent = T.allButton; 
        allButton.dataset.tag = 'All';
        tagsContainer.appendChild(allButton);

        otherTags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'btn btn-sm tag-filter-btn';
            if (tag.toLowerCase() === activeTagFilter) button.classList.add('btn-active');
            button.textContent = tag;
            button.dataset.tag = tag.toLowerCase();
            tagsContainer.appendChild(button);
        });
        
        document.getElementById('tags-filters').addEventListener('click', (event) => {
            if (event.target.classList.contains('tag-filter-btn')) {
                document.querySelectorAll('.tag-filter-btn').forEach(btn => btn.classList.remove('btn-active'));
                event.target.classList.add('btn-active');
                activeTagFilter = event.target.dataset.tag;
                applyFilters();
            }
        });
    };

    // Crée les boutons pour les filtres de statistiques (AP/AD).
    const populateStatFilter = () => {
        const T = translations[getLanguage()] || translations['en-US']; // On récupère la langue actuelle
        const statTypes = ['All', 'AP', 'AD']; // Les types de statistiques à filtrer
        const statContainer = document.getElementById('stat-filters'); // Le conteneur où les boutons seront ajoutés.
        
        // Vous devez ajouter un élément pour le titre du filtre ici dans votre HTML. Pour l'instant, on laisse vide.
        statContainer.innerHTML = `<span class="font-bold">Stats:</span>`; 

        statTypes.forEach(stat => {
            const button = document.createElement('button');
            // On réutilise la même classe pour le style et le comportement que les autres filtres
            button.className = 'btn btn-sm stat-filter-btn rarity-filter-btn';
            if (stat === activeStatFilter) button.classList.add('btn-active');
            

            if (stat === 'AP') {
                // Remplace le texte "AP" par l'image du sprite 1
                button.innerHTML = `<img src="sprites/1.png" class="inline-sprite" alt="AP Stat" style="width: 1.2em; height: 1.2em;" />`;
            } else if (stat === 'AD') {
                // Remplace le texte "AD" par l'image du sprite 2
                button.innerHTML = `<img src="sprites/2.png" class="inline-sprite" alt="AD Stat" style="width: 1.2em; height: 1.2em;" />`;
            } else {
                // Utilise la traduction pour le bouton "Tout"
                button.textContent = T.allButton;
            }

            // On utilise la traduction pour le bouton "Tout"
            
            button.dataset.stat = stat; // Stocke la valeur du filtre
            statContainer.appendChild(button);

            button.addEventListener('click', (event) => {
                // S'assurer que tous les boutons de cette catégorie sont désactivés
                document.querySelectorAll('.stat-filter-btn').forEach(btn => btn.classList.remove('btn-active'));
                
                // Activer le bouton cliqué
                event.currentTarget.classList.add('btn-active'); // On utilise currentTarget pour cibler le bouton
                
                activeStatFilter = event.currentTarget.dataset.stat; 
                applyFilters(); 
            });

        });
        
    };

    // Crée les boutons pour les filtres de voyageurs.
    const populateTravelerFilter = () => {
        const T = translations[getLanguage()] || translations['en-US'];
        const travelers = [...new Set(allMemories.map(m => m.traveler).filter(t => t && t !== ''))].sort();
        const travelersContainer = document.getElementById('traveler-filters');

        travelersContainer.innerHTML = `<span class="font-bold">Voyageurs:</span>`;

        const allButton = document.createElement('button');
        allButton.className = 'btn btn-sm traveler-filter-btn rarity-filter-btn'; // On réutilise la classe de style
        if ('All' === activeTravelerFilter) allButton.classList.add('btn-active');
        allButton.textContent = T.allButton;
        allButton.dataset.traveler = 'All';
        travelersContainer.appendChild(allButton);

        travelers.forEach(travelerKey => {
            const button = document.createElement('button');
            const travelerName = travelerNames[travelerKey] || travelerKey.replace('Hero_', '');

            button.className = 'btn btn-sm traveler-filter-btn rarity-filter-btn';
            if (travelerKey === activeTravelerFilter) button.classList.add('btn-active');
            button.textContent = travelerName;
            button.dataset.traveler = travelerKey;
            travelersContainer.appendChild(button);
        });

        document.querySelectorAll('.traveler-filter-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                document.querySelectorAll('.traveler-filter-btn').forEach(btn => btn.classList.remove('btn-active'));
                event.target.classList.add('btn-active');
                activeTravelerFilter = event.target.dataset.traveler;
                applyFilters();
            });
        });
    };


    
    // --- LOGIQUE DE FILTRAGE ---
    // C'est ici que la magie opère.
    const applyFilters = () => {
        // La méthode `.filter()` crée un nouveau tableau avec uniquement les éléments qui passent le test.
        filteredMemories = allMemories.filter(memory => {
            // Test 1: La recherche textuelle (nom)
            // On vérifie si le nom ou le nom anglais contient la chaîne recherchée (insensible à la casse).
            const matchesSearch = memory.name.toLowerCase().includes(searchQuery) ||
                      (memory.englishName && memory.englishName.toLowerCase().includes(searchQuery));
            
            // Test 2: Le filtre de rareté
            const matchesRarity = activeRarityFilter === 'All' || memory.rarity === activeRarityFilter;
            
            // Test 3: Le filtre d'élément
            const matchesElement = activeElementFilter === 'All' || (memory.tags && memory.tags.map(tag => tag.toLowerCase()).includes(activeElementFilter.toLowerCase()));
            
            // Test 4: Le filtre de tag (en excluant les éléments déjà gérés)
            const isElementalTag = ['cold', 'fire', 'light', 'dark'].includes(activeTagFilter.toLowerCase());
            const matchesTag = activeTagFilter === 'All' || (!isElementalTag && memory.tags && memory.tags.map(tag => tag.toLowerCase()).includes(activeTagFilter.toLowerCase()));
            
            // TEST 5: Le filtre de statistiques (AP/AD)
            let matchesStat = true;
            // On vérifie le rawDescVars pour les valeurs basicAP et basicAD
            const hasDescVars = memory.rawDescVars && memory.rawDescVars.length > 0;
            if (activeStatFilter === 'AP') {
                // Est AP si au moins une variable de description utilise basicAP > 0
                matchesStat = hasDescVars && memory.rawDescVars.some(descVar => 
                    descVar.data && (descVar.data.basicAP || 0) > 0
                );
            } else if (activeStatFilter === 'AD') {
                // Est AD si au moins une variable de description utilise basicAD > 0
                matchesStat = hasDescVars && memory.rawDescVars.some(descVar => 
                    descVar.data && (descVar.data.basicAD || 0) > 0
                );
            }

            // TEST 6: Le filtre de voyageur (traveler) 
            const matchesTraveler = activeTravelerFilter === 'All' || memory.traveler === activeTravelerFilter;


            // Une mémoire est gardée si elle passe TOUS les tests.
            return matchesSearch && matchesRarity && matchesElement && matchesTag && matchesStat && matchesTraveler; // <-- activeTravelerFilter ajouté ici

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
                    if (currentLang !== 'en-US' && memory.englishName) {
                        // Changement : On utilise un span pour l'anglais au lieu d'un div
                        const englishNameHtml = `<span class="english-name-wrapper">(${memory.englishName})</span>`; 
                        
                        // Ajout d'un ESPACE INSÉCABLE (&nbsp;) entre le nom principal et le nom anglais
                        // Cela garantit que l'espace n'est jamais le dernier caractère de la ligne.
                        cardTitleHtml = `<span class="inline-flex flex-wrap items-baseline justify-start w-full">` + cardTitleHtml + `&nbsp;` + englishNameHtml + `</span>`;
                    }
                    // Le nom anglais sera maintenant géré par le CSS.
                    
                    // 'w-full' permet à la carte de prendre toute la largeur de sa colonne de grille.
                    card.className = `card w-full shadow-xl rounded-xl relative ${cardBackgroundColorClass}`;
    
                    // On prépare les petits bouts de HTML qui peuvent être optionnels.
                    const formattedDescription = processDescription(memory, currentLevel);
                    const rarityColorClass = getRarityColorClass(memory.rarity);
                    let tagsHtml = '';
                    if (memory.tags && memory.tags.length > 0) {
                        tagsHtml = memory.tags.map(tag => `<div class="badge badge-sm text-xs text-gray-300">${tag}</div>`).join(''); // config tags
                    }
                    const travelerMemoryLocationHtml = "" //suppression de memory.travelerMemoryLocation
                        ? `<p class="text-sm text-gray-400 mt-2"><b>Lieu :</b> ${memory.travelerMemoryLocation}</p>`
                        : '';
                    const cooldownHtml = memory.cooldownTime
                        ? `<div class="absolute top-4 right-4 bg-gray-900 text-white rounded-full p-2 text-xs font-bold">${memory.cooldownTime}s</div>`
                        : '';
                    
                    // NOUVEAU : Récupération de l'HTML de la condition de déblocage
                    const achievementHtml = getAchievementHtml(memory); 
                    
                    // NOUVEAU : Appel de la fonction pour obtenir les informations clés
                    const keyInformationsHtml = renderKeyInformations(memory);
    
                    // On assemble le HTML de la carte avec toutes les données.
                    // config cartes
                    card.innerHTML = `
                        ${cooldownHtml}
                        <div class="flex flex-row p-2 items-center">
                            <figure class="mr-4 flex-shrink-0">
                                <img src="images/${memory.image}" alt="${memory.name}" class="rounded-xl w-16 h-16" />
                            </figure>
                            <div class="flex flex-col items-start text-left pr-14">
                                <h2 class="card-title text-xl font-semibold flex flex-col items-start">${cardTitleHtml}</h2>
                                
                                ${(() => {
                                    let travelerText = '';
                                    if (['Character', 'Identity'].includes(memory.rarity) && memory.traveler) {
                                        const travelerName = travelerNames[memory.traveler] || memory.traveler.replace('Hero_', '');
                                        travelerText = ` - ${travelerName}`;
                                    }
                                    const rarityDisplay = `<span class="text-sm ${rarityColorClass} mt-0">${memory.rarity}${travelerText}</span>`;
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

    function renderKeyInformations(memory) {
        // S'assure que le champ 'informations' existe et est un objet.
        if (!memory.informations || typeof memory.informations !== 'object') {
            return '';
        }

        let html = '<div class="key-infos mt-2 pt-2 border-t border-gray-700/50 flex flex-wrap gap-x-4 gap-y-1">';

        // Parcourt les propriétés de l'objet 'informations'
        for (const key in memory.informations) {
            if (memory.informations.hasOwnProperty(key) && memory.hasOwnProperty(key)) {
                const label = memory.informations[key]; // Ex: "Temps de recharge"
                const value = memory[key];              // Ex: 8.5 (cooldownTime)

                // On s'assure que la valeur existe et n'est pas vide ou nulle
                if (value !== undefined && value !== null) {
                    // On utilise une petite icône et des couleurs pour la lisibilité
                    html += `
                        <div class="flex items-center text-sm text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-400 inline-sprite" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-12a1 1 0 102 0V9a1 1 0 10-2 0V6zm2 4a1 1 0 10-2 0v4a1 1 0 102 0v-4z" clip-rule="evenodd" />
                            </svg>
                            <b>${label} :</b> <span class="ml-1 text-white font-semibold">${value}</span>
                        </div>
                    `;
                }
            }
        }

        html += '</div>';
        return html;
    }


    // Nouvelle fonction pour générer le HTML de la condition de déblocage (Achievement)
    function getAchievementHtml(memory) {
        const achievementKey = memory.achievementKey;

        // 1. Vérifie si une clé d'achievement existe dans la mémoire
        if (!achievementKey) {
            return '';
        }

        // 2. Cherche l'objet achievement dans les données chargées
        const achievement = allAchievements[achievementKey];

        // NOTE: Si l'achievement n'est pas trouvé dans achievements.json, on utilise les champs de fallback
        const achName = achievement ? achievement.name : memory.achievementName;
        const achDesc = achievement ? achievement.description : memory.achievementDescription;

        if (!achName || !achDesc) {
            // Si même les fallbacks sont vides, on ne retourne rien
            return '';
        }

        // 3. Construit le HTML sans le cadenas, en utilisant le style de texte demandé
        const html = `
            <div class="achievement-info mt-2 pt-2 border-t border-gray-700/50">
                <p class="text-xs italic text-gray-400">
                    <b>Condition de déblocage :</b> 
                    <span class="text-yellow-600 font-semibold">${achName}</span> 
                    (${achDesc})
                </p>
            </div>
        `;
        return html;
    }


    // Transforme les balises personnalisées du JSON (ex: <color=...>) en vrai HTML.
    function formatText(text) {
        if (!text) return '';
        // Utilise des expressions régulières (regex) pour trouver et remplacer les balises.
        let formattedText = text.replace(/<color=(.*?)>/g, (match, color) => {
            const cssColor = color.startsWith('#') ? color : color.toLowerCase();
            return `<span style="color: ${cssColor}">`;
        });
        formattedText = formattedText.replace(/<\/color>/g, '</span>');
        formattedText = formattedText.replace(/<sprite=(\d+)>/g, (match, spriteId) => {
            return `<img src="sprites/${spriteId}.png" class="inline-sprite" alt="Sprite">`;
        });
        formattedText = formattedText.replace(/\n/g, '<br>'); // Remplace les sauts de ligne par des balises <br>.
        return formattedText;
    }

    // Traite la description en fonction du niveau et des variables dynamiques.
    function processDescription(memory, level) {
        // Si la mémoire n'a pas de description dynamique, on utilise la description statique.
        if (!memory.rawDesc) {
            return formatText(memory.description);
        }

        // On commence avec la description brute (le "modèle" avec {0}, {1}, etc.).
        let description = memory.rawDesc;

        // Si des variables dynamiques existent, on itère sur chacune d'elles.
        if (memory.rawDescVars) {
            memory.rawDescVars.forEach((descVar, index) => {
                // AJOUT : Affichage du nom de la mémoire pour le débogage.
                // console.log("---");
                // console.log("Nom de la mémoire:", memory.name);
                
                // On prend la valeur rendue par défaut du JSON.
                let valueToRender = descVar.rendered;
                
                // Point de vérification 1
                // console.log(`Vérification pour l'indice ${index}:`);
                // console.log("Objet 'data':", descVar.data);

                // Si la valeur contient un sprite de type 5, on effectue le calcul.
                if (descVar.rendered.includes('<sprite=5>')) {
                    // MODIFICATION : On vérifie si l'objet 'data' existe ET si au moins une valeur de calcul est supérieure à 0.
                    const hasCalculableData = descVar.data && (
                        (descVar.data.basicConstant || 0) > 0 ||
                        (descVar.data.basicAP || 0) > 0 ||
                        (descVar.data.basicAD || 0) > 0 ||
                        (descVar.data.basicLvl || 0) > 0 ||
                        (descVar.data.basicAddedMultiplierPerLevel || 0) > 0
                    );

                    // Point de vérification 2
                    // console.log("hasCalculableData:", hasCalculableData);

                    if (!hasCalculableData) {
                        // Si les données sont manquantes ou non significatives.
                        // MODIFICATION : On recherche spécifiquement une valeur avec un pourcentage.
                        const numericValueMatch = valueToRender.match(/([\d.]+)%/);
                        if (numericValueMatch) {
                            const renderedValue = numericValueMatch[1]; // L'index 1 contient le nombre sans le %.
                            valueToRender = valueToRender.replace(renderedValue, `${renderedValue}?`);
                        } else {
                            // Sinon, on ajoute simplement un "?" à la fin si aucune valeur n'est trouvée.
                            valueToRender += "?";
                        }
                    } else {
                        // Si les données existent, on continue avec notre logique de calcul.
                        // On récupère toutes les valeurs de calcul du JSON.
                        const basicConstant = descVar.data.basicConstant || 0;
                        const basicAP = descVar.data.basicAP || 0;
                        const basicAD = descVar.data.basicAD || 0;
                        const basicLvl = descVar.data.basicLvl || 0;
                        const basicAddedMultiplierPerLevel = descVar.data.basicAddedMultiplierPerLevel || 0;
                        
                        // On applique la formule de calcul que nous avons définie.
                        let finalValue = (basicConstant + basicAP + basicAD + basicLvl) *
                                        (1 + basicAddedMultiplierPerLevel * level) + (basicLvl * level);
                        
                                        //Affichage des valeurs de calcul pour le débogage.
                        // if (memory.name === "Piétinement Glacial") {
                        //     console.log("---");
                        //     console.log("Nom de la mémoire:", memory.name);
                        //     console.log("Valeur avant arrondi:", finalValue);
                        // }

                        // MODIFICATION 1 : La valeur finale est maintenant un nombre non formaté.
                        const calculatedValue = (Math.round((finalValue + Number.EPSILON) * 100) / 100);

                        // On prépare la valeur à insérer en fonction du format.

                        let valueToInsert;
                        const isP0Format = descVar.format === "P0";

                        // MODIFICATION : Nouvelle structure de la condition.
                        if (descVar.rendered.includes('<color=')) {
                            // Cas 1 : La valeur est dans une balise couleur. On la multiplie par 100.
                            valueToInsert = `${parseFloat((calculatedValue * 100).toFixed(2))}%`;
                        } else if (isP0Format) {
                            // Cas 2 : La valeur n'est PAS dans une balise couleur, mais le format est "P0". On la multiplie par 100.
                            valueToInsert = `${parseFloat((calculatedValue * 100).toFixed(2))}%`;
                        } else if (descVar.rendered.includes('%')) {
                            // Cas 3 : La valeur n'est pas dans une balise couleur, n'est pas "P0", mais a un '%'. On ne la multiplie pas.
                            valueToInsert = `${parseFloat(calculatedValue.toFixed(2))}%`;
                        } else {
                            // Cas 4 : Autres formats (pas de %).
                            valueToInsert = parseFloat(calculatedValue.toFixed(2));
                        }
                        
                        // MODIFICATION : On retire le symbole de pourcentage de la chaîne avant le remplacement.
                        const valueToReplace = valueToRender.includes('%') ? valueToRender.replace('%', '') : valueToRender;
                        
                        // On utilise la nouvelle variable `valueToInsert` pour le remplacement.
                        if (valueToReplace.includes('<color=')) {
                            // Si la valeur est dans une balise couleur, on cherche spécifiquement ce nombre.
                            const numericValueMatch = valueToReplace.match(/<color=.*?>(.*?)<\/color>/);
                            if (numericValueMatch && numericValueMatch[1]) {
                                valueToRender = valueToReplace.replace(numericValueMatch[1], valueToInsert);
                            }
                        } else {
                            // Sinon, on utilise la logique précédente pour les autres cas.
                            valueToRender = valueToReplace.replace(/[\d.]*/, valueToInsert);
                        }
                    }

                    // Point de vérification 3
                    // console.log("Valeur rendue finale:", valueToRender);
                }
                
                // On remplace la balise {index} dans le modèle par la valeur que nous venons de déterminer.
                description = description.replace(`{${index}}`, valueToRender);
            });
        }
        // Enfin, on passe la description mise à jour à la fonction formatText pour gérer les couleurs et les sprites.
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
            case 'Character': return 'rarity-Character';
            case 'Identity': return 'rarity-Identity';
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
            case 'Character': return 'card-bg-Character';
            case 'Identity': return 'card-bg-Identity';
            default: return 'bg-gray-800';
        }
    }

    // --- DÉMARRAGE DU SCRIPT ---
    
    // On met en place tous les écouteurs d'événements.
    setupSearch(); // Active la barre de recherche.
    setupLevelSlider();
    setupLanguageSelector();

    // On récupère la langue sauvegardée (ou celle du navigateur) et on lance l'initialisation.
    const currentLang = getLanguage();
    init(currentLang);
});