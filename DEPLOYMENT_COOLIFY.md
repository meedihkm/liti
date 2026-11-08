# 🚀 Guide de Déploiement Coolify - Taqendurt

## ✅ Configuration actuelle

### Port de l'application
- **Port interne du conteneur :** `3000`
- **Port exposé par défaut :** `3000:3000`

⚠️ **IMPORTANT :** Coolify gère automatiquement les ports via son reverse proxy (Traefik). Vous n'avez PAS besoin d'exposer le port 3000 publiquement.

---

## 📋 Configuration Coolify recommandée

### 1. Type de déploiement
✅ **Docker Compose**

### 2. Repository Git
- **URL :** `https://github.com/meedihkm/liti`
- **Branche :** `main`

### 3. Configuration des ports dans Coolify

#### ⚠️ Éviter les conflits de ports

**Option A : Laisser Coolify gérer (RECOMMANDÉ)**
- Ne PAS mapper de port externe fixe
- Coolify utilisera son reverse proxy sur le port 80/443
- Le conteneur reste sur le port interne 3000
- **Dans Coolify :** Supprimer la ligne `ports:` du docker-compose ou laisser Coolify la gérer

**Option B : Mapper un port unique (si plusieurs apps Next.js)**
Si vous avez déjà des projets Next.js sur votre VPS, changez le port externe :
```yaml
ports:
  - "3001:3000"  # ou 3002, 3003, etc.
```

### 4. Variables d'environnement à configurer dans Coolify

**Variables OBLIGATOIRES :**

```bash
# URL publique de votre site (REMPLACER par votre domaine)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.dz

# Email admin pour les notifications
ADMIN_EMAIL=admin@votre-domaine.dz

# Base de données (SQLite par défaut - pas de config requise)
DATABASE_URL=file:/app/data/taqendurt.db

# Seed de démonstration (mettre false pour production vide)
SEED_DEMO=true
```

**Variables OPTIONNELLES (SMTP pour emails) :**

```bash
# Configuration SMTP (sans ça, les emails sont journalisés en BDD)
SMTP_HOST=smtp.votre-fournisseur.dz
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@votre-domaine.dz
SMTP_PASS=votre-mot-de-passe-smtp
SMTP_FROM=Taqendurt <notifications@votre-domaine.dz>
```

---

## 🔧 Étapes de déploiement dans Coolify

### Étape 1 : Créer un nouveau projet
1. Connectez-vous à Coolify
2. Cliquez sur **"+ New Resource"**
3. Choisissez **"Docker Compose"**

### Étape 2 : Configurer le repository
1. **Source :** GitHub
2. **Repository URL :** `https://github.com/meedihkm/liti`
3. **Branch :** `main`
4. **Docker Compose File :** `docker-compose.yml`

### Étape 3 : Configuration réseau
1. **Domain :** `votre-domaine.dz` (ou sous-domaine)
2. **Port Mapping :** 
   - Coolify détectera automatiquement le port 3000
   - Le reverse proxy Traefik routera automatiquement le trafic

### Étape 4 : Variables d'environnement
Dans l'onglet **"Environment Variables"** de Coolify, ajoutez :

```
NEXT_PUBLIC_SITE_URL=https://votre-domaine.dz
ADMIN_EMAIL=admin@votre-domaine.dz
DATABASE_URL=file:/app/data/taqendurt.db
SEED_DEMO=true
```

### Étape 5 : Volumes persistants
Coolify créera automatiquement les volumes définis dans docker-compose.yml :
- ✅ `uploads` → `/app/public/uploads` (images uploadées)
- ✅ `appdata` → `/app/data` (base de données SQLite)

### Étape 6 : Déployer
1. Cliquez sur **"Deploy"**
2. Attendez la fin du build (peut prendre 5-10 minutes)
3. Vérifiez les logs pour confirmer le démarrage

---

## 🔍 Vérification des conflits de ports

### Comment vérifier les ports utilisés sur votre VPS

```bash
# Se connecter en SSH à votre VPS
ssh user@votre-vps

# Lister tous les conteneurs et leurs ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Vérifier si le port 3000 est utilisé
sudo netstat -tulpn | grep :3000
# ou
sudo lsof -i :3000
```

### Ports à vérifier/éviter
- **3000** : Port standard Next.js
- **3001-3010** : Souvent utilisés pour d'autres apps Next.js
- **5432** : PostgreSQL (si vous avez d'autres BDD)
- **80/443** : Traefik (reverse proxy Coolify)

---

## 📊 Architecture réseau recommandée

```
Internet (HTTPS)
    ↓
Traefik (Coolify) :80/:443
    ↓
Taqendurt Container :3000 (interne)
    ↓
SQLite Volume (/app/data)
```

**Avantages :**
- ✅ Un seul point d'entrée (Traefik)
- ✅ SSL automatique (Let's Encrypt)
- ✅ Pas de conflit de ports
- ✅ Facile à gérer plusieurs apps

---

## 🐛 Résolution des problèmes courants

### Erreur : "Port 3000 already in use"
**Solution :** Modifier le port externe dans docker-compose.yml
```yaml
ports:
  - "3001:3000"  # Changez 3001 par un port libre
```

### L'app ne démarre pas
**Vérifier les logs Coolify :**
```bash
# Dans Coolify, onglet "Logs"
# ou en SSH :
docker logs <nom-du-conteneur>
```

### Base de données vide après redéploiement
**Cause :** Les volumes n'ont pas été préservés
**Solution :** Vérifier que les volumes sont bien configurés dans Coolify

---

## 🎯 Checklist avant déploiement

- [ ] Repository GitHub accessible et à jour
- [ ] Variables d'environnement configurées dans Coolify
- [ ] Domaine/sous-domaine configuré dans Coolify
- [ ] Ports vérifiés (pas de conflit avec d'autres apps)
- [ ] Volumes persistants activés
- [ ] SSL/TLS configuré (Let's Encrypt via Coolify)

---

## 🔐 Sécurité post-déploiement

1. **Changer le mot de passe admin par défaut**
   - Se connecter : `/admin` (user: `admin@taqendurt.dz`, pass: `motdepasse`)
   - Aller dans Paramètres → Changer le mot de passe

2. **Désactiver le seed de démo en production**
   - Mettre `SEED_DEMO=false` dans les variables Coolify

3. **Configurer SMTP pour les notifications**
   - Ajouter les variables SMTP (voir ci-dessus)

4. **Sauvegardes régulières**
   - Sauvegarder le volume `/app/data` (base SQLite)
   - Sauvegarder le volume `/app/public/uploads` (images)

---

## 📞 Accès au site après déploiement

- **Frontend :** `https://votre-domaine.dz`
- **Admin :** `https://votre-domaine.dz/#/admin`
- **API :** `https://votre-domaine.dz/api`
- **Health Check :** `https://votre-domaine.dz/api/meta`

---

## 🚀 Déploiements futurs (CI/CD)

Coolify redéploie automatiquement à chaque push sur `main` si configuré.

Pour déclencher manuellement :
1. Aller dans Coolify
2. Cliquer sur votre projet Taqendurt
3. Cliquer sur **"Redeploy"**

---

**✅ Votre application est maintenant prête pour le déploiement Coolify !**
