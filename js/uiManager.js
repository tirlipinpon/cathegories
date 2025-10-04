// Gestionnaire de l'interface utilisateur
class UIManager {
    constructor() {
        this.domElements = {};
        this.cacheDOMElements();
    }
    
    // Afficher la version dans l'UI
    displayVersion(version) {
        const versionBadge = document.getElementById('versionBadge');
        if (versionBadge) {
            versionBadge.textContent = `v${version}`;
            versionBadge.title = `Version du jeu : ${version}`;
        }
    }
    
    // Mettre en cache les éléments DOM
    cacheDOMElements() {
        this.domElements = {
            wordDisplay: document.getElementById('wordDisplay'),
            feedback: document.getElementById('feedback'),
            usernameInput: document.getElementById('usernameInput'),
            loginBtn: document.getElementById('loginBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            userInfo: document.getElementById('userInfo'),
            currentUser: document.getElementById('currentUser')
        };
    }
    
    // Créer l'affichage des boîtes de lettres
    createLetterBoxes(wordLength) {
        this.domElements.wordDisplay.innerHTML = '';
        
        for (let i = 0; i < wordLength; i++) {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            letterBox.textContent = '?';
            this.domElements.wordDisplay.appendChild(letterBox);
        }
        
        // Mettre le curseur sur la première boîte
        this.updateCursor(0);
    }
    
    // Mettre à jour l'affichage des lettres
    updateLetterBoxes(input, letterStates) {
        const letterBoxes = this.domElements.wordDisplay.children;
        
        for (let i = 0; i < letterBoxes.length; i++) {
            const letterBox = letterBoxes[i];
            
            // Ne jamais modifier une lettre verte (correcte)
            if (letterBox.classList.contains('letter-correct')) {
                continue;
            }
            
            if (i < input.length) {
                if (letterBox.textContent !== input[i].toUpperCase()) {
                    letterBox.textContent = input[i].toUpperCase();
                    letterBox.className = 'letter-box';
                }
                
                if (letterStates && letterStates[i]) {
                    letterBox.classList.add(`letter-${letterStates[i]}`);
                }
                
                if (i === input.length - 1) {
                    letterBox.style.animation = 'pulse 0.5s ease';
                    setTimeout(() => {
                        letterBox.style.animation = '';
                    }, 500);
                }
            } else {
                letterBox.textContent = '?';
                letterBox.className = 'letter-box';
            }
        }
        
        // Mettre à jour le curseur visuel (calculer la vraie position)
        this.updateCursorFromInput(input, letterBoxes);
    }
    
    // Mettre à jour le curseur visuel basé sur l'input
    updateCursorFromInput(input, letterBoxes) {
        // Retirer le curseur de toutes les boîtes
        for (let i = 0; i < letterBoxes.length; i++) {
            letterBoxes[i].classList.remove('letter-cursor');
        }
        
        // Trouver la première boîte non-verte (rouge, orange, ou vide)
        let targetPosition = -1;
        
        for (let i = 0; i < letterBoxes.length; i++) {
            const box = letterBoxes[i];
            const isGreen = box.classList.contains('letter-correct');
            
            // On cherche la première boîte qui est :
            // - Soit vide (?)
            // - Soit avec une lettre incorrecte (rouge/orange)
            if (!isGreen) {
                targetPosition = i;
                break;
            }
        }
        
        // Si on a trouvé une position, ajouter le curseur
        if (targetPosition !== -1 && targetPosition < letterBoxes.length) {
            letterBoxes[targetPosition].classList.add('letter-cursor');
        }
        
        // Retourner la position pour l'utiliser dans game.js
        return targetPosition;
    }
    
    // Obtenir la position actuelle du curseur
    getCursorPosition() {
        const letterBoxes = this.domElements.wordDisplay.children;
        for (let i = 0; i < letterBoxes.length; i++) {
            if (letterBoxes[i].classList.contains('letter-cursor')) {
                return i;
            }
        }
        return -1;
    }
    
    // Mettre à jour le curseur visuel (version simple pour reset)
    updateCursor(currentPosition) {
        const letterBoxes = this.domElements.wordDisplay.children;
        
        // Retirer le curseur de toutes les boîtes
        for (let i = 0; i < letterBoxes.length; i++) {
            letterBoxes[i].classList.remove('letter-cursor');
        }
        
        // Trouver la prochaine position non-verte à partir de currentPosition
        let targetPosition = currentPosition;
        while (targetPosition < letterBoxes.length && 
               letterBoxes[targetPosition].classList.contains('letter-correct')) {
            targetPosition++;
        }
        
        // Ajouter le curseur sur la prochaine position disponible
        if (targetPosition < letterBoxes.length) {
            letterBoxes[targetPosition].classList.add('letter-cursor');
        }
    }
    
    // Afficher l'effet de victoire
    showVictoryEffect() {
        const letterBoxes = Array.from(this.domElements.wordDisplay.children);
        letterBoxes.forEach((letterBox, i) => {
            // Retirer le curseur
            letterBox.classList.remove('letter-cursor');
            setTimeout(() => {
                if (letterBox && letterBox.classList) {
                    letterBox.classList.add('letter-victory');
                }
            }, i * 100);
        });
    }
    
    // Afficher un message de feedback
    showFeedback(message, type) {
        this.domElements.feedback.textContent = message;
        this.domElements.feedback.className = `feedback ${type}`;
    }
    
    // Créer l'animation de célébration
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
    
    // Méthode dépréciée - conservée pour compatibilité
    clearInput() {
        // Plus d'input à vider - géré par la variable interne dans game.js
    }
    
    // Méthode dépréciée - conservée pour compatibilité
    focusInput() {
        // Plus d'input sur lequel mettre le focus
    }
    
    // Réinitialiser l'affichage des lettres
    resetLetterBoxes() {
        const letterBoxes = this.domElements.wordDisplay.children;
        for (let i = 0; i < letterBoxes.length; i++) {
            letterBoxes[i].textContent = '?';
            letterBoxes[i].className = 'letter-box';
            letterBoxes[i].classList.remove('letter-victory');
        }
        
        // Remettre le curseur sur la première position
        this.updateCursor(0);
    }
    
    // Afficher/masquer les sections selon l'état de connexion
    updateVisibilityForLogin(isLoggedIn) {
        if (isLoggedIn) {
            this.domElements.usernameInput.style.display = 'none';
            this.domElements.loginBtn.style.display = 'none';
            this.domElements.userInfo.classList.remove('hidden');
        } else {
            this.domElements.usernameInput.style.display = 'inline-block';
            this.domElements.loginBtn.style.display = 'inline-block';
            this.domElements.userInfo.classList.add('hidden');
        }
    }
    
    // Mettre à jour le nom d'utilisateur
    setCurrentUser(username) {
        this.domElements.currentUser.textContent = username;
    }
}
