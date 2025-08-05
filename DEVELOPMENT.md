# 🛠️ Guide de Développement Local

## 🚀 **Démarrage rapide**

### **Option 1 : Mode Démo (Recommandé pour tester)**
1. Ouvrir directement `index.html` dans le navigateur
2. **Mode démo automatique** activé :
   - ✅ Navigation entre pages fonctionnelle
   - ✅ Formulaires simulés (pas d'emails envoyés)
   - ✅ Messages de confirmation fictifs
   - ✅ Tous les liens fonctionnent

### **Option 2 : Serveur PHP (Pour test complet)**
```bash
# Dans le dossier accessi-web
php -S localhost:8000

# Puis ouvrir : http://localhost:8000
```
**Avantages :**
- ✅ Traitement PHP réel
- ✅ Emails envoyés (si SMTP configuré)
- ✅ Base de données fonctionnelle
- ✅ URLs propres actives

### **Option 3 : XAMPP/WAMP/MAMP**
1. Installer XAMPP/WAMP/MAMP
2. Copier le dossier dans `htdocs/`
3. Accéder via : `http://localhost/accessi-web/`

## 🔍 **Comment détecter le mode actif**

Le système détecte automatiquement l'environnement :

### **Mode Démo Local** 📱
- **URLs** comme `C:\Users\...\index.html` ou `file://`
- **Console** affiche : "🚀 Mode démo local activé"
- **Formulaires** affichent : "✅ DÉMO LOCAL: Formulaire soumis..."

### **Mode Production** 🌐  
- **URLs** comme `https://accessi-web.com`
- **Traitement PHP** réel
- **Emails** envoyés aux vrais destinataires

## 🐛 **Résolution d'erreurs**

### **"Failed to fetch" ou "Network Error"**
- ✅ **Solution** : Le mode démo est maintenant actif automatiquement
- ✅ **Ou** : Utiliser `php -S localhost:8000`

### **"404 Page not found"**
- ✅ **Solution** : Le gestionnaire d'URLs convertit automatiquement
- `/essential` → `essential.html` en local

### **Formulaires ne fonctionnent pas**
- ✅ **En démo** : Messages de confirmation simulés
- ✅ **Avec PHP** : Vérifier la configuration SMTP

## 📝 **Configuration développement**

### **Base de données**
```bash
# Initialiser la base (avec serveur PHP)
php init-db.php
```

### **SMTP pour emails**
Modifier `config.php` :
```php
'smtp_host' => 'votre-serveur-smtp',
'smtp_user' => 'votre-email',
'smtp_pass' => 'votre-mot-de-passe',
```

## 🎯 **Tests recommandés**

### **Mode Démo** ✅
- Navigation entre toutes les pages
- Formulaires de commande (Essential, Business, Enterprise)
- Formulaire de contact
- Démonstration interactive (slide 4)

### **Mode PHP** ✅ 
- Même tests + vérification emails
- Test base de données
- Vérification logs d'erreurs

## 🔧 **Structure de développement**

```
accessi-web/
├── index.html              # Page principale
├── essential.html          # Formulaire Essential
├── business.html           # Formulaire Business  
├── enterprise.html         # Formulaire Enterprise
├── contact.html            # Page contact
├── js/
│   └── url-handler.js      # 🆕 Gestionnaire local/prod
├── includes/
│   ├── database.php        # Classe DB
│   └── emailer.php         # Classe Email
├── process-order.php       # API commandes
├── process-contact.php     # API contact
├── .htaccess              # Config Apache
└── web.config             # Config IIS
```

## 📊 **Logs de débogage**

Ouvrir la **Console Développeur** (F12) pour voir :
- `🚀 Mode démo local activé` = Simulation active
- `Erreur de connexion` = Problème PHP/réseau
- `✅ DÉMO LOCAL` = Formulaire simulé avec succès