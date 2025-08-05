# Accessi-web - Site Web Refactorisé

## Vue d'ensemble

Site web professionnel pour services d'accessibilité numérique RGAA, entièrement refactorisé avec une architecture PHP moderne remplaçant l'ancien backend Python Flask.

## Architecture

### Frontend
- **HTML5** sémantique et accessible
- **CSS3** avec design responsive
- **JavaScript** vanilla pour interactions
- Navigation slide basée sur scroll

### Backend  
- **PHP 7.4+** avec architecture orientée objet
- **MySQL/MariaDB** pour stockage des données
- **PHPMailer** pour envoi d'emails (SMTP)
- Validation complète des données

## Fonctionnalités

### ✅ Système de commandes
- 3 offres : Essential (199€), Business (399€), Enterprise (1000€+)
- Formulaires de commande complets et sécurisés
- Validation côté client et serveur
- Stockage en base de données

### ✅ Notifications email
- Confirmation automatique aux clients
- Notification admin pour nouvelles commandes
- Templates HTML professionnels
- Configuration SMTP flexible

### ✅ Base de données
- Table `orders` avec tous les champs nécessaires
- Horodatage automatique
- Gestion des statuts de commande
- Script d'initialisation inclus

## Installation

### Prérequis
- Serveur web (Apache/Nginx) avec PHP 7.4+
- MySQL/MariaDB 5.7+
- Extension PHP : PDO, PDO_MySQL, mail

### Étapes d'installation

1. **Configuration de la base de données**
   ```sql
   CREATE DATABASE accessiweb_db;
   CREATE USER 'accessiweb_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
   GRANT ALL PRIVILEGES ON accessiweb_db.* TO 'accessiweb_user'@'localhost';
   ```

2. **Configuration PHP**
   - Modifiez `config.php` avec vos paramètres :
     - Credentials base de données
     - Paramètres SMTP
     - Emails de contact

3. **Initialisation**
   ```bash
   php init-db.php
   ```

4. **Test**
   - Accédez à votre site
   - Testez les formulaires de commande
   - Vérifiez les emails de confirmation

## Structure des fichiers

```
accessi-web/
├── index.html              # Page principale
├── essential.html          # Formulaire offre Essential  
├── business.html           # Formulaire offre Business
├── enterprise.html         # Formulaire offre Enterprise
├── styles.css              # Styles CSS globaux
├── script.js               # JavaScript frontend
├── config.php              # Configuration générale
├── process-order.php       # Traitement des commandes
├── init-db.php            # Script d'initialisation DB
├── includes/
│   ├── database.php       # Classe de gestion BDD
│   └── emailer.php        # Classe d'envoi emails
└── backend/               # Anciens fichiers (à supprimer)
```

## Configuration SMTP

Dans `config.php` :
```php
'smtp_host' => 'ssl0.ovh.net',    # Votre serveur SMTP
'smtp_port' => 465,               # Port SMTP (465 SSL, 587 TLS)
'smtp_user' => 'contact@accessi-web.com',
'smtp_pass' => 'votre_mot_de_passe',
```

## API Endpoints

### POST /process-order.php
Traite les commandes depuis les formulaires.

**Paramètres requis :**
- `offer_type`: 'essential' | 'business' | 'enterprise'
- `company_name`: Nom entreprise
- `contact_name`: Nom du contact  
- `email`: Email de contact
- `website_url`: URL du site web

**Paramètres optionnels :**
- `phone`: Téléphone
- `current_issues`: Problèmes actuels
- `accessibility_goals`: Objectifs accessibilité
- `timeline`: Délais souhaités
- `budget_range`: Budget (Enterprise uniquement)
- `additional_info`: Informations supplémentaires

**Réponse :**
```json
{
  "success": true,
  "message": "Commande enregistrée avec succès",
  "order_id": 123,
  "emails_sent": {
    "client": true,
    "admin": true
  }
}
```

## Sécurité

### Mesures implémentées
- ✅ Validation stricte des données d'entrée
- ✅ Protection contre injections SQL (PDO prepared statements)
- ✅ Sanitisation HTML des données affichées
- ✅ Validation email et URL côté serveur
- ✅ Protection CSRF par origine des requêtes
- ✅ Gestion d'erreurs sécurisée

### Recommandations
- Utilisez HTTPS en production
- Configurez des mots de passe forts
- Limitez les permissions MySQL
- Activez les logs d'erreurs PHP
- Sauvegardez régulièrement la base

## Maintenance

### Surveillance
- Logs d'erreurs PHP : `/var/log/php/error.log`
- Logs base de données MySQL
- Surveillance des emails (bounce, spam)

### Sauvegarde
```sql
mysqldump -u accessiweb_user -p accessiweb_db > backup.sql
```

### Mise à jour
1. Sauvegardez la base de données
2. Testez en environnement de développement
3. Déployez les modifications
4. Vérifiez le bon fonctionnement

## Support

Pour tout problème :
1. Vérifiez les logs d'erreurs
2. Testez la connexion base de données
3. Validez la configuration SMTP
4. Consultez la documentation PHP/MySQL

## Changelog

## 🔗 **URLs Propres**

Le site utilise des URLs propres sans extension `.html` :

### Routes disponibles :
- `/` → `index.html` (page d'accueil)
- `/essential` → `essential.html`
- `/business` → `business.html` 
- `/enterprise` → `enterprise.html`
- `/contact` → `contact.html`

### Configuration serveur :
- **Apache** : `.htaccess` inclus
- **IIS/Windows** : `web.config` inclus
- **Nginx** : voir documentation serveur

### Redirections automatiques :
- `accessi-web.com/essential.html` → `accessi-web.com/essential` (301 permanent)
- Toutes les URLs avec `.html` sont automatiquement redirigées

## 🎨 **Démonstration Interactive**

Nouvelle section **Avant/Après** (slide 4) avec :
- **Simulateur daltonisme** (4 types de vision)
- **3 exemples concrets** : contraste, boutons, focus
- **Statistiques d'impact** animées (+47% utilisabilité, +23% conversion)
- **Navigation clavier** accessible
- **Design responsive** mobile/desktop

## Changelog

### v2.1.0 (2025-01-03)
- ✅ URLs propres sans extension .html
- ✅ Démonstration interactive avant/après
- ✅ Simulateur daltonisme intégré
- ✅ Configuration serveur Apache/IIS
- ✅ Page contact complète avec formulaire
- ✅ Footer discret avec informations essentielles

### v2.0.0 (2025-01-03)
- ✅ Migration complète Python Flask → PHP
- ✅ Refactorisation formulaires avec validation
- ✅ Nouveau système d'emails HTML
- ✅ Architecture base de données optimisée
- ✅ Interface responsive améliorée
- ✅ Sécurité renforcée