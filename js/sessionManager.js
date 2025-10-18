// ============================================================
// SESSION MANAGER - Gestionnaire de session multi-applications
// ============================================================
// 
// 📦 FICHIER AUTONOME ET RÉUTILISABLE
// Copiez ce fichier dans toutes vos applications !
//
// 🎯 FONCTIONNALITÉS :
// - Garde l'utilisateur connecté au refresh de la page
// - Déconnecte l'utilisateur à la fermeture de l'onglet
// - Partage le nom d'utilisateur entre toutes vos applications
//
// 🔧 CONFIGURATION :
// Changez le SHARED_PREFIX si vous voulez un autre nom commun
// ============================================================

class SessionManager {
    constructor() {
        // 🔑 PRÉFIXE PARTAGÉ entre toutes vos applications
        // Changez cette valeur si vous voulez un autre nom
        this.SHARED_PREFIX = 'shared_apps_';
        
        // Clés de stockage
        this.SESSION_KEY = 'session_active';           // sessionStorage (disparaît à la fermeture)
        this.SHARED_USER_KEY = `${this.SHARED_PREFIX}current_user`; // localStorage (partagé entre apps)
        
        // État actuel
        this.currentUser = null;
        
        // Initialiser automatiquement
        this.initialize();
    }

    // 🚀 Initialisation automatique au chargement
    initialize() {
        console.log('🔐 SessionManager : Initialisation...');
        
        // Vérifier si une session est active (sessionStorage)
        const sessionActive = sessionStorage.getItem(this.SESSION_KEY);
        
        if (sessionActive === 'true') {
            // Session active = recharger l'utilisateur depuis localStorage
            const savedUser = localStorage.getItem(this.SHARED_USER_KEY);
            
            if (savedUser) {
                this.currentUser = savedUser;
                console.log(`✅ Session restaurée : ${this.currentUser}`);
                return true;
            } else {
                // Session active mais pas d'utilisateur = nettoyer
                this.clearSession();
            }
        }
        
        console.log('ℹ️ Aucune session active');
        return false;
    }

    // 🔓 Connexion d'un utilisateur
    login(username) {
        if (!username || username.trim() === '') {
            console.error('❌ Nom d\'utilisateur vide');
            return false;
        }

        const cleanUsername = username.trim();
        
        // Sauvegarder dans sessionStorage (disparaît à la fermeture)
        sessionStorage.setItem(this.SESSION_KEY, 'true');
        
        // Sauvegarder dans localStorage (partagé entre apps)
        localStorage.setItem(this.SHARED_USER_KEY, cleanUsername);
        
        this.currentUser = cleanUsername;
        
        console.log(`✅ Connexion réussie : ${this.currentUser}`);
        console.log(`📍 Session partagée avec toutes les apps (préfixe: ${this.SHARED_PREFIX})`);
        
        return true;
    }

    // 🔒 Déconnexion
    logout() {
        if (!this.currentUser) {
            console.log('⚠️ Aucun utilisateur connecté');
            return;
        }
        
        const username = this.currentUser;
        
        // Nettoyer sessionStorage
        sessionStorage.removeItem(this.SESSION_KEY);
        
        // Nettoyer localStorage (utilisateur partagé)
        localStorage.removeItem(this.SHARED_USER_KEY);
        
        this.currentUser = null;
        
        console.log(`👋 Déconnexion de : ${username}`);
    }

    // ❓ Vérifier si un utilisateur est connecté
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // 👤 Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // 🧹 Nettoyer la session (en cas d'erreur)
    clearSession() {
        sessionStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.SHARED_USER_KEY);
        this.currentUser = null;
        console.log('🧹 Session nettoyée');
    }

    // 📊 Debug : afficher l'état actuel
    getDebugInfo() {
        return {
            currentUser: this.currentUser,
            sessionActive: sessionStorage.getItem(this.SESSION_KEY),
            sharedUser: localStorage.getItem(this.SHARED_USER_KEY),
            sharedPrefix: this.SHARED_PREFIX
        };
    }
}

// ============================================================
// 📝 COMMENT UTILISER DANS VOS APPLICATIONS :
// ============================================================
//
// 1. Copiez ce fichier dans votre dossier js/
//
// 2. Ajoutez dans votre HTML (AVANT vos autres scripts) :
//    <script src="js/sessionManager.js"></script>
//
// 3. Dans votre code JavaScript :
//
//    // Créer une instance
//    const sessionManager = new SessionManager();
//
//    // Vérifier si connecté (auto-restauré au chargement)
//    if (sessionManager.isLoggedIn()) {
//        console.log('Utilisateur connecté:', sessionManager.getCurrentUser());
//    }
//
//    // Connexion
//    sessionManager.login('MonNom');
//
//    // Déconnexion
//    sessionManager.logout();
//
//    // Obtenir l'utilisateur actuel
//    const username = sessionManager.getCurrentUser();
//
// ============================================================
// 🎯 COMPORTEMENTS :
// ============================================================
//
// ✅ Refresh de la page (F5) → Utilisateur RESTE connecté
// ❌ Fermeture de l'onglet → Utilisateur est déconnecté
// 🔄 Changement d'application → Utilisateur RESTE connecté
//
// ============================================================

