// assets/js/common.js

// Variable globale pour la version du jeu
const gameVersion = "1.2.1";

// --- GESTION DE LA LANGUE (COMMUNE) ---
const saveLanguage = (lang) => {
    localStorage.setItem('preferredLanguage', lang);
};

const getLanguage = () => {
    return localStorage.getItem('preferredLanguage') || navigator.language || 'en-US';
};

// --- CHARGEMENT DES GRADIENTS ---
// Variable globale pour stocker les dégradés du jeu
let textGradients = {};

// Fonction à appeler au chargement de ton site/script pour initialiser les dégradés
async function loadGradients() {
    try {
        const response = await fetch('assets/data/locales/gradients.json');
        textGradients = await response.json();
    } catch (e) {
        console.error("Erreur lors du chargement des gradients :", e);
    }
}
loadGradients();

// --- FONCTIONS UTILITAIRES (COMMUNES) ---

// Supprime les accents pour une comparaison plus simple.
const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Transforme les balises personnalisées du JSON (couleurs, gradients, tailles, sprites) en HTML.
function formatText(text) {
    if (!text) return '';

    let formattedText = text;

    // 1. Gestion des couleurs classiques (ex: <color=#16D7FF> ou <color=yellow>)
    formattedText = formattedText.replace(/<color=(.*?)>/g, (match, color) => {
        const cssColor = color.startsWith('#') ? color : color.toLowerCase();
        return `<span style="color: ${cssColor}">`;
    });
    formattedText = formattedText.replace(/<\/color>/g, '</span>');

    // 2. Gestion des Gradients
    formattedText = formattedText.replace(/<gradient=(.*?)>(.*?)<\/gradient>/g, (match, gradientKey, textContent) => {
        const colors = textGradients[gradientKey];

        // Si la clé n'existe pas dans gradients.json, on retourne le texte blanc/brut
        if (!colors || colors.length === 0) return textContent;

        if (colors.length === 1) {
            // Une seule couleur : rendu uni standard
            return `<span style="color: ${colors[0]};">${textContent}</span>`;
        } else {
            // Deux couleurs ou plus : dégradé linéaire appliqué sur le texte via CSS
            const gradientStr = `linear-gradient(90deg, ${colors.join(', ')})`;
            return `<span style="background: ${gradientStr}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block;">${textContent}</span>`;
        }
    });

    // 3. Gère les sprites avec la logique d'infobulle
    formattedText = formattedText.replace(/<size=(.*?)>(.*?)<\/size>/g, (match, sizeValue, textContent) => {
        return `<span style="font-size: ${sizeValue};">${textContent}</span>`;
    });

    // 4. Gère les sprites avec la logique d'infobulle
    formattedText = formattedText.replace(/<sprite=(\d+)( data-tooltip-formula=".*?")?>/g, (match, spriteId, tooltipAttr) => {
        const imgSrc = `assets/game/sprites/${spriteId}.png`;
        const imgHtml = `<img src="${imgSrc}" class="inline-sprite" alt="Sprite ${spriteId}">`;

        if (tooltipAttr) {
            const formula = tooltipAttr.match(/data-tooltip-formula="(.*?)"/)[1];
            // On utilise un SPAN au lieu d'une DIV pour rester sur la même ligne
            return `<span class="tooltip" data-tip="${formula}">${imgHtml}</span>`;
        }

        return imgHtml;
    });

    formattedText = formattedText.replace(/\n/g, '<br>');

    return formattedText;
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

// Fonction pour obtenir le nom d'un mot-clé traduit
const getKeywordDisplayName = (key, category, lang, allKeywords) => {
    const langDict = allKeywords[lang] || allKeywords['en-US'] || {};
    const categoryDict = langDict[category] || {};
    return categoryDict[key] || key;
};

// Fonction pour obtenir le nom d'un voyageur traduit
const getTravelerDisplayName = (travelerKey, lang, allTravelerNames) => {
    const englishKey = travelerKey.replace('Hero_', '');
    const langDict = allTravelerNames[lang] || allTravelerNames['en-US'] || {};
    return langDict[englishKey] || englishKey;
}

// Fonction pour mettre en évidence le lien de navigation actif
const highlightActiveNav = (activePage) => {
    document.querySelectorAll('.nav-home-link, .nav-memories-link, .nav-essences-link').forEach(link => {
        link.classList.remove('nav-active');
    });
    const activeLink = document.querySelector(`.nav-${activePage}-link`);
    if (activeLink) {
        activeLink.classList.add('nav-active');
    }
};

function renderKeyInformations(item) {
    if (!item.informations || !Array.isArray(item.informations) || item.informations.length === 0) {
        return '';
    }
    let html = '<div class="key-infos mt-2 pt-2 border-t border-gray-700/50 flex flex-wrap gap-x-4 gap-y-1">';
    item.informations.forEach(info => {
        if (info.label && info.value) {
            html += `
                <div class="flex items-center text-sm text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-yellow-400 inline-sprite" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-12a1 1 0 102 0V9a1 1 0 10-2 0V6zm2 4a1 1 0 10-2 0v-4z" clip-rule="evenodd" /></svg>
                    <b>${info.label} :</b> <span class="ml-1 text-white font-semibold">${info.value}</span>
                </div>
            `;
        }
    });
    html += '</div>';
    return html.includes('<b>') ? html : '';
}

function getAchievementHtml(item, translations, allAchievements) {
    const T = translations[getLanguage()] || translations['en-US'];
    const achievementKey = item.achievementKey;
    if (!achievementKey) return '';
    const achievement = allAchievements[achievementKey];
    const achName = achievement ? achievement.name : item.achievementName;
    const achDesc = achievement ? achievement.description : item.achievementDescription;
    if (!achName || !achDesc) return '';
    return `
        <div class="achievement-info mt-2 pt-2 border-t border-gray-700/50">
            <p class="text-xs italic text-gray-400">
                <b>${T.unlockCondition}</b> 
                <span class="text-yellow-600 font-semibold">${achName}</span> 
                (${achDesc})
            </p>
        </div>
    `;
}

/**
 * Traite la description d'un item (Memory ou Essence) pour calculer et formater les valeurs dynamiques.
 */
function processDescription(item, scalingValue, type) {
    // Si l'item n'a pas de description dynamique, on utilise la description statique.
    if (!item.rawDesc) {
        return formatText(item.description);
    }
    
    // On commence avec la description brute (le "modèle" avec {0}, {1}, etc.).
    let description = item.rawDesc;
    
    // Si des variables dynamiques existent, on itère sur chacune d'elles.
    if (item.rawDescVars) {
        item.rawDescVars.forEach((descVar, index) => {
            let originalRendered = descVar.rendered ? descVar.rendered.trim() : '';
            let valueToRender = originalRendered;
            let bonusPart = '';

            // Gestion des chaînes combinées : On sépare la valeur AP principale du Bonus secondaire
            if (originalRendered.includes('+') && originalRendered.includes('Bonus')) {
                // Découpe au niveau de la balise <color=white><size=80%> + </size></color> ou simplement du '+'
                const splitIndex = originalRendered.indexOf('<color=white>');
                if (splitIndex !== -1) {
                    valueToRender = originalRendered.substring(0, splitIndex).trim();
                    bonusPart = originalRendered.substring(splitIndex);
                } else {
                    const plusIndex = originalRendered.indexOf('+');
                    if (plusIndex !== -1) {
                        valueToRender = originalRendered.substring(0, plusIndex).trim();
                        bonusPart = originalRendered.substring(plusIndex);
                    }
                }
                
                // Si la flèche de scaling <sprite=5> s'est retrouvée isolée à la toute fin du bonusPart,
                // on la récupère pour la recoller directement derrière la valeur AP modifiée.
                if (bonusPart.includes('<sprite=5>')) {
                    bonusPart = bonusPart.replace('<sprite=5>', '').trim();
                    valueToRender += '<sprite=5>';
                }
            }
            
            // Si la valeur contient un sprite de type 5, on effectue le calcul.
            if (valueToRender.includes('<sprite=5>')) {

                // 1. Déclaration des variables de base (commun aux deux types)
                // On récupère toutes les valeurs de calcul du JSON.
                const basicConstant = descVar.data.basicConstant || 0;
                const basicAP = descVar.data.basicAP || 0;
                const basicAD = descVar.data.basicAD || 0;
                const basicLvl = descVar.data.basicLvl || 0;
                const basicAddedMultiplierPerLevel = descVar.data.basicAddedMultiplierPerLevel || 0;
                
                // Sera true si a une description ET au moins une valeur supérieur à 0, Sinon false
                const hasCalculableData = descVar.data && (
                    (descVar.data.basicConstant || 0) > 0 ||
                    (descVar.data.basicAP || 0) > 0 ||
                    (descVar.data.basicAD || 0) > 0 ||
                    (descVar.data.basicLvl || 0) > 0 ||
                    (descVar.data.basicAddedMultiplierPerLevel || 0) > 0
                );
                
                // Si les données sont manquantes data:{} ou scalingType unknown, on affiche un '?'
                if (!hasCalculableData || descVar.scalingType === 'unknown') {
                    // Tooltip dans l'image
                    valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="Unknown value">`);
                    const numericValueMatch = valueToRender.match(/([\d.]+)%/);
                    if (numericValueMatch) {
                        // valeur en pourcentage
                        const renderedValue = numericValueMatch[1]; // L'index 1 contient le nombre sans le %.
                        valueToRender = valueToRender.replace(renderedValue, `${renderedValue}?`);
                    } else {
                        // valeur sans pourcentage
                        valueToRender += "?";
                    }
                
                // Si les données existent, on continue avec notre logique de calcul.
                } else {

                    // 2. DÉFINITION DES VARIABLES SPÉCIFIQUES SELON LE TYPE (memory ou essence)
                    // On utilise un opérateur ternaire (une sorte de if/else condensé) pour choisir la bonne valeur.
                    const tooltipMultiplier = (type === 'essence') ? 5000 : 100; // 5000 = 50% de qualité
                    const tooltipLabel = (type === 'essence') ? '/ 50% Qual.' : '/ lvl';
                    
                    // 3. CALCULS UNIFIÉS
                    // Calcul du scaling pour la tooltip
                    const tooltipFormulaResult = ((basicConstant + basicAP + basicAD + basicLvl) * basicAddedMultiplierPerLevel + basicLvl) * tooltipMultiplier;

                    // Formule de calcul de la valeur qui scale.
                    // 'scalingValue' remplace 'level' ou 'qualityMultiplier', rendant la formule universelle.
                    let finalValue = (basicConstant + basicAP + basicAD + basicLvl) *
                                     (1 + basicAddedMultiplierPerLevel * scalingValue) + (basicLvl * scalingValue);
                    
                    // Création des chaînes de caractères pour la tooltip
                    const formulaTextForTooltip = `${parseFloat(tooltipFormulaResult.toFixed(2))}`;
                    const formulaTextForTooltip_div100_dec1 = `${parseFloat((tooltipFormulaResult / 100).toFixed(1))}`; // On modifie pour corriger la valeur => on divise par 100
                    const formulaTextForTooltip_div100 = `${parseFloat((tooltipFormulaResult / 100).toFixed(2))}`; // On modifie pour corriger la valeur => on divise par 100
                    
                    // La valeur finale brute + correction avec epsilon
                    const calculatedValue = (finalValue + Number.EPSILON);

                    // 4. FORMATAGE : Remplacement de la balise sprite + valeurs qui scalent
                    let valueToInsert;
                    switch (descVar.format) {
                        // ---- CAS : VALEURS ENTIERES ----
                        // Cas 1 & 1 bis : Format pour nombres entiers, sans décimales.
                        case "#,##0":
                            if (valueToRender.includes('<color=') || valueToRender.includes('<gradient=')) {
                                // La valeur est dans une balise couleur (ratio AP/AD) -> Pourcentage
                                valueToInsert = `${Math.round(calculatedValue * 100)}%`;
                                valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip}% ${tooltipLabel}">`);
                            } else {
                                // La valeur n'est pas dans une balise couleur -> Nombre simple
                                valueToInsert = `${Math.round(calculatedValue)}`;
                                valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip_div100} ${tooltipLabel}"> `);
                            }
                            break;
                        // Cas 2 : Format pour les pourcentages entiers, sans décimales.    
                        case "P0":
                            valueToInsert = `${Math.round(calculatedValue * 100)}%`;
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip}% ${tooltipLabel}">`);
                            break;
                        // Cas 3 : Format pour les nombres entiers suivis du symbole '%'. (Normal qu'on ne multiplie pas ?)
                        case "#,##0'%'":
                             valueToInsert = `${Math.round(calculatedValue)}%`;
                             valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip_div100}% ${tooltipLabel}">`);
                             break;
                        // ---- CAS : VALEURS AVEC UNE DÉCIMALE ----
                        // Cas 4 : Nombres avec décimale optionnelle. (1 seule décimale max)
                        case "#,##0.#":
                        case "0.#":
                        case "###,0.#": // Surement une erreur du dev, utilisé seulement pour "Gem_R_Wealth"
                            valueToInsert = `${parseFloat(calculatedValue.toFixed(1))}`;
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip_div100} ${tooltipLabel}">`);
                            break;
                        // Cas 5 : Nombres avec décimale obligatoire. (1 seule décimale max)
                        case "#,##0.0":
                        case "#.0": // Pas encore utilisé
                            valueToInsert = `${calculatedValue.toFixed(1)}`;
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip_div100_dec1} ${tooltipLabel}">`);
                            break;
                        // Cas 6 : Pourcentages avec décimale optionnelle. (1 seule décimale max)
                        case "#,##0.#%":
                            valueToInsert = `${parseFloat((calculatedValue * 100).toFixed(1))}%`;
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip}% ${tooltipLabel}">`);
                            break;
                        // Cas 7 : Nombres avec décimale optionnelle. (2 décimales max)
                        case "0.##": // Pas encore utilisé
                            valueToInsert = `${parseFloat(calculatedValue.toFixed(2))}`;
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip_div100} ${tooltipLabel}">`);
                            break;
                        // cas 8 : Pourcentages avec décimale obligatoire (1 décimale) (only Gem_U_EternalFlame)
                        case "#,##0.0%":
                            valueToInsert = `${(calculatedValue * 100).toFixed(1)}%`;
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip}% ${tooltipLabel}">`);
                            break;
                        // ---- CAS PAR DÉFAUT ----
                        default:
                            valueToInsert = `${parseFloat(calculatedValue.toFixed(2))}€`; // Le '€' est une valeur de test.
                            valueToRender = valueToRender.replace('<sprite=5>', `<sprite=5 data-tooltip-formula="${formulaTextForTooltip_div100} ${tooltipLabel}">`);
                            break;
                    }
                    
                    // On retire proprement le symbole % présent de base uniquement s'il n'est pas enveloppé dans une balise
                    let valueToReplace = valueToRender;
                    if (!valueToRender.includes('</color>') && !valueToRender.includes('</gradient>')) {
                        valueToReplace = valueToRender.replace('%', '');
                    }

                    // Logique d'extraction et de remplacement robuste et insensible aux formats (gère entiers et décimales comme 12.5)
                    if (valueToReplace.includes('<gradient=')) {
                        const numericValueMatch = valueToReplace.match(/<gradient=.*?>(.*?)<\/gradient>/);
                        if (numericValueMatch && numericValueMatch[1]) {
                            valueToRender = valueToReplace.replace(numericValueMatch[1], valueToInsert);
                        }
                    } else if (valueToReplace.includes('<color=')) {
                        const numericValueMatch = valueToReplace.match(/<color=.*?>(.*?)<\/color>/);
                        if (numericValueMatch && numericValueMatch[1]) {
                            valueToRender = valueToReplace.replace(numericValueMatch[1], valueToInsert);
                        }
                    } else {
                        // Cible précisément le premier bloc numérique entier ou décimal (ex: "40" ou "12.5")
                        valueToRender = valueToReplace.replace(/\d+(?:\.\d+)?/, valueToInsert);
                    }
                }
            }
            
            // On réassemble la valeur AP calculée (avec sa flèche collée) et la partie Bonus secondaire
            const finalAssembledValue = bonusPart ? `${valueToRender} ${bonusPart}` : valueToRender;
            
            description = description.replace(`{${index}}`, finalAssembledValue);
        });
    }
    // Enfin, on passe la description mise à jour à la fonction formatText pour gérer les couleurs et les sprites.
    return formatText(description);
}

// --- GESTION DE LA VERSION GLOBALE (COMMUNE) ---

/**
 * Met à jour le numéro de version du jeu et le label traduit sur toutes les pages
 * @param {Object} T - L'objet de traduction de la langue courante
 */
function updateGlobalVersionDisplay(T) {
    // 1. Injection du numéro de version du jeu
    const topVersionNumber = document.getElementById('game-version-number');
    if (topVersionNumber) {
        topVersionNumber.textContent = gameVersion;
    }

    // 2. Injection du label traduit provenant du ui_strings.json
    if (T && T.gameVersionLabel) {
        const versionLabelEl = document.getElementById('game-version-label');
        if (versionLabelEl) {
            versionLabelEl.textContent = T.gameVersionLabel;
        }
    }
}


// On centralise la variable d'état du filtre de stat pour qu'elle soit accessible partout
let activeStatFilter = ''; 

/**
 * Génère les boutons de filtres statistiques (AP/AD/HP)
 * @param {Function} onFilterChange - La fonction à exécuter lorsque le filtre change (ex: applyFilters)
 */

// Crée les boutons pour les filtres de statistiques (AP/AD/HP).
const populateStatFilter = (onFilterChange) => {
    const T = translations[getLanguage()] || translations['en-US'];
    const statTypes = ['AP', 'AD', 'HP'];
    const statContainer = document.getElementById('stat-filters');
    
    if (!statContainer) return; // Sécurité si le conteneur n'existe pas sur une page
    
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
        
        // Gestion des icônes selon la statistique
        if (stat === 'AP') {
            // Remplace le texte "AP" par l'image du sprite 1
            button.innerHTML = `<img src="assets/game/sprites/1.png" class="inline-sprite" alt="AP Stat" style="width: 1.2em; height: 1.2em;" />`;
        } else if (stat === 'AD') {
            // Remplace le texte "AD" par l'image du sprite 2
            button.innerHTML = `<img src="assets/game/sprites/2.png" class="inline-sprite" alt="AD Stat" style="width: 1.2em; height: 1.2em;" />`;
        } else if (stat === 'HP') {
            // Remplace le texte "HP" par l'image du sprite 3
            button.innerHTML = `<img src="assets/game/sprites/3.png" class="inline-sprite" alt="HP Stat" style="width: 1.2em; height: 1.2em;" />`;
        }

        button.dataset.stat = stat;
        statContainer.appendChild(button);
    });

    document.querySelectorAll('.stat-filter-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const stat = event.currentTarget.dataset.stat;
            
            // Logique de bascule (Toggle) - Si on clique sur le bouton déjà actif, on le désactive. Sinon, on l'active.
            activeStatFilter = activeStatFilter === stat ? '' : stat;
            
            // On rafraîchit les boutons pour mettre à jour l'état visuel
            populateStatFilter(onFilterChange); 
            
            // On notifie le fichier es6/js local (memories ou essences) qu'il faut filtrer
            if (typeof onFilterChange === 'function') {
                onFilterChange();
            }
        });
    });
};