# 🔐 SESSION MANAGER - Guide d'utilisation

## 📦 Fichier à copier dans toutes vos applications

**Fichier concerné :** `js/sessionManager.js`

---

## 🎯 Qu'est-ce que c'est ?

Le **SessionManager** est un module autonome qui gère :

- ✅ La **connexion persistante** au refresh de la page
- ❌ La **déconnexion automatique** à la fermeture de l'onglet
- 🔄 Le **partage de session** entre toutes vos applications

---

## 🚀 Comment l'utiliser dans une nouvelle application ?

### Étape 1 : Copier le fichier

Copiez **`js/sessionManager.js`** dans votre nouvelle application (dans le dossier `js/`).

---

### Étape 2 : Ajouter dans le HTML

Dans votre fichier `index.html`, ajoutez le script **AVANT** vos autres scripts :

```html
<!-- Session Manager (à copier dans toutes vos apps) -->
<script src="js/sessionManager.js"></script>

<!-- Vos autres scripts -->
<script src="js/votreScript.js"></script>
```

---

### Étape 3 : Utiliser dans votre code JavaScript

#### 3.1 Créer une instance

```javascript
const sessionManager = new SessionManager();
```

#### 3.2 Vérifier si l'utilisateur est connecté (auto-restauré au chargement)

```javascript
if (sessionManager.isLoggedIn()) {
  console.log("Utilisateur connecté:", sessionManager.getCurrentUser());
  // Charger ses données...
}
```

#### 3.3 Connexion d'un utilisateur

```javascript
const username = "MonNom";
if (sessionManager.login(username)) {
  console.log("Connexion réussie !");
}
```

#### 3.4 Déconnexion

```javascript
sessionManager.logout();
console.log("Déconnexion réussie !");
```

#### 3.5 Obtenir l'utilisateur actuel

```javascript
const currentUser = sessionManager.getCurrentUser();
```

---

## 🎮 Comportements

| Action                       | Résultat                                                          |
| ---------------------------- | ----------------------------------------------------------------- |
| **Refresh de la page (F5)**  | ✅ Utilisateur **RESTE connecté**                                 |
| **Fermeture de l'onglet**    | ❌ Utilisateur **déconnecté**                                     |
| **Changement d'application** | 🔄 Utilisateur **RESTE connecté** (même nom dans toutes les apps) |

---

## ⚙️ Configuration (optionnelle)

### Changer le préfixe partagé

Si vous voulez un autre nom pour le stockage partagé, modifiez dans `sessionManager.js` :

```javascript
this.SHARED_PREFIX = "shared_apps_"; // ← Changez ici
```

Par exemple :

- `'mes_jeux_'` → pour des jeux
- `'tony_apps_'` → pour vos applications personnelles
- `'portfolio_'` → pour un portfolio

**⚠️ IMPORTANT :** Utilisez le **même préfixe** dans toutes vos applications qui doivent partager la session !

---

## 🔍 Debug

Pour voir l'état actuel de la session :

```javascript
console.log(sessionManager.getDebugInfo());
```

Affichera :

```javascript
{
    currentUser: "MonNom",
    sessionActive: "true",
    sharedUser: "MonNom",
    sharedPrefix: "shared_apps_"
}
```

---

## 📝 Exemple complet d'intégration

```javascript
// Créer l'instance
const sessionManager = new SessionManager();

// Au chargement de la page, vérifier si une session existe
if (sessionManager.isLoggedIn()) {
  const username = sessionManager.getCurrentUser();
  console.log(`Session restaurée : ${username}`);
  // Afficher l'interface utilisateur connecté
  showUserInterface(username);
} else {
  // Afficher l'écran de connexion
  showLoginScreen();
}

// Lors de la connexion
function handleLogin() {
  const username = document.getElementById("usernameInput").value;

  if (sessionManager.login(username)) {
    console.log("Connexion réussie !");
    showUserInterface(username);
  } else {
    console.log("Erreur de connexion");
  }
}

// Lors de la déconnexion
function handleLogout() {
  sessionManager.logout();
  showLoginScreen();
}
```

---

## ✨ Avantages

1. **Autonome** : Aucune dépendance externe
2. **Réutilisable** : Copiez-collez dans toutes vos applications
3. **Simple** : API claire et facile à utiliser
4. **Partagé** : Même utilisateur dans toutes vos applications
5. **Sécurisé** : Déconnexion automatique à la fermeture

---

## 🛠️ Technologies utilisées

- **sessionStorage** : Pour la session active (disparaît à la fermeture)
- **localStorage** : Pour partager le nom entre applications

---

## 📞 Support

Si vous avez des questions ou des problèmes, vérifiez :

1. Que le fichier `sessionManager.js` est bien chargé **AVANT** vos autres scripts
2. Que le préfixe est le **même** dans toutes vos applications
3. Utilisez `sessionManager.getDebugInfo()` pour voir l'état

---

**Bonne utilisation ! 🚀**
