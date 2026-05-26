#!/bin/bash
# ============================================================
# DataFlow Deploy Script
# ============================================================
# Uso: ./deploy.sh [versión] [mensaje]
# Ejemplo: ./deploy.sh 0.3.0 "Agrega exportar PDF"
#
# Si no pasas versión, se incrementa el patch automáticamente
# Si no pasas mensaje, usa "Deploy vX.X.X"
# ============================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${CYAN}       DataFlow Deploy Script              ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""

# ─── Config ──────────────────────────────────────────────────
REPO_URL="https://github.com/angeltrabajo/dataflow.git"
GITHUB_API="https://api.github.com/repos/angeltrabajo/dataflow"
BRANCH_MAIN="main"
BRANCH_PAGES="gh-pages"

# ─── Get current version ─────────────────────────────────────
CURRENT_VERSION=$(grep 'APP_VERSION' src/lib/version.ts | sed "s/.*APP_VERSION = \"\(.*\)\".*/\1/")
echo -e "Versión actual: ${YELLOW}v${CURRENT_VERSION}${NC}"

# ─── Determine new version ───────────────────────────────────
if [ -n "$1" ]; then
  NEW_VERSION="$1"
else
  # Auto-increment patch
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
  NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
  echo -e "Auto-incrementando a: ${YELLOW}v${NEW_VERSION}${NC}"
fi

# Remove 'v' prefix if present
NEW_VERSION="${NEW_VERSION#v}"
COMMIT_MSG="${2:-Deploy v${NEW_VERSION}}"

echo -e "Nueva versión: ${GREEN}v${NEW_VERSION}${NC}"
echo -e "Mensaje: ${COMMIT_MSG}"
echo ""

# ─── Confirm ─────────────────────────────────────────────────
read -p "¿Continuar? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
  echo -e "${RED}Cancelado.${NC}"
  exit 1
fi

# ─── 1. Update version in code ───────────────────────────────
echo -e "\n${YELLOW}[1/7]${NC} Actualizando versión en el código..."
sed -i "s/APP_VERSION = \"${CURRENT_VERSION}\"/APP_VERSION = \"${NEW_VERSION}\"/" src/lib/version.ts
sed -i "s/\"version\": \"${CURRENT_VERSION}\"/\"version\": \"${NEW_VERSION}\"/" package.json
echo -e "  ✓ version.ts → v${NEW_VERSION}"
echo -e "  ✓ package.json → v${NEW_VERSION}"

# ─── 2. Update version.json ─────────────────────────────────
echo -e "\n${YELLOW}[2/7]${NC} Generando version.json..."
CHANGELOG="${COMMIT_MSG}"
cat > public/version.json << EOF
{
  "version": "${NEW_VERSION}",
  "name": "DataFlow",
  "changelog": "${CHANGELOG}",
  "date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "url": "https://angeltrabajo.github.io/dataflow/"
}
EOF
echo -e "  ✓ public/version.json creado"

# ─── 3. Commit to main ───────────────────────────────────────
echo -e "\n${YELLOW}[3/7]${NC} Commiteando a main..."
git add src/lib/version.ts package.json public/version.json
git commit -m "v${NEW_VERSION} - ${COMMIT_MSG}" || echo "  (sin cambios para commitear)"
git push origin ${BRANCH_MAIN}
echo -e "  ✓ Push a main"

# ─── 4. Build ────────────────────────────────────────────────
echo -e "\n${YELLOW}[4/7]${NC} Construyendo para GitHub Pages..."
GITHUB_PAGES=true bun run build
echo -e "  ✓ Build completado"

# ─── 5. Deploy to gh-pages ───────────────────────────────────
echo -e "\n${YELLOW}[5/7]${NC} Desplegando a gh-pages..."
# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Copy build output
rm -rf /tmp/dataflow-deploy
cp -r out /tmp/dataflow-deploy

# Switch to gh-pages
git checkout ${BRANCH_PAGES} 2>/dev/null || git checkout --orphan ${BRANCH_PAGES}

# Replace all files
git rm -rf . 2>/dev/null || true
rm -rf src node_modules .next prisma docs 2>/dev/null
cp -r /tmp/dataflow-deploy/* .
touch .nojekyll

# Commit and push
git add -A
git commit -m "Deploy v${NEW_VERSION}" || echo "  (sin cambios)"
git push origin ${BRANCH_PAGES} --force

# Switch back
git checkout ${CURRENT_BRANCH}
echo -e "  ✓ gh-pages actualizado"

# ─── 6. Create git tag ──────────────────────────────────────
echo -e "\n${YELLOW}[6/7]${NC} Creando tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "v${NEW_VERSION} - ${COMMIT_MSG}" 2>/dev/null || echo "  (tag ya existe)"
git push origin "v${NEW_VERSION}" 2>/dev/null || echo "  (tag ya existe en remoto)"
echo -e "  ✓ Tag v${NEW_VERSION} creado"

# ─── 7. Create GitHub Release ───────────────────────────────
echo -e "\n${YELLOW}[7/7]${NC} Creando Release en GitHub..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token ${GITHUB_TOKEN:-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}" \
  -H "Content-Type: application/json" \
  "${GITHUB_API}/releases" \
  -d "{
    \"tag_name\": \"v${NEW_VERSION}\",
    \"name\": \"DataFlow v${NEW_VERSION}\",
    \"body\": \"## v${NEW_VERSION}\n\n${COMMIT_MSG}\n\n---\n\nInstalación:\n1. Abre https://angeltrabajo.github.io/dataflow/\n2. Si tienes una versión anterior, verás un aviso de actualización\",
    \"draft\": false,
    \"prerelease\": false
  }")

RELEASE_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('html_url','Error'))" 2>/dev/null || echo "Error creando release")

if [[ "$RELEASE_URL" == *"Error"* ]] || [[ "$RELEASE_URL" == "" ]]; then
  echo -e "  ${YELLOW}⚠ No se pudo crear el Release (ya existe o error de API)${NC}"
else
  echo -e "  ${GREEN}✓ Release creado: ${RELEASE_URL}${NC}"
fi

# ─── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Deploy v${NEW_VERSION} completado!       ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "  🌐 App: https://angeltrabajo.github.io/dataflow/"
echo -e "  📦 Release: ${RELEASE_URL}"
echo -e "  📂 Código: main@v${NEW_VERSION}"
echo -e "  🚀 Deploy: gh-pages@v${NEW_VERSION}"
echo ""
echo -e "  Los usuarios con versiones anteriores verán"
echo -e "  un aviso de actualización automáticamente."
echo ""
