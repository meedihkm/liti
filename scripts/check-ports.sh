#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Script de vérification des ports sur VPS
# Usage: ./scripts/check-ports.sh
# ─────────────────────────────────────────────────────────────

echo "=========================================="
echo "🔍 Vérification des ports utilisés"
echo "=========================================="
echo ""

# Vérifier si docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

echo "📦 Conteneurs Docker actifs et leurs ports :"
echo "------------------------------------------"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}" 2>/dev/null || echo "Aucun conteneur actif"
echo ""

echo "🔌 Ports TCP en écoute (common web ports) :"
echo "------------------------------------------"
for port in 80 443 3000 3001 3002 3003 3004 3005 5432 5433 6379 8080 8081; do
    if command -v netstat &> /dev/null; then
        result=$(netstat -tuln 2>/dev/null | grep ":$port " | head -n 1)
    elif command -v ss &> /dev/null; then
        result=$(ss -tuln 2>/dev/null | grep ":$port " | head -n 1)
    else
        echo "⚠️  netstat et ss non disponibles, installation requise"
        break
    fi
    
    if [ -n "$result" ]; then
        echo "✅ Port $port - EN UTILISATION"
    else
        echo "⭕ Port $port - LIBRE"
    fi
done
echo ""

echo "🌐 Ports recommandés pour Taqendurt :"
echo "------------------------------------------"
echo "Option 1 (RECOMMANDÉ) : Laisser Coolify gérer via Traefik"
echo "  → Pas de port externe mappé"
echo "  → Traefik route le trafic HTTPS vers le conteneur:3000"
echo ""
echo "Option 2 : Mapper un port spécifique si nécessaire"
# Chercher le premier port libre entre 3000 et 3010
for port in {3000..3010}; do
    if command -v netstat &> /dev/null; then
        if ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo "  → Port $port est LIBRE - peut être utilisé"
            break
        fi
    elif command -v ss &> /dev/null; then
        if ! ss -tuln 2>/dev/null | grep -q ":$port "; then
            echo "  → Port $port est LIBRE - peut être utilisé"
            break
        fi
    fi
done
echo ""

echo "📋 Conteneurs Coolify détectés :"
echo "------------------------------------------"
coolify_containers=$(docker ps --filter "label=coolify.managed=true" --format "{{.Names}}" 2>/dev/null)
if [ -n "$coolify_containers" ]; then
    echo "$coolify_containers"
else
    echo "Aucun conteneur Coolify détecté"
fi
echo ""

echo "✅ Vérification terminée !"
echo "=========================================="
