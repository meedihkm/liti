# ✅ Checklist de Déploiement - Taqendurt sur Coolify

## 📋 Avant le déploiement

### 1. Configuration du projet
- [x] Repository Git configuré : `https://github.com/meedihkm/liti`
- [x] Branche `main` à jour avec tout le code
- [x] Dockerfile optimisé pour production (multi-stage build)
- [x] docker-compose.yml configuré
- [x] Variables d'environnement documentées

### 2. Fichiers de configuration créés
- [x] `DEPLOYMENT_COOLIFY.md` - Guide complet de déploiement
- [x] `docker-compose.coolify.yml` - Version sans conflit de ports
- [x] `.env.coolify` - Template des variables d'environnement
- [x] `scripts/check-ports.sh` - Script de vérification des ports
- [x] `DEPLOYMENT_CHECKLIST.md` - Cette checklist

---

## 🔍 Vérification des ports (À faire sur votre VPS)

### Option 1 : Utiliser le script automatique
```bash
# Se connecter en SSH à votre VPS
ssh user@votre-vps-ip

# Cloner le repo temporairement pour avoir le script
git clone https://github.com/meedihkm/liti.git /tmp/taqendurt-check
cd /tmp/taqendurt-check
chmod +x scripts/check-ports.sh
./scripts/check-ports.sh

# Nettoyer après
cd ~
rm -rf /tmp/taqendurt-check
```

### Option 2 : Vérification manuelle
```bash
# Lister tous les conteneurs Docker et leurs ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Vérifier les ports spécifiques
sudo netstat -tulpn | grep ':3000'
sudo netstat -tulpn | grep ':80'
sudo netstat -tulpn | grep ':443'
```

### Résultats attendus
- [ ] Port 3000 : LIBRE ou utiliser 3001-3010
- [ ] Port 80 : Utilisé par Traefik (normal)
- [ ] Port 443 : Utilisé par Traefik (normal)
- [ ] Aucun conflit avec d'autres applications Next.js

---

## 🚀 Déploiement dans Coolify

### Étape 1 : Créer le projet
1. [ ] Connexion à Coolify
2. [ ] Cliquer sur "+ New Resource"
3. [ ] Sélectionner "Docker Compose"

### Étape 2 : Configuration Git
1. [ ] Type : Public Repository
2. [ ] URL : `https://github.com/meedihkm/liti`
3. [ ] Branche : `main`
4. [ ] Build Pack : Docker Compose

### Étape 3 : Fichier Docker Compose
**Choisir selon votre situation :**

- [ ] **Option A (Standard)** : `docker-compose.yml`
  - Utiliser si vous n'avez pas de conflit de ports
  - Port mappé : 3000:3000

- [ ] **Option B (Coolify optimisé)** : `docker-compose.coolify.yml`
  - Utiliser si vous avez d'autres apps sur le port 3000
  - Coolify gère tout via Traefik (recommandé)

### Étape 4 : Configuration du domaine
1. [ ] Ajouter votre domaine : `________________.dz`
2. [ ] Activer HTTPS (Let's Encrypt)
3. [ ] Activer le redirect HTTP → HTTPS

### Étape 5 : Variables d'environnement
**Copier depuis `.env.coolify` et adapter :**

```bash
# OBLIGATOIRES
DATABASE_URL=file:/app/data/taqendurt.db
NEXT_PUBLIC_SITE_URL=https://votre-domaine.dz
ADMIN_EMAIL=admin@votre-domaine.dz
SEED_DEMO=true

# OPTIONNELLES (SMTP)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=votre-email@gmail.com
# SMTP_PASS=votre-app-password
# SMTP_FROM=Taqendurt <notifications@votre-domaine.dz>
```

1. [ ] Variables obligatoires configurées
2. [ ] Variables SMTP configurées (si nécessaire)
3. [ ] `NEXT_PUBLIC_SITE_URL` correspond au domaine configuré

### Étape 6 : Configuration des volumes
**Volumes automatiquement créés par docker-compose :**
1. [ ] `uploads` → `/app/public/uploads`
2. [ ] `appdata` → `/app/data`

**Vérifier dans Coolify :**
- [ ] Persistent Volumes activés
- [ ] Backup configuré (optionnel mais recommandé)

### Étape 7 : Configuration réseau
1. [ ] Port interne détecté : `3000`
2. [ ] Health check configuré : `/api/meta`
3. [ ] Traefik labels configurés (automatique)

### Étape 8 : Déployer
1. [ ] Cliquer sur "Deploy"
2. [ ] Attendre le build (5-10 minutes)
3. [ ] Suivre les logs en temps réel

---

## ✅ Vérification post-déploiement

### Tests de base
1. [ ] Site accessible : `https://votre-domaine.dz`
2. [ ] Page d'accueil charge correctement
3. [ ] Images statiques s'affichent
4. [ ] Pas d'erreurs dans la console navigateur

### Tests API
1. [ ] Health check : `https://votre-domaine.dz/api/meta`
2. [ ] API produits : `https://votre-domaine.dz/api/products`
3. [ ] Pas d'erreur 500

### Tests Admin
1. [ ] Accès admin : `https://votre-domaine.dz/#/admin`
2. [ ] Connexion avec credentials par défaut :
   - Email : `admin@taqendurt.dz`
   - Password : `motdepasse`
3. [ ] Dashboard affiche les statistiques
4. [ ] **IMPORTANT** : Changer le mot de passe immédiatement !

### Tests fonctionnels
1. [ ] Catalogue produits affiche les 8 produits de démo
2. [ ] Détail produit fonctionne
3. [ ] Configurateur (couleurs, tissus, broderies) fonctionne
4. [ ] Ajout au panier fonctionne
5. [ ] Formulaire de contact fonctionne

### Vérification des volumes
```bash
# SSH sur votre VPS
docker volume ls | grep taqendurt

# Vérifier la base de données
docker exec <container-name> ls -lh /app/data

# Vérifier les uploads
docker exec <container-name> ls -lh /app/public/uploads
```

1. [ ] Volume `uploads` créé
2. [ ] Volume `appdata` créé
3. [ ] Base SQLite présente : `/app/data/taqendurt.db`

---

## 🔐 Sécurité post-déploiement

### Actions immédiates
1. [ ] **CHANGER LE MOT DE PASSE ADMIN**
   - Se connecter à `/admin`
   - Aller dans Paramètres
   - Changer le mot de passe
   
2. [ ] Créer un compte admin avec votre vrai email
   - Aller dans l'admin
   - Créer un nouvel admin
   - Supprimer l'admin par défaut (optionnel)

3. [ ] Désactiver le seed de démo (production)
   - Dans Coolify, modifier `SEED_DEMO=false`
   - Redéployer

4. [ ] Configurer SMTP (si pas fait)
   - Ajouter les variables SMTP dans Coolify
   - Tester l'envoi d'email (passer une commande test)

### Sauvegardes
1. [ ] Configurer les backups automatiques dans Coolify
2. [ ] Tester la restauration d'un backup
3. [ ] Documenter la procédure de backup manuel

### Monitoring
1. [ ] Activer les alertes Coolify
2. [ ] Configurer les notifications (Discord/Slack/Email)
3. [ ] Vérifier les métriques (CPU, RAM, Disk)

---

## 🐛 Résolution des problèmes

### Problème : Container ne démarre pas
**Solutions :**
1. Vérifier les logs Coolify
2. Vérifier les variables d'environnement
3. Vérifier la syntaxe du docker-compose.yml
4. Vérifier l'espace disque disponible

### Problème : Port 3000 déjà utilisé
**Solutions :**
1. Utiliser `docker-compose.coolify.yml` (expose au lieu de ports)
2. Ou modifier le port dans `docker-compose.yml` : `3001:3000`
3. Redéployer

### Problème : Site inaccessible
**Solutions :**
1. Vérifier la configuration du domaine dans Coolify
2. Vérifier les DNS (A record vers IP du VPS)
3. Vérifier Traefik : `docker logs traefik`
4. Vérifier les logs du conteneur

### Problème : Base de données vide après redéploiement
**Solutions :**
1. Vérifier que les volumes sont persistants
2. Ne pas supprimer les volumes lors du redéploiement
3. Restaurer depuis un backup

---

## 📊 Métriques à surveiller

### Performance
- [ ] Temps de réponse API < 500ms
- [ ] Temps de chargement page < 3s
- [ ] CPU usage < 50%
- [ ] RAM usage < 512MB

### Disponibilité
- [ ] Uptime > 99%
- [ ] Health check passe
- [ ] Aucune erreur 5xx

### Stockage
- [ ] Espace disque volume uploads surveillé
- [ ] Taille base SQLite surveillée
- [ ] Backups fonctionnent

---

## 📞 Contacts et ressources

- **Documentation Coolify :** https://coolify.io/docs
- **Documentation Next.js :** https://nextjs.org/docs
- **Documentation Prisma :** https://www.prisma.io/docs
- **GitHub du projet :** https://github.com/meedihkm/liti

---

## ✅ Déploiement réussi !

**Félicitations !** Votre site Taqendurt est maintenant en ligne.

**URLs importantes :**
- 🌐 Site public : `https://votre-domaine.dz`
- 🔧 Admin : `https://votre-domaine.dz/#/admin`
- 📊 API : `https://votre-domaine.dz/api`
- ❤️ Health : `https://votre-domaine.dz/api/meta`

**Prochaines étapes :**
1. Personnaliser le contenu (produits, images, textes)
2. Configurer les options de broderie et tissus
3. Tester le processus de commande complet
4. Former les utilisateurs admin
5. Promouvoir le site !

---

**Date de déploiement :** _________________
**Déployé par :** _________________
**Domaine :** _________________
**Version :** 0.2.1
