// Définition centralisée des catégories
// Format: ID numérique pour chaque catégorie (utilisé dans le fichier data.js)
// Les mots ont un attribut "cat" qui référence l'ID de la catégorie

const CATEGORIES = [
    { id: 0, key: "toutes", name: "📦 Toutes", icon: "📦" },
    { id: 1, key: "animaux", name: "🐶 Animaux", icon: "🐶" },
    { id: 2, key: "nourriture", name: "🍎 Nourriture", icon: "🍎" },
    { id: 3, key: "nature", name: "🌍 Nature", icon: "🌍" },
    { id: 4, key: "vehicules", name: "🚗 Véhicules", icon: "🚗" },
    { id: 5, key: "nombres", name: "🔢 Nombres", icon: "🔢" },
    { id: 6, key: "temps", name: "📅 Temps", icon: "📅" },
    { id: 7, key: "emotions", name: "😊 Émotions", icon: "😊" },
    { id: 8, key: "personnages", name: "🦸 Personnages", icon: "🦸" },
    { id: 9, key: "corps", name: "🧍 Corps", icon: "🧍" },
    { id: 10, key: "maison", name: "🏠 Maison", icon: "🏠" },
    { id: 11, key: "couleurs", name: "🎨 Couleurs", icon: "🎨" },
    { id: 12, key: "objets", name: "⚔️ Objets", icon: "⚔️" },
    { id: 13, key: "sports", name: "⚽ Sports", icon: "⚽" },
    { id: 99, key: "autres", name: "🎲 Divers", icon: "🎲" }
];

// Correspondance ID → Catégorie
const CATEGORIES_BY_ID = {};
const CATEGORIES_BY_KEY = {};

CATEGORIES.forEach(cat => {
    CATEGORIES_BY_ID[cat.id] = cat;
    CATEGORIES_BY_KEY[cat.key] = cat;
});

// Obtenir une catégorie par ID
function getCategoryById(id) {
    return CATEGORIES_BY_ID[id] || CATEGORIES_BY_ID[99]; // 99 = Autres par défaut
}

// Obtenir une catégorie par clé
function getCategoryByKey(key) {
    return CATEGORIES_BY_KEY[key] || CATEGORIES_BY_KEY['autres'];
}

// Fonction pour obtenir les mots d'une catégorie
function getWordsByCategory(categoryKey, gameData) {
    const allWords = Object.keys(gameData);
    
    if (categoryKey === 'toutes' || categoryKey === 0) {
        return allWords; // Tous les mots du jeu
    }
    
    // Trouver l'ID de la catégorie
    const category = getCategoryByKey(categoryKey);
    if (!category) return allWords;
    
    const categoryId = category.id;
    
    // Filtrer les mots par ID de catégorie
    return allWords.filter(word => {
        const wordData = gameData[word];
        
        // Format: { hint: "...", cat: 1 }
        if (typeof wordData === 'object' && wordData.cat !== undefined) {
            return wordData.cat === categoryId;
        }
        
        // Ancien format: "indice" (pas de catégorie) → Divers
        return categoryId === 99;
    });
}

// Fonction pour obtenir les catégories disponibles
function getAvailableCategories(gameData, userManager = null) {
    const allWords = Object.keys(gameData);
    const availableCategories = [];
    
    // Toujours ajouter "toutes" en premier
    const allAvailableWords = userManager && userManager.isLoggedIn() 
        ? userManager.getAvailableWords(allWords)
        : allWords;
    
    if (allAvailableWords.length > 0) {
        availableCategories.push('toutes');
    }
    
    // Compter combien de mots RESTANTS dans chaque catégorie
    const categoryCounts = {};
    
    allAvailableWords.forEach(word => {
        const wordData = gameData[word];
        let categoryId = 99; // Autres par défaut
        
        // Format: { hint: "...", cat: 1 }
        if (typeof wordData === 'object' && wordData.cat !== undefined) {
            categoryId = wordData.cat;
        }
        
        categoryCounts[categoryId] = (categoryCounts[categoryId] || 0) + 1;
    });
    
    // Ajouter les catégories qui ont au moins 1 mot RESTANT
    CATEGORIES.forEach(cat => {
        if (cat.id !== 0 && categoryCounts[cat.id] > 0) {
            availableCategories.push(cat.key);
        }
    });
    
    return availableCategories;
}

// Fonction pour compter les mots restants dans une catégorie
function getWordCountInCategory(categoryKey, gameData, userManager = null) {
    const wordsInCategory = getWordsByCategory(categoryKey, gameData);
    
    // Si pas d'utilisateur connecté, retourner tous les mots
    if (!userManager || !userManager.isLoggedIn()) {
        return wordsInCategory.length;
    }
    
    // Filtrer les mots déjà trouvés
    const availableWords = userManager.getAvailableWords(wordsInCategory);
    return availableWords.length;
}

// Fonction pour compter les mots trouvés et le total dans une catégorie
function getFoundAndTotalCount(categoryKey, gameData, userManager = null) {
    const wordsInCategory = getWordsByCategory(categoryKey, gameData);
    const totalCount = wordsInCategory.length;
    
    // Si pas d'utilisateur connecté, 0 trouvé
    if (!userManager || !userManager.isLoggedIn()) {
        return { found: 0, total: totalCount, remaining: totalCount };
    }
    
    // Compter les mots trouvés
    const wordsFound = userManager.getWordsFound();
    const foundInCategory = wordsInCategory.filter(word => wordsFound.includes(word)).length;
    
    return {
        found: foundInCategory,
        total: totalCount,
        remaining: totalCount - foundInCategory
    };
}

// Obtenir le nom d'une catégorie
function getCategoryName(categoryKey) {
    const cat = getCategoryByKey(categoryKey);
    return cat ? cat.name : "🎲 Divers";
}
