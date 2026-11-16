-- Mettre à jour le nom du site dans la base de données
-- Exécutez ce script sur votre serveur de production

UPDATE "SiteSetting" 
SET 
  "siteName" = 'Borboleta — Robes Kabyles',
  "siteNameAr" = 'بوربوليتا — فساتين قبائلية',
  "email" = 'contact@borboleta.dz',
  "adminEmail" = 'admin@borboleta.dz'
WHERE id IS NOT NULL;

-- Vérifier le résultat
SELECT "siteName", "siteNameAr", "email", "adminEmail" FROM "SiteSetting";
