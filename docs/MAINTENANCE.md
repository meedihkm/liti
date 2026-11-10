# Guide de Maintenance

## Tâches Quotidiennes

### Monitoring
- ✅ Vérifier les nouvelles commandes
- ✅ Répondre aux devis en attente
- ✅ Mettre à jour les avancements de commandes avec photos
- ✅ Modérer les avis clients

### Backups
- Base de données : backup automatique quotidien (voir `scripts/backup.sh`)
- Images : sauvegarde hebdomadaire des uploads

## Tâches Hebdomadaires

### Contenu
- Mettre à jour la galerie avec nouvelles créations
- Publier article de blog (si applicable)
- Vérifier et réapprovisionner les produits populaires

### Performance
- Vérifier les Core Web Vitals
- Analyser les erreurs dans les logs
- Optimiser les nouvelles images uploadées

## Tâches Mensuelles

### SEO
- Vérifier le positionnement des mots-clés
- Mettre à jour le contenu obsolète
- Vérifier les liens cassés

### Sécurité
- Mettre à jour les dépendances : `npm audit`
- Vérifier les logs d'accès suspects
- Tester les backups de restauration

### Analytics
- Analyser le trafic et les conversions
- Identifier les pages à améliorer
- Ajuster les codes promo selon les performances

## Scripts Utiles

### Backup base de données
```bash
./scripts/backup.sh
```

### Optimiser les images
```bash
./scripts/optimization/optimize-images.sh
```

### Vérifier la santé du système
```bash
./scripts/check-ports.sh
docker-compose ps
```

### Nettoyer les anciennes données
```bash
# Supprimer les devis rejetés de plus de 6 mois
# Supprimer les sessions expirées
# À implémenter selon besoins
```

## Monitoring en Production

### Métriques à surveiller
- **Temps de réponse API** : < 500ms
- **Taux d'erreur** : < 1%
- **Uptime** : > 99.9%
- **Core Web Vitals** :
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### Alertes à configurer
- Base de données pleine (> 80%)
- CPU élevé (> 80% pendant 5min)
- Erreurs 5xx (> 10 en 5min)
- Service Worker échoue

## Dépannage

### Le site ne se charge pas
1. Vérifier que Docker est lancé
2. Vérifier les logs : `docker-compose logs -f`
3. Redémarrer les services : `docker-compose restart`

### Les images ne s'affichent pas
1. Vérifier le dossier `/public/uploads`
2. Vérifier les permissions
3. Vérifier la configuration Next.js images

### Erreur de base de données
1. Vérifier la connexion : `docker-compose exec db sqlite3 /data/dev.db`
2. Vérifier les migrations : `npx prisma migrate status`
3. Recréer si nécessaire : `npx prisma migrate reset`

### Problèmes de performance
1. Analyser avec Lighthouse
2. Vérifier les requêtes lentes dans les logs
3. Optimiser les images non optimisées
4. Vérifier le cache

## Contacts Urgence

- **Hébergement** : support@coolify.io
- **Domain** : support DynosDNS
- **Dev** : [votre email]

## Changelog

Garder un journal des modifications importantes :
- Date
- Type (feature, fix, hotfix, security)
- Description
- Commit hash
