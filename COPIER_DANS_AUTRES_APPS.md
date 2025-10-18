# 📋 COPIER-COLLER DANS VOS AUTRES APPLICATIONS

## 🎯 Fichier à copier

**1 seul fichier à copier :** `js/sessionManager.js`

---

## 📝 Étapes simples

### 1️⃣ Copier le fichier

```
Copiez : js/sessionManager.js
Dans : votre_autre_app/js/sessionManager.js
```

### 2️⃣ Ajouter dans le HTML

Dans `index.html`, ajoutez **AVANT vos autres scripts** :

```html
<script src="js/sessionManager.js"></script>
```

### 3️⃣ Utiliser dans votre code

```javascript
// Créer l'instance
const sessionManager = new SessionManager();

// Vérifier si connecté (auto au chargement)
if (sessionManager.isLoggedIn()) {
  const username = sessionManager.getCurrentUser();
  console.log("Utilisateur :", username);
}

// Connexion
sessionManager.login("MonNom");

// Déconnexion
sessionManager.logout();
```

---

## ✅ C'est tout !

### Résultat :

- ✅ **Refresh** → Utilisateur reste connecté
- ❌ **Fermeture d'onglet** → Utilisateur déconnecté
- 🔄 **Changement d'app** → Même utilisateur connecté partout

---

## ⚙️ Configuration (optionnelle)

Pour changer le préfixe partagé, modifiez dans `sessionManager.js` :

```javascript
this.SHARED_PREFIX = "shared_apps_"; // ← Changez ici
```

**⚠️ Utilisez le MÊME préfixe dans TOUTES vos applications !**

---

## 📖 Documentation complète

Voir : `js/SESSION_MANAGER_README.md`
