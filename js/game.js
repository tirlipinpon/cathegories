// Jeu principal - Orchestrateur
// Version: 2.0.4
const GAME_VERSION = '2.0.4';

class WordGuessingGame {
    constructor() {
        // Afficher la version
        console.log(`%c🎮 Jeu de Devinette de Mots - Version ${GAME_VERSION}`, 'color: #667eea; font-size: 16px; font-weight: bold;');
        console.log(`%c📅 ${new Date().toLocaleString('fr-FR')}`, 'color: #10b981; font-size: 12px;');
        console.log('');
        
        // Afficher la quantité de mots
        const totalCount = Object.keys(GAME_DATA).length;
        
        console.log(`%c📊 Statistiques des mots :`, 'color: #f59e0b; font-weight: bold;');
        console.log(`   📈 TOTAL : ${totalCount} mots disponibles`);
        console.log('');
        
        // Initialiser les gestionnaires
        this.ui = new UIManager();
        this.soundManager = new SoundManager();
        this.hintManager = new HintManager();
        this.wordManager = new WordManager(GAME_DATA);
        this.timer = new TimerManager(this.ui.domElements.timer);
        this.userManager = new UserManager();
        
        // Nouveaux gestionnaires
        this.inputHandler = new InputHandler(this);
        
        // État du jeu
        this.currentWord = '';
        this.currentCategory = 'toutes';
        this.attempts = 0;
        this.isCurrentWordCorrect = false;
        this.helpUsed = false;
        
        // Afficher la version dans l'UI
        this.ui.displayVersion(GAME_VERSION);
        
        // Initialiser le jeu
        this.loadUserPreferences();
        this.initializeGame();
        this.setupEventListeners();
        this.updateVisibility();
        this.updateCategorySelect();
    }

    initializeGame() {
        // Ne lancer un mot que si l'utilisateur n'est pas connecté
        if (!this.userManager.isLoggedIn()) {
            this.selectRandomWord();
            this.ui.createLetterBoxes(this.currentWord.length);
            this.timer.start();
            this.hintManager.resetHelp();
            this.inputHandler.reset();
        }
    }

    selectRandomWord() {
        const result = this.wordManager.selectRandomWord(this.userManager, this.currentCategory);
        
        // Si tous les mots sont complétés
        if (result.allWordsCompleted) {
            console.log(`🎉 Tous les mots du jeu complétés !`);
            this.handleGameCompleted();
            return;
        }
        
        // Si la catégorie est complétée (mais pas le jeu entier)
        if (result.categoryCompleted) {
            console.log(`🎉 Catégorie ${this.currentCategory} complétée !`);
            const categoryName = getCategoryName(this.currentCategory);
            this.ui.showFeedback(`🎉 Tous les mots ${categoryName} trouvés !`, 'success');
            this.soundManager.play('wordFound');
            
            // Retour automatique à "Toutes"
            setTimeout(() => {
                this.currentCategory = 'toutes';
                this.updateCategorySelect();
                this.selectRandomWord();
                this.ui.createLetterBoxes(this.currentWord.length);
                this.timer.start();
                this.hintManager.resetHelp();
                this.inputHandler.reset();
            }, 2000);
            return;
        }
        
        this.currentWord = result.word;
        this.attempts = 0;
        
        // Configurer le nombre d'aides selon la longueur du mot
        this.hintManager.setMaxHelpByWordLength(this.currentWord.length);
        
        console.log(`%c🎯 MOT ACTUEL: "${this.currentWord.toUpperCase()}"`, 'color: #f59e0b; font-size: 14px; font-weight: bold; background: #fef3c7; padding: 4px 8px; border-radius: 4px;');
        console.log(`📏 Longueur: ${this.currentWord.length} lettres | 🗂️ Catégorie: ${this.currentCategory}`);
        console.log('');
        
        const hint = this.wordManager.getHint(this.currentWord);
        this.hintManager.showHint(hint);
    }

    setupEventListeners() {
        // Connexion/Déconnexion
        this.ui.domElements.loginBtn.addEventListener('click', () => this.handleLogin());
        this.ui.domElements.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.ui.domElements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        
        // Bouton d'aide
        this.hintManager.domElements.helpBtn.addEventListener('click', () => this.handleHelp());
        
        // Bouton son
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.toggleSound());
            this.updateSoundButton();
        }
        
        // Sélecteur de catégorie
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => this.setCategory(e.target.value));
        }
    }
    
    // Changer la catégorie
    setCategory(category) {
        this.currentCategory = category;
        console.log(`🗂️ Catégorie changée: ${category}`);
        
        const categoryName = getCategoryName(category);
        this.ui.showFeedback(`Catégorie: ${categoryName}`, 'info');
        
        // Sauvegarder la préférence
        this.saveUserPreferences();
        
        this.newGame();
    }
    
    // Mettre à jour la liste déroulante des catégories
    updateCategorySelect() {
        const select = document.getElementById('categorySelect');
        if (!select || typeof getAvailableCategories !== 'function') return;
        
        // Obtenir les catégories disponibles (avec mots restants seulement)
        const availableCategories = getAvailableCategories(GAME_DATA, this.userManager);
        
        // Si la catégorie actuelle n'est plus disponible, revenir à "toutes"
        if (!availableCategories.includes(this.currentCategory)) {
            this.currentCategory = 'toutes';
        }
        
        // Vider et repeupler
        select.innerHTML = '';
        
        availableCategories.forEach(categoryKey => {
            const option = document.createElement('option');
            option.value = categoryKey;
            
            // Afficher nom + nombre SEULEMENT si pas "toutes"
            if (categoryKey === 'toutes') {
                option.textContent = getCategoryName(categoryKey);
            } else {
                // Compter les mots RESTANTS dans cette catégorie
                const wordCount = getWordCountInCategory(categoryKey, GAME_DATA, this.userManager);
                option.textContent = `${getCategoryName(categoryKey)} (${wordCount})`;
            }
            
            if (categoryKey === this.currentCategory) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        console.log(`🗂️ Catégories disponibles: ${availableCategories.length} (mots restants affichés)`);
    }
    
    // Activer/Désactiver les sons
    toggleSound() {
        const isMuted = this.soundManager.toggleMute();
        this.updateSoundButton();
        this.soundManager.play('click');
    }
    
    // Mettre à jour l'apparence du bouton son
    updateSoundButton() {
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            if (this.soundManager.isMuted) {
                soundBtn.textContent = '🔇';
                soundBtn.classList.add('muted');
                soundBtn.title = 'Activer les sons';
            } else {
                soundBtn.textContent = '🔊';
                soundBtn.classList.remove('muted');
                soundBtn.title = 'Désactiver les sons';
            }
        }
    }

    showCorrectWord() {
        this.timer.stop();
        const timeElapsed = this.timer.getElapsed();
        
        this.isCurrentWordCorrect = true;
        this.soundManager.play('wordFound');
        this.ui.showVictoryEffect();
        this.ui.showFeedback(`🎉 BRAVO ! Tu as trouvé "${this.currentWord.toUpperCase()}" en ${timeElapsed}s !`, 'success');
        this.ui.createCelebration();
        this.inputHandler.reset();
        
        // Passer automatiquement au mot suivant après 2.5 secondes
        setTimeout(() => {
            this.newGame();
        }, 2500);
    }

    handleWin() {
        this.timer.stop();
        const timeElapsed = this.timer.getElapsed();
        
        if (this.userManager.isLoggedIn()) {
            this.saveProgress();
        }
        
        this.ui.showFeedback(`🎉 BRAVO ! Tu as trouvé "${this.currentWord.toUpperCase()}" en ${timeElapsed}s !`, 'success');
        this.ui.createCelebration();
        this.inputHandler.reset();
    }

    saveProgress() {
        console.log(`💾 Sauvegarde du mot "${this.currentWord}"`);
        
        this.userManager.addWordFound(this.currentWord);
        
        console.log(`✅ Sauvegarde du mot terminée`);
    }

    newGame() {
        if (this.isCurrentWordCorrect) {
            this.handleWin();
        }
        
        this.isCurrentWordCorrect = false;
        this.helpUsed = false;
        
        this.timer.stop();
        this.selectRandomWord();
        this.ui.createLetterBoxes(this.currentWord.length);
        this.ui.showFeedback(`Nouveau mot de ${this.currentWord.length} lettres ! Devine-le ! 💭`, 'info');
        this.timer.start();
        this.ui.resetLetterBoxes();
        this.hintManager.resetHelp();
        this.inputHandler.reset();
        this.updateCategorySelect();
    }
    
    // Gérer l'aide - révéler la prochaine lettre manquante
    handleHelp() {
        if (this.isCurrentWordCorrect) {
            return;
        }
        
        const letterBoxes = this.ui.domElements.wordDisplay.children;
        const currentCursorPosition = this.ui.getCursorPosition();
        
        const result = this.hintManager.revealNextLetter(this.currentWord, letterBoxes, currentCursorPosition);
        
        if (result) {
            this.helpUsed = true;
            this.soundManager.play('hint');
            
            const remaining = this.hintManager.maxHelpAllowed - this.hintManager.helpUsedCount;
            if (remaining > 0) {
                this.ui.showFeedback(`💡 Indice révélé ! (${remaining} aide${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}) Tape une lettre pour réutiliser l'aide ! 💪`, 'info');
            } else {
                this.ui.showFeedback(`💡 Dernier indice révélé ! Plus d'aide disponible ! 💪`, 'info');
            }
        } else {
            // Vérifier si c'est bloqué par la position du curseur ou par le nombre d'aides
            if (this.hintManager.helpUsedCount < this.hintManager.maxHelpAllowed) {
                this.ui.showFeedback(`⚠️ Tape d'abord une lettre avant de redemander l'aide !`, 'warning');
            } else {
                this.ui.showFeedback(`⚠️ Toutes les aides ont été utilisées !`, 'warning');
            }
        }
    }

    // Gestion de la connexion
    handleLogin() {
        const username = this.ui.domElements.usernameInput.value.trim();
        
        if (!username) {
            this.ui.showFeedback('Veuillez entrer un nom !', 'error');
            return;
        }
        
        if (this.userManager.login(username)) {
            this.loadUserData();
            this.ui.showFeedback(`Bienvenue ${username} ! Tes données ont été chargées.`, 'success');
            this.ui.setCurrentUser(username);
            this.updateVisibility();
        } else {
            this.ui.showFeedback('Erreur lors de la connexion.', 'error');
        }
    }

    handleLogout() {
        this.userManager.logout();
        this.updateVisibility();
        this.updateCategorySelect();
        this.ui.showFeedback('Déconnexion réussie. Tes données sont sauvegardées.', 'info');
    }

    loadUserData() {
        if (this.userManager.isLoggedIn()) {
            const wordsFound = this.userManager.getWordsFound();
            console.log(`📊 Mots trouvés: ${wordsFound.length}`);
            
            this.updateCategorySelect();
            
            // Vérifier si tous les mots sont trouvés
            const allWords = this.wordManager.getAllWords();
            if (wordsFound.length >= allWords.length) {
                console.log(`🏆 Tous les mots sont complétés !`);
                this.handleGameCompleted();
            } else {
                // Lancer un mot
                this.selectRandomWord();
                this.ui.createLetterBoxes(this.currentWord.length);
                this.timer.start();
                this.hintManager.resetHelp();
                this.inputHandler.reset();
            }
        }
    }

    // Gérer la complétion du jeu
    handleGameCompleted() {
        this.ui.showFeedback(`🏆 FÉLICITATIONS ! Tu as terminé TOUS les mots du jeu ! 🏆 Tu es un CHAMPION ! 👑`, 'success');
        this.ui.createCelebration();
        this.soundManager.play('wordFound');
    }

    updateVisibility() {
        this.ui.updateVisibilityForLogin(this.userManager.isLoggedIn());
    }

    loadUserPreferences() {
        const preferences = this.userManager.getUserPreferences();
        this.currentCategory = preferences.selectedCategory || 'toutes';
        console.log(`📂 Préférences chargées: catégorie = ${this.currentCategory}`);
    }

    saveUserPreferences() {
        const preferences = {
            selectedCategory: this.currentCategory
        };
        
        console.log(`💾 Sauvegarde des préférences: catégorie = ${this.currentCategory}`);
        this.userManager.saveUserPreferences(preferences);
    }
}

// Démarrer le jeu
let gameInstance;
document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new WordGuessingGame();
    
    // Fonction globale pour réinitialiser les données (accessible dans la console)
    window.resetUserData = () => {
        if (gameInstance && gameInstance.userManager && gameInstance.userManager.isLoggedIn()) {
            const username = gameInstance.userManager.getCurrentUser();
            if (confirm(`⚠️ Êtes-vous sûr de vouloir réinitialiser TOUTES les données de ${username} ?`)) {
                gameInstance.userManager.resetAllUserData();
                location.reload();
            }
        } else {
            console.log('⚠️ Aucun utilisateur connecté');
        }
    };
    
    console.log('💡 Astuce: Tape resetUserData() dans la console pour réinitialiser tes données');
});
