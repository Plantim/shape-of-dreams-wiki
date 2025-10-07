// assets/js/common.js

// --- GESTION DE LA LANGUE (COMMUNE) ---
const saveLanguage = (lang) => {
    localStorage.setItem('preferredLanguage', lang);
};

const getLanguage = () => {
    return localStorage.getItem('preferredLanguage') || navigator.language || 'en-US';
};

// --- FONCTIONS UTILITAIRES (COMMUNES) ---

// Supprime les accents pour une comparaison plus simple.
const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Transforme les balises personnalisées du JSON (couleurs, sprites) en vrai HTML.
// assets/js/common.js

function formatText(text) {
    if (!text) return '';

    let formattedText = text.replace(/<color=(.*?)>/g, (match, color) => {
        const cssColor = color.startsWith('#') ? color : color.toLowerCase();
        return `<span style="color: ${cssColor}">`;
    });
    formattedText = formattedText.replace(/<\/color>/g, '</span>');

    // Gère les sprites avec la logique d'infobulle corrigée
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

// NOUVELLE FONCTION CENTRALISÉE
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
 * @param {object} item - L'objet memory ou essence contenant les données.
 * @param {number} scalingValue - La valeur qui fait évoluer les stats (ex: le niveau pour une memory, le % de qualité pour une essence).
 * @param {string} type - Le type d'item à traiter. Accepte 'memory' ou 'essence'.
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
            let valueToRender = descVar.rendered;
            
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
                            if (descVar.rendered.includes('<color=')) {
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
                    
                    // On retire le symbole de pourcentage de la chaîne avant le remplacement.
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
            } // Fin du if (valueToRender.includes('<sprite=5>'))
            
            // On remplace la balise {index} dans le modèle par la valeur que nous venons de déterminer.
            description = description.replace(`{${index}}`, valueToRender);
        });
    }
    // Enfin, on passe la description mise à jour à la fonction formatText pour gérer les couleurs et les sprites.
    return formatText(description);
}