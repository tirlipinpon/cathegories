// Jeu principal - Orchestrateur
class WordGuessingGame {
    constructor() {
        // Initialiser les gestionnaires
        this.ui = new UIManager();
        this.hintManager = new HintManager();
        this.wordManager = new WordManager(GAME_DATA);
        this.timer = new TimerManager(this.ui.domElements.timer);
        this.userManager = new UserManager();
        this.statsManager = new StatsManager();
        
        // État du jeu
        this.currentWord = '';
        this.currentLevel = 1;
        this.stars = 0;
        this.currentDifficulty = 'easy';
        this.attempts = 0;
        this.isCurrentWordCorrect = false;
        this.previousInputValue = '';
        this.helpUsed = false;
        
        // Statistiques
        this.totalWordsFound = 0;
        this.wordTimes = [];
        this.bestTime = null;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        
        // Initialiser le jeu
        this.initializeGame();
        this.setupEventListeners();
        this.updateDifficultyCounts();
        this.updateLevelStatus();
        this.loadUserPreferences();
        this.statsManager.loadStats();
        this.updateVisibility();
    }

    initializeGame() {
        this.selectRandomWord();
        this.ui.createLetterBoxes(this.currentWord.length);
        this.timer.start();
        this.ui.disableNextWordButton();
        this.hintManager.resetHelp();
        
        setTimeout(() => {
            this.ui.focusInput();
        }, 100);
    }

    selectRandomWord() {
        const result = this.wordManager.selectRandomWord(this.currentDifficulty, this.userManager);
        this.currentWord = result.word;
        this.attempts = 0;
        
        if (result.allWordsCompleted) {
            this.ui.showFeedback(`🎉 Félicitations ! Tu as trouvé tous les mots du niveau ${this.currentDifficulty} ! Recommençons ! 🎉`, 'success');
        }
        
        const hint = this.wordManager.getHint(this.currentWord, this.currentDifficulty);
        this.hintManager.showHint(hint);
    }

    setupEventListeners() {
        // Bouton nouveau mot
        this.ui.domElements.newGameBtn.addEventListener('click', () => {
            if (this.isCurrentWordCorrect) {
                this.newGame();
            }
        });
        
        // Connexion/Déconnexion
        this.ui.domElements.loginBtn.addEventListener('click', () => this.handleLogin());
        this.ui.domElements.logoutBtn.addEventListener('click', () => this.handleLogout());
        this.ui.domElements.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });
        
        // Boutons de difficulté
        this.ui.domElements.easyBtn.addEventListener('click', () => this.setDifficulty('easy'));
        this.ui.domElements.mediumBtn.addEventListener('click', () => this.setDifficulty('medium'));
        this.ui.domElements.hardBtn.addEventListener('click', () => this.setDifficulty('hard'));
        
        // Toggle score
        this.ui.domElements.scoreToggle.addEventListener('click', () => this.toggleSection('score'));
        
        // Bouton d'aide
        this.hintManager.domElements.helpBtn.addEventListener('click', () => this.handleHelp());
        
        // Input du mot
        this.ui.domElements.wordInput.addEventListener('input', (e) => {
            this.handleInput(e.target.value);
        });
        
        // Touche Entrée
        this.ui.domElements.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                if (this.isCurrentWordCorrect) {
                    this.newGame();
                } else {
                    this.ui.showFeedback('Continue ! Tu n\'as pas encore trouvé le bon mot ! 💪', 'warning');
                }
            }
        });
    }

    handleInput(inputValue) {
        const letterBoxes = this.ui.domElements.wordDisplay.children;
        
        // Compter les lettres vertes consécutives
        const consecutiveGreenCount = this.wordManager.countConsecutiveGreenLetters(letterBoxes);
        
        // Limiter la longueur
        let input = inputValue;
        if (input.length > this.currentWord.length) {
            input = input.substring(0, this.currentWord.length);
            this.ui.domElements.wordInput.value = input;
        }
        
        // S'assurer que l'input contient toujours les lettres vertes au début
        if (consecutiveGreenCount > 0) {
            let greenLetters = '';
            for (let i = 0; i < consecutiveGreenCount; i++) {
                greenLetters += letterBoxes[i].textContent;
            }
            
            // Si l'input ne commence pas par les lettres vertes, le corriger
            if (!input.toUpperCase().startsWith(greenLetters)) {
                input = greenLetters + input.substring(consecutiveGreenCount);
                this.ui.domElements.wordInput.value = input;
            }
            
            // Empêcher de supprimer les lettres vertes
            if (input.length < consecutiveGreenCount) {
                this.ui.domElements.wordInput.value = this.previousInputValue || greenLetters;
                this.ui.showFeedback('Tu ne peux pas supprimer les lettres vertes ! 🚫', 'warning');
                return;
            }
        }
        
        // Classe typing
        if (input.length > 0) {
            this.ui.domElements.wordInput.classList.add('typing');
        } else {
            this.ui.domElements.wordInput.classList.remove('typing');
        }
        
        // Analyser la tentative
        let result = null;
        if (input.length > 0) {
            result = this.wordManager.analyzeGuess(input, this.currentWord);
        }
        
        // Mettre à jour l'affichage
        this.ui.updateLetterBoxes(input, result ? result.letterStates : null);
        
        // Vérifier si le mot est trouvé
        if (input.length > 0 && this.wordManager.areAllLettersCorrect(letterBoxes)) {
            if (!this.isCurrentWordCorrect) {
                this.showCorrectWord();
            }
        }
        
        // Feedback
        this.provideFeedback(input, result);
        
        this.previousInputValue = input;
    }

    provideFeedback(input, result) {
        if (input.length === 0) {
            this.ui.showFeedback(`Devine le mot de ${this.currentWord.length} lettres ! 💭`, 'info');
        } else if (input.length < this.currentWord.length) {
            if (result) {
                this.ui.showFeedback(`Continue ! ${result.correctPositions} bonne(s) place(s), ${result.wrongPositions} mauvaise(s) place(s) ✨`, 'info');
            } else {
                this.ui.showFeedback(`Continue ! Tu as ${input.length}/${this.currentWord.length} lettres ✨`, 'info');
            }
        } else if (input.length === this.currentWord.length) {
            if (result && result.correct) {
                this.ui.showFeedback(`🎉 BRAVO ! Tu as trouvé le mot ! 🎉`, 'success');
            } else if (result) {
                this.ui.showFeedback(`Presque ! ${result.correctPositions} bonne(s) place(s), ${result.wrongPositions} mauvaise(s) place(s). Appuie sur Entrée ! 🎯`, 'warning');
            }
        }
    }

    showCorrectWord() {
        this.timer.stop();
        const timeElapsed = this.timer.getElapsed();
        
        this.isCurrentWordCorrect = true;
        this.ui.showVictoryEffect();
        this.ui.showFeedback(`🎉 BRAVO ! Tu as trouvé "${this.currentWord.toUpperCase()}" en ${timeElapsed}s ! Appuie sur Entrée ou clique sur "Nouveau Mot" ! 🎉`, 'success');
        this.ui.createCelebration();
        this.ui.clearInput();
        this.ui.enableNextWordButton();
    }

    handleWin() {
        this.timer.stop();
        const timeElapsed = this.timer.getElapsed();
        
        if (this.userManager.isLoggedIn()) {
            this.updateGameStats(timeElapsed);
            this.saveProgress();
            this.updateUI();
        }
        
        this.ui.showFeedback(`🎉 BRAVO ! Tu as trouvé "${this.currentWord.toUpperCase()}" en ${timeElapsed}s ! Appuie sur Entrée ou clique sur "Nouveau Mot" ! 🎉`, 'success');
        this.ui.createCelebration();
        this.ui.clearInput();
    }

    updateGameStats(timeElapsed) {
        this.totalWordsFound++;
        this.wordTimes.push(timeElapsed);
        this.currentStreak++;
        this.correctAttempts++;
        this.totalAttempts++;
        
        if (this.bestTime === null || timeElapsed < this.bestTime) {
            this.bestTime = timeElapsed;
        }
        
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }
        
        // Calculer les étoiles
        let starsEarned = 3;
        if (this.attempts > 3) starsEarned = 2;
        if (this.attempts > 5) starsEarned = 1;
        if (timeElapsed > 60) starsEarned = Math.max(1, starsEarned - 1);
        
        this.stars += starsEarned;
        this.currentLevel++;
        
        this.ui.showStars(starsEarned);
    }

    saveProgress() {
        this.userManager.addWordFound(this.currentWord, this.currentDifficulty);
        this.userManager.updateStats({
            totalWordsFound: this.totalWordsFound,
            wordTimes: this.wordTimes,
            bestTime: this.bestTime,
            currentStreak: this.currentStreak,
            bestStreak: this.bestStreak,
            totalAttempts: this.totalAttempts,
            correctAttempts: this.correctAttempts,
            stars: this.stars,
            currentLevel: this.currentLevel
        });
        
        const isPerfect = this.attempts === 1;
        const timeElapsed = this.timer.getElapsed();
        this.statsManager.addWordFound(this.currentWord, this.currentDifficulty, timeElapsed, this.attempts, isPerfect);
    }

    updateUI() {
        this.ui.updateScore(this.stars, this.currentLevel, this.totalWordsFound);
        this.updateStats();
        this.updateDifficultyCounts();
        this.updateLevelStatus();
    }

    newGame() {
        if (this.isCurrentWordCorrect) {
            this.handleWin();
        }
        
        this.isCurrentWordCorrect = false;
        this.previousInputValue = '';
        this.helpUsed = false;
        
        this.timer.stop();
        this.selectRandomWord();
        this.ui.createLetterBoxes(this.currentWord.length);
        this.ui.showFeedback(`Nouveau mot de ${this.currentWord.length} lettres ! Devine-le ! 💭`, 'info');
        this.timer.start();
        this.updateStats();
        this.ui.resetLetterBoxes();
        this.hintManager.resetHelp();
        this.ui.disableNextWordButton();
        this.ui.focusInput();
    }
    
    // Gérer l'aide - révéler la prochaine lettre manquante
    handleHelp() {
        if (this.helpUsed || this.isCurrentWordCorrect) {
            return;
        }
        
        const letterBoxes = this.ui.domElements.wordDisplay.children;
        
        const result = this.hintManager.revealNextLetter(this.currentWord, letterBoxes);
        
        if (result) {
            this.helpUsed = true;
            this.ui.showFeedback(`💡 Indice révélé ! Continue ! 💪`, 'info');
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
            this.updateLevelStatus();
        } else {
            this.ui.showFeedback('Erreur lors de la connexion.', 'error');
        }
    }

    handleLogout() {
        this.userManager.logout();
        this.resetGameStats();
        this.updateVisibility();
        this.updateLevelStatus();
        this.updateDifficultyCounts();
        this.ui.showFeedback('Déconnexion réussie. Tes données sont sauvegardées.', 'info');
    }

    loadUserData() {
        if (this.userManager.isLoggedIn()) {
            const userStats = this.userManager.getUserStats();
            this.totalWordsFound = userStats.totalWordsFound;
            this.wordTimes = userStats.wordTimes;
            this.bestTime = userStats.bestTime;
            this.currentStreak = userStats.currentStreak;
            this.bestStreak = userStats.bestStreak;
            this.totalAttempts = userStats.totalAttempts;
            this.correctAttempts = userStats.correctAttempts;
            this.stars = userStats.stars;
            this.currentLevel = userStats.currentLevel;
            
            this.ui.updateScore(this.stars, this.currentLevel, this.totalWordsFound);
            this.updateStats();
            this.updateDifficultyCounts();
            this.updateLevelStatus();
        }
    }

    resetGameStats() {
        this.totalWordsFound = 0;
        this.wordTimes = [];
        this.bestTime = null;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        this.stars = 0;
        this.currentLevel = 1;
        
        this.ui.updateScore(this.stars, this.currentLevel, this.totalWordsFound);
        this.updateStats();
    }

    // Changer la difficulté
    setDifficulty(difficulty) {
        this.currentDifficulty = difficulty;
        this.ui.updateDifficultyButtons(difficulty);
        this.ui.showFeedback(`Niveau changé : ${this.ui.DIFFICULTY_NAMES[difficulty]}`, 'info');
        this.newGame();
        this.saveUserPreferences();
    }

    updateDifficultyCounts() {
        const difficulties = ['easy', 'medium', 'hard'];
        const counts = {};
        
        difficulties.forEach(difficulty => {
            const allWords = this.wordManager.getWordsByDifficulty(difficulty);
            const foundWords = this.userManager.isLoggedIn() 
                ? this.userManager.getWordsFoundByDifficulty(difficulty) 
                : [];
            
            counts[difficulty] = {
                found: foundWords.length,
                total: allWords.length
            };
        });
        
        this.ui.updateDifficultyCounts(counts, this.userManager.isLoggedIn());
    }

    toggleSection(sectionName) {
        const toggleHeader = document.getElementById(`${sectionName}Toggle`);
        const toggleContent = document.getElementById(`${sectionName}Content`);
        const toggleIcon = toggleHeader.querySelector('.toggle-icon');
        
        if (toggleContent.classList.contains('hidden')) {
            toggleContent.classList.remove('hidden');
            toggleHeader.classList.add('active');
            toggleIcon.textContent = '−';
        } else {
            toggleContent.classList.add('hidden');
            toggleHeader.classList.remove('active');
            toggleIcon.textContent = '+';
        }
        
        this.saveUserPreferences();
    }

    updateLevelStatus() {
        this.ui.updateLevelDisplay(this.currentLevel, this.userManager.isLoggedIn());
    }

    updateVisibility() {
        this.ui.updateVisibilityForLogin(this.userManager.isLoggedIn());
    }

    updateStats() {
        const avgTime = this.wordTimes.length > 0 
            ? Math.round(this.wordTimes.reduce((a, b) => a + b, 0) / this.wordTimes.length)
            : 0;
        
        const accuracy = this.totalAttempts > 0 
            ? Math.round((this.correctAttempts / this.totalAttempts) * 100)
            : 0;
        
        const advancedStats = this.statsManager.getAllStats();
        
        this.ui.updateStats({
            totalWordsFound: this.totalWordsFound,
            avgTime: avgTime,
            bestTime: this.bestTime,
            currentStreak: this.currentStreak,
            bestStreak: this.bestStreak,
            accuracy: accuracy,
            advanced: advancedStats
        }, (seconds) => this.timer.formatTime(seconds));
    }

    loadUserPreferences() {
        const preferences = this.userManager.getUserPreferences();
        
        Object.keys(preferences.toggledSections).forEach(sectionName => {
            if (sectionName === 'score' && !this.userManager.isLoggedIn()) {
                return;
            }
            
            const isOpen = preferences.toggledSections[sectionName];
            const toggleHeader = document.getElementById(`${sectionName}Toggle`);
            const toggleContent = document.getElementById(`${sectionName}Content`);
            
            if (!toggleHeader || !toggleContent) return;
            
            const toggleIcon = toggleHeader.querySelector('.toggle-icon');
            
            if (isOpen) {
                toggleContent.classList.remove('hidden');
                toggleHeader.classList.add('active');
                toggleIcon.textContent = '−';
            } else {
                toggleContent.classList.add('hidden');
                toggleHeader.classList.remove('active');
                toggleIcon.textContent = '+';
            }
        });
        
        this.currentDifficulty = preferences.selectedDifficulty;
        this.ui.updateDifficultyButtons(this.currentDifficulty);
    }

    saveUserPreferences() {
        const preferences = {
            toggledSections: {
                score: !this.ui.domElements.scoreContent.classList.contains('hidden')
            },
            selectedDifficulty: this.currentDifficulty
        };
        
        this.userManager.saveUserPreferences(preferences);
    }
}

// Démarrer le jeu
document.addEventListener('DOMContentLoaded', () => {
    new WordGuessingGame();
});