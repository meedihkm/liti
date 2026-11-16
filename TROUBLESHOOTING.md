# 🔧 Guide de Dépannage Borboleta

## 🚨 Problème : Login Admin Page Blanche

### Symptômes
- Connexion réussie (pas d'erreur)
- Page blanche immédiatement après
- Message "This page couldn't load"

### Causes possibles
1. **Cache du navigateur** - Le navigateur garde l'ancien code
2. **Cookies corrompus** - Session invalide
3. **Erreur JavaScript** - Incompatibilité de types (langue kab)

### Solutions

#### 1. Vider complètement le cache du navigateur
```bash
# Sur Chrome/Edge/Brave
Ctrl + Shift + Delete
→ Sélectionner "Tout le temps"
→ Cocher "Images et fichiers en cache"
→ Cocher "Cookies et données du site"
→ Effacer les données

# Puis forcer le rechargement
Ctrl + Shift + R
```

#### 2. Tester en navigation privée
```
Ctrl + Shift + N (Chrome/Edge)
Ctrl + Shift + P (Firefox)
```
Si ça fonctionne en navigation privée → c'est un problème de cache

#### 3. Vérifier la console du navigateur
```
F12 → Onglet Console
```
Chercher les erreurs rouges, notamment :
- `Cannot read properties of undefined`
- `Type 'kab' is not assignable to type`
- `Failed to fetch`

#### 4. Diagnostic serveur
```bash
# SSH sur votre serveur Coolify
cd /path/to/app

# Vérifier les comptes admin
bun run admin:debug

# Si besoin, mettre à jour le branding
bun run admin:rebrand
```

#### 5. Redéploiement forcé
1. Dans Coolify, cliquer sur votre projet
2. Cliquer "Redeploy"
3. Attendre 5-10 minutes
4. Vider le cache navigateur
5. Tester à nouveau

---

## 🦋 Problème : Ancien nom "Taqendurt" encore visible

### Symptômes
- Le header affiche "Taqendurt" au lieu de "Borboleta"
- Les emails mentionnent encore Taqendurt

### Cause
Les **settings dans la base de données** n'ont pas été mis à jour

### Solution

#### Sur le serveur de production :
```bash
cd /app  # ou le chemin de votre app

# Exécuter le script de rebranding
bun run admin:rebrand
```

Ce script met à jour :
- ✅ Nom du site : "Borboleta — Robes Kabyles"
- ✅ Email admin : admin@borboleta.dz
- ✅ Email staff : staff@borboleta.dz
- ✅ Email contact : contact@borboleta.dz

#### Nouveaux identifiants admin après rebranding :
```
Email : admin@borboleta.dz
Mot de passe : Admin!2026
```

⚠️ **Note** : Si vous préférez garder `admin@taqendurt.dz`, modifiez le script avant de l'exécuter.

---

## 🎨 Problème : Couleurs pas mises à jour

### Symptômes
- Les boutons sont encore magenta foncé
- Le rose clair n'apparaît pas

### Solution
```bash
# 1. Vider le cache du navigateur
Ctrl + Shift + Delete

# 2. Forcer le rechargement
Ctrl + Shift + R

# 3. Vérifier que le build a bien pris en compte globals.css
# Sur le serveur :
docker logs <container-id> | grep globals.css
```

---

## 🔐 Identifiants par défaut

### Après seed initial (base vierge)
```
Admin : admin@taqendurt.dz / Admin!2026
Staff : staff@taqendurt.dz / Staff!2026
```

### Après rebranding (script admin:rebrand)
```
Admin : admin@borboleta.dz / Admin!2026
Staff : staff@borboleta.dz / Staff!2026
```

---

## 📊 Scripts de diagnostic

### Vérifier les comptes admin
```bash
bun run admin:debug
```
Affiche :
- Tous les comptes admin/staff
- Test de validation du mot de passe
- Settings du site
- Sessions actives

### Mettre à jour le branding
```bash
bun run admin:rebrand
```
Met à jour :
- Nom du site dans Settings
- Emails admin/staff
- Emails de contact

---

## 🆘 Support

Si le problème persiste après toutes ces étapes :

1. **Examiner les logs Coolify**
   - Onglet "Logs" dans Coolify
   - Chercher les erreurs au démarrage

2. **Vérifier les variables d'environnement**
   ```bash
   DATABASE_URL=file:/app/data/taqendurt.db  # OK
   NEXT_PUBLIC_SITE_URL=https://myrobe-giize.com  # OK
   ```

3. **Recréer la base de données** (ATTENTION : perte de données)
   ```bash
   rm /app/data/taqendurt.db
   bun prisma db push
   bun run db:seed
   ```

4. **Contacter le support** avec :
   - Capture d'écran de l'erreur
   - Logs de la console navigateur (F12)
   - Logs Coolify
   - Résultat de `bun run admin:debug`
