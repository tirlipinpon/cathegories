// Gestionnaire d'utilisateurs et de sauvegarde
class UserManager {
    constructor() {
        this.currentUser = null;
        this.wordsFound = [];
        
        // Préfixe unique pour éviter les conflits avec d'autres applications
        this.COOKIE_PREFIX = 'categories_game_';
        
        // Session Manager pour la gestion de session multi-app
        this.sessionManager = new SessionManager();
    }

    // Connexion d'un utilisateur
    login(username) {
        if (!username || username.trim() === '') {
            return false;
        }

        this.currentUser = username.trim();
        
        // Sauvegarder la session (partagée entre toutes les apps)
        this.sessionManager.login(this.currentUser);
        
        this.loadUserData();
        return true;
    }

    // Déconnexion
    logout() {
        // Déconnecter de la session partagée
        this.sessionManager.logout();
        
        this.currentUser = null;
        this.wordsFound = [];
    }

    // Charger les données utilisateur depuis les cookies
    loadUserData() {
        if (!this.currentUser) return;

        console.log('📂 Chargement des données pour:', this.currentUser);

        // Charger les mots trouvés
        const wordsFoundCookie = this.getCookie(`${this.COOKIE_PREFIX}wordsFound_${this.currentUser}`);
        if (wordsFoundCookie) {
            try {
                const loaded = JSON.parse(wordsFoundCookie);
                console.log('📥 Mots chargés depuis cookie:', loaded);
                
                // Nettoyer les doublons
                this.wordsFound = [...new Set(loaded)];
                
                console.log('🧹 Mots après nettoyage des doublons:', this.wordsFound);
                
                // Sauvegarder les données nettoyées
                this.saveUserData();
            } catch (e) {
                console.error('❌ Erreur lors du chargement des mots:', e);
            }
        } else {
            console.log('ℹ️ Aucun mot sauvegardé pour cet utilisateur');
        }
    }

    // Sauvegarder les données utilisateur
    saveUserData() {
        if (!this.currentUser) return;

        console.log('💾 Sauvegarde des données pour:', this.currentUser);
        console.log('📝 Mots à sauvegarder:', this.wordsFound);

        // Sauvegarder les mots trouvés
        this.setCookie(`${this.COOKIE_PREFIX}wordsFound_${this.currentUser}`, JSON.stringify(this.wordsFound), 365);
        
        console.log('✅ Sauvegarde terminée');
    }

    // Ajouter un mot trouvé
    addWordFound(word) {
        if (!this.currentUser) return;
        
        // Vérifier si le mot n'est pas déjà dans la liste
        if (!this.wordsFound.includes(word)) {
            console.log(`➕ Ajout du mot "${word}"`);
            this.wordsFound.push(word);
            console.log(`📊 Total de mots trouvés: ${this.wordsFound.length}`);
            this.saveUserData();
        } else {
            console.log(`⚠️ Mot "${word}" déjà trouvé, pas d'ajout`);
        }
    }

    // Obtenir les mots trouvés
    getWordsFound() {
        return this.wordsFound || [];
    }

    // Obtenir les mots disponibles (excluant ceux déjà trouvés)
    getAvailableWords(allWords) {
        return allWords.filter(word => !this.wordsFound.includes(word));
    }

    // Vérifier si un utilisateur existe
    userExists(username) {
        const wordsFoundCookie = this.getCookie(`${this.COOKIE_PREFIX}wordsFound_${username}`);
        return wordsFoundCookie !== null;
    }

    // Obtenir tous les utilisateurs existants
    getAllUsers() {
        const users = [];
        const cookies = document.cookie.split(';');
        
        cookies.forEach(cookie => {
            const trimmed = cookie.trim();
            if (trimmed.startsWith(`${this.COOKIE_PREFIX}wordsFound_`)) {
                const username = trimmed.split('=')[0].replace(`${this.COOKIE_PREFIX}wordsFound_`, '');
                if (username && !users.includes(username)) {
                    users.push(username);
                }
            }
        });
        
        return users.sort();
    }

    // Obtenir tous les mots trouvés
    getAllWordsFound() {
        return [...new Set(this.wordsFound)]; // Supprime les doublons
    }
    
    // Réinitialiser complètement les données de l'utilisateur (utile pour debug)
    resetAllUserData() {
        if (!this.currentUser) return;
        
        console.log('🗑️ Réinitialisation complète des données pour:', this.currentUser);
        
        this.wordsFound = [];
        this.saveUserData();
        
        console.log('✅ Toutes les données ont été réinitialisées');
    }

    // Vérifier si un utilisateur est connecté
    isLoggedIn() {
        return this.currentUser !== null && this.sessionManager.isLoggedIn();
    }
    
    // Restaurer automatiquement la session au chargement
    restoreSession() {
        if (this.sessionManager.isLoggedIn()) {
            const savedUser = this.sessionManager.getCurrentUser();
            if (savedUser) {
                this.currentUser = savedUser;
                this.loadUserData();
                return true;
            }
        }
        return false;
    }

    // Obtenir le nom de l'utilisateur connecté
    getCurrentUser() {
        return this.currentUser;
    }

    // Gestion des cookies
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        const encodedValue = encodeURIComponent(value);
        document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/`;
        console.log(`🍪 Cookie enregistré: ${name}`);
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                const encodedValue = c.substring(nameEQ.length, c.length);
                return decodeURIComponent(encodedValue);
            }
        }
        return null;
    }

    // Supprimer un cookie
    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    // Sauvegarder les préférences utilisateur
    saveUserPreferences(preferences) {
        this.setCookie(`${this.COOKIE_PREFIX}userPreferences`, JSON.stringify(preferences), 365);
    }

    // Charger les préférences utilisateur
    getUserPreferences() {
        const prefsCookie = this.getCookie(`${this.COOKIE_PREFIX}userPreferences`);
        if (prefsCookie) {
            return JSON.parse(prefsCookie);
        }
        return {
            selectedCategory: 'toutes'
        };
    }
}
