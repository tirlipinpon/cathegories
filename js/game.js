class WordGuessingGame {
    constructor() {
        // Utiliser les données externes
        this.hints = GAME_DATA;
        
        this.currentWord = '';
        this.currentLevel = 1;
        this.stars = 0;
        this.startTime = 0;
        this.timerInterval = null;
        this.attempts = 0;
        
        // Statistiques
        this.totalWordsFound = 0;
        this.wordTimes = [];
        this.bestTime = null;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        
        this.initializeGame();
        this.setupEventListeners();
    }

    // Fonction pour normaliser les accents
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
            .trim();
    }

    initializeGame() {
        this.selectRandomWord();
        this.updateDisplay();
        this.startTimer();
        
        // Focus automatique au démarrage
        setTimeout(() => {
            const wordInput = document.getElementById('wordInput');
            wordInput.focus();
        }, 100);
    }

    selectRandomWord() {
        // Sélectionner un mot selon le niveau
        let availableWords = Object.keys(this.hints);
        if (this.currentLevel <= 2) {
            availableWords = availableWords.filter(word => word.length === 4);
        } else if (this.currentLevel <= 4) {
            availableWords = availableWords.filter(word => word.length <= 5);
        } else {
            availableWords = availableWords.filter(word => word.length <= 6);
        }
        
        this.currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        this.attempts = 0;
        
        // Afficher l'indice correspondant
        this.updateHint();
        
        // Debug : afficher le mot dans la console
        console.log(`🎮 MOT À DEVINER: "${this.currentWord.toUpperCase()}" (Niveau ${this.currentLevel})`);
    }

    updateHint() {
        const hintText = document.getElementById('hintText');
        if (this.hints[this.currentWord]) {
            hintText.textContent = this.hints[this.currentWord];
        } else {
            hintText.textContent = 'Devine le mot !';
        }
    }

    updateDisplay() {
        const wordDisplay = document.getElementById('wordDisplay');
        wordDisplay.innerHTML = '';
        
        for (let i = 0; i < this.currentWord.length; i++) {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            letterBox.textContent = '?';
            wordDisplay.appendChild(letterBox);
        }
    }

    updateDisplayInRealTime(inputValue) {
        const wordDisplay = document.getElementById('wordDisplay');
        const letterBoxes = wordDisplay.children;
        const input = inputValue;
        const wordInput = document.getElementById('wordInput');
        
        // Ajouter une classe visuelle pendant la frappe
        if (input.length > 0) {
            wordInput.classList.add('typing');
        } else {
            wordInput.classList.remove('typing');
        }
        
        // Analyser les lettres en temps réel si on a du texte
        let result = null;
        if (input.length > 0) {
            result = this.analyzeGuess(input);
        }
        
        // Mettre à jour toutes les boîtes
        for (let i = 0; i < letterBoxes.length; i++) {
            const letterBox = letterBoxes[i];
            
            if (i < input.length) {
                // Vérifier si la lettre était déjà correcte (verte)
                const wasCorrect = letterBox.classList.contains('letter-correct');
                
                // Si la lettre change et qu'elle était correcte, la réinitialiser
                if (wasCorrect && letterBox.textContent !== input[i].toUpperCase()) {
                    letterBox.className = 'letter-box';
                }
                
                // Mettre à jour le contenu seulement si ce n'était pas une lettre correcte fixée
                if (!wasCorrect) {
                    letterBox.textContent = input[i].toUpperCase();
                    letterBox.className = 'letter-box';
                }
                
                // Appliquer les couleurs en temps réel
                if (result && result.letterStates[i]) {
                    letterBox.classList.add(`letter-${result.letterStates[i]}`);
                }
                
                // Ajouter un effet de "pulse" pour les lettres en cours de frappe
                if (i === input.length - 1) {
                    letterBox.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        letterBox.style.animation = '';
                    }, 500);
                }
            } else {
                // Réinitialiser seulement si ce n'était pas une lettre correcte fixée
                if (!letterBox.classList.contains('letter-correct')) {
                    letterBox.textContent = '?';
                    letterBox.className = 'letter-box';
                }
            }
        }
        
        // Feedback en temps réel avec analyse
        if (input.length === 0) {
            this.showFeedback(`Devine le mot de ${this.currentWord.length} lettres ! 💭`, 'info');
        } else if (input.length < this.currentWord.length) {
            if (result) {
                const correctCount = result.correctPositions;
                const wrongPlaceCount = result.wrongPositions;
                this.showFeedback(`Continue ! ${correctCount} bonne(s) place(s), ${wrongPlaceCount} mauvaise(s) place(s) ✨`, 'info');
            } else {
                this.showFeedback(`Continue ! Tu as ${input.length}/${this.currentWord.length} lettres ✨`, 'info');
            }
        } else if (input.length === this.currentWord.length) {
            if (result && result.correct) {
                this.showFeedback(`🎉 BRAVO ! Tu as trouvé le mot ! 🎉`, 'success');
            } else if (result) {
                const correctCount = result.correctPositions;
                const wrongPlaceCount = result.wrongPositions;
                this.showFeedback(`Presque ! ${correctCount} bonne(s) place(s), ${wrongPlaceCount} mauvaise(s) place(s). Appuie sur Entrée ! 🎯`, 'warning');
            } else {
                this.showFeedback(`Parfait ! Tu as ${this.currentWord.length} lettres. Appuie sur Entrée ou clique sur "Deviner !" 🎯`, 'success');
            }
        } else {
            this.showFeedback(`Trop de lettres ! Le mot fait ${this.currentWord.length} lettres 📏`, 'warning');
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('timer').textContent = elapsed + 's';
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('statsToggleBtn').addEventListener('click', () => this.toggleStats());
        
        const wordInput = document.getElementById('wordInput');
        
        // Détection en temps réel de la frappe
        wordInput.addEventListener('input', (e) => {
            this.updateDisplayInRealTime(e.target.value);
        });
        
        // Détection quand le mot est complet et correct (sans changement automatique)
        wordInput.addEventListener('input', (e) => {
            const input = e.target.value;
            const normalizedInput = this.normalizeText(input);
            const normalizedWord = this.normalizeText(this.currentWord);
            
            if (input.length === this.currentWord.length && normalizedInput === normalizedWord) {
                // Mot correct détecté - juste afficher la victoire
                this.handleWin();
            }
        });

        // Détection de la touche Entrée pour nouveau mot
        wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = e.target.value;
                const normalizedInput = this.normalizeText(input);
                const normalizedWord = this.normalizeText(this.currentWord);
                
                // Si le mot est correct, passer au suivant
                if (input.length === this.currentWord.length && normalizedInput === normalizedWord) {
                    this.newGame();
                }
            }
        });
    }

    analyzeGuess(guess) {
        const normalizedGuess = this.normalizeText(guess);
        const normalizedWord = this.normalizeText(this.currentWord);
        
        const result = {
            correct: normalizedGuess === normalizedWord,
            correctLetters: 0,
            correctPositions: 0,
            wrongPositions: 0,
            letterStates: []
        };

        const wordLetters = normalizedWord.split('');
        const guessLetters = normalizedGuess.split('');
        const usedPositions = new Set();

        // Vérifier les lettres à la bonne place
        for (let i = 0; i < guessLetters.length; i++) {
            if (guessLetters[i] === wordLetters[i]) {
                result.correctPositions++;
                result.letterStates[i] = 'correct';
                usedPositions.add(i);
            }
        }

        // Vérifier les lettres à la mauvaise place
        for (let i = 0; i < guessLetters.length; i++) {
            if (result.letterStates[i] !== 'correct') {
                for (let j = 0; j < wordLetters.length; j++) {
                    if (!usedPositions.has(j) && guessLetters[i] === wordLetters[j]) {
                        result.wrongPositions++;
                        result.letterStates[i] = 'wrong-place';
                        usedPositions.add(j);
                        break;
                    }
                }
                if (result.letterStates[i] === undefined) {
                    result.letterStates[i] = 'wrong';
                }
            }
        }

        result.correctLetters = result.correctPositions + result.wrongPositions;
        return result;
    }

    displayResult(result, guess) {
        const wordDisplay = document.getElementById('wordDisplay');
        const letterBoxes = wordDisplay.children;
        
        for (let i = 0; i < guess.length; i++) {
            const letterBox = letterBoxes[i];
            letterBox.textContent = guess[i].toUpperCase();
            letterBox.className = 'letter-box';
            
            setTimeout(() => {
                letterBox.classList.add(`letter-${result.letterStates[i]}`);
            }, i * 100);
        }
    }

    generateFeedback(result, guess) {
        if (result.correctPositions === this.currentWord.length) {
            return 'Bravo ! Tu as trouvé le mot ! 🎉';
        }
        
        let feedback = `Lettres correctes : ${result.correctLetters}/${this.currentWord.length} `;
        
        if (result.correctPositions > 0) {
            feedback += `(${result.correctPositions} à la bonne place) `;
        }
        
        if (result.wrongPositions > 0) {
            feedback += `(${result.wrongPositions} à la mauvaise place) `;
        }
        
        if (result.correctLetters === 0) {
            feedback += 'Aucune lettre correcte. Essaie encore ! 💪';
        } else if (result.correctPositions === this.currentWord.length - 1) {
            feedback += 'Presque ! Tu y es presque ! 🔥';
        } else {
            feedback += 'Continue ! Tu progresses ! ⭐';
        }
        
        return feedback;
    }

    handleWin() {
        this.stopTimer();
        const timeElapsed = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Mettre à jour les statistiques
        this.totalWordsFound++;
        this.wordTimes.push(timeElapsed);
        this.currentStreak++;
        this.correctAttempts++;
        this.totalAttempts++;
        
        // Meilleur temps
        if (this.bestTime === null || timeElapsed < this.bestTime) {
            this.bestTime = timeElapsed;
        }
        
        // Meilleure série
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }
        
        // Calculer les étoiles selon le temps et les tentatives
        let starsEarned = 3;
        if (this.attempts > 3) starsEarned = 2;
        if (this.attempts > 5) starsEarned = 1;
        if (timeElapsed > 60) starsEarned = Math.max(1, starsEarned - 1);
        
        this.stars += starsEarned;
        this.currentLevel++;
        
        this.showFeedback(`🎉 BRAVO ! Tu as trouvé "${this.currentWord.toUpperCase()}" en ${timeElapsed}s ! Appuie sur Entrée ou clique sur "Nouveau Mot" ! 🎉`, 'success');
        this.showStars(starsEarned);
        this.updateScore();
        this.updateStats();
        this.createCelebration();
        
        // Vider le champ de saisie
        const input = document.getElementById('wordInput');
        input.value = '';
        input.classList.remove('typing');
        
        // Ne pas changer automatiquement - attendre que l'utilisateur clique sur "Nouveau Mot"
    }

    showStars(count) {
        const starsDisplay = document.getElementById('starsDisplay');
        starsDisplay.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '⭐';
            star.style.animationDelay = `${i * 0.2}s`;
            starsDisplay.appendChild(star);
        }
        
        setTimeout(() => {
            starsDisplay.innerHTML = '';
        }, 3000);
    }

    updateScore() {
        document.getElementById('stars').textContent = this.stars;
        document.getElementById('level').textContent = this.currentLevel;
        document.getElementById('levelIndicator').textContent = `Niveau ${this.currentLevel}`;
        document.getElementById('wordsFound').textContent = this.totalWordsFound;
    }

    updateStats() {
        // Mots trouvés
        document.getElementById('totalWords').textContent = this.totalWordsFound;
        
        // Temps moyen
        if (this.wordTimes.length > 0) {
            const avgTime = Math.round(this.wordTimes.reduce((a, b) => a + b, 0) / this.wordTimes.length);
            document.getElementById('avgTime').textContent = avgTime + 's';
        }
        
        // Meilleur temps
        if (this.bestTime !== null) {
            document.getElementById('bestTime').textContent = this.bestTime + 's';
        }
        
        // Série actuelle
        document.getElementById('currentStreak').textContent = this.currentStreak;
        
        // Meilleure série
        document.getElementById('bestStreak').textContent = this.bestStreak;
        
        // Précision
        if (this.totalAttempts > 0) {
            const accuracy = Math.round((this.correctAttempts / this.totalAttempts) * 100);
            document.getElementById('accuracy').textContent = accuracy + '%';
        }
    }

    toggleStats() {
        const statsSection = document.getElementById('statsSection');
        const toggleBtn = document.getElementById('statsToggleBtn');
        
        if (statsSection.classList.contains('hidden')) {
            // Afficher les statistiques
            statsSection.classList.remove('hidden');
            toggleBtn.textContent = '📊 Masquer les Statistiques';
            toggleBtn.classList.add('active');
        } else {
            // Masquer les statistiques
            statsSection.classList.add('hidden');
            toggleBtn.textContent = '📈 Voir les Statistiques';
            toggleBtn.classList.remove('active');
        }
    }

    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
    }

    createCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        document.body.appendChild(celebration);
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 5)];
            celebration.appendChild(confetti);
        }
        
        setTimeout(() => {
            document.body.removeChild(celebration);
        }, 3000);
    }

    newGame() {
        this.stopTimer();
        this.selectRandomWord();
        this.updateDisplay();
        this.showFeedback(`Nouveau mot de ${this.currentWord.length} lettres ! Devine-le ! 💭`, 'info');
        this.startTimer();
        this.updateStats();
        
        // Réinitialiser complètement l'affichage des lettres
        const wordDisplay = document.getElementById('wordDisplay');
        const letterBoxes = wordDisplay.children;
        for (let i = 0; i < letterBoxes.length; i++) {
            letterBoxes[i].textContent = '?';
            letterBoxes[i].className = 'letter-box';
        }
        
        // Focus automatique sur le champ de saisie
        const wordInput = document.getElementById('wordInput');
        wordInput.focus();
    }
}

// Démarrer le jeu
document.addEventListener('DOMContentLoaded', () => {
    new WordGuessingGame();
});
