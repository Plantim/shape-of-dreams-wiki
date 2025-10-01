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
function formatText(text) {
    if (!text) return '';
    let formattedText = text.replace(/<color=(.*?)>/g, (match, color) => {
        const cssColor = color.startsWith('#') ? color : color.toLowerCase();
        return `<span style="color: ${cssColor}">`;
    });
    formattedText = formattedText.replace(/<\/color>/g, '</span>');
    formattedText = formattedText.replace(/<sprite=(\d+)>/g, (match, spriteId) => {
        return `<img src="assets/game/sprites/${spriteId}.png" class="inline-sprite" alt="Sprite">`;
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