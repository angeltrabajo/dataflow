# DataFlow — Guía de Despliegue y Sistema OTA

> **Documento de referencia para cualquier asistente de IA o desarrollador.**
> Leer este documento es suficiente para entender el sistema y desplegar actualizaciones.

---

## 1. Qué es DataFlow

DataFlow es una aplicación web de gestión de datos personal (tipo Airtable) construida con Next.js 16. Se despliega como sitio estático en GitHub Pages.

- **URL en producción:** https://angeltrabajo.github.io/dataflow/
- **Repositorio:** https://github.com/angeltrabajo/dataflow
- **GitHub Pages sirve desde:** rama `gh-pages`

---

## 2. Arquitectura del Despliegue

```
rama "main"     → Código fuente (TypeScript, React, etc.)
rama "gh-pages" → Archivos estáticos construidos (HTML, CSS, JS)
GitHub Pages    → Sirve el contenido de "gh-pages"
```

**IMPORTANTE:** Estas dos ramas contienen cosas completamente distintas:
- `main` tiene `package.json`, `src/`, `node_modules/`, etc.
- `gh-pages` tiene `index.html`, `_next/`, `version.json`, `.nojekyll`

Nunca mezclar contenido entre ramas.

---

## 3. Sistema OTA (Over-The-Air)

### 3.1 Cómo funciona

La app detecta automáticamente si hay una nueva versión disponible comparando su versión local con un archivo remoto.

```
App local:  APP_VERSION = "0.2.0"  (en src/lib/version.ts)
     ↓
Fetch:  https://angeltrabajo.github.io/dataflow/version.json
     ↓
Compara versiones con semver
     ↓
Si remote > local → Muestra aviso de actualización
```

### 3.2 Archivos clave del sistema OTA

| Archivo | Ubicación | Función |
|---------|-----------|---------|
| `src/lib/version.ts` | Rama `main` | Define `APP_VERSION` — versión actual del código |
| `public/version.json` | Rama `main` (se copia al build) | Archivo público con versión, changelog y fecha |
| `src/hooks/use-version-check.ts` | Rama `main` | Hook React que compara versiones local vs remota |
| `src/components/views/settings-view.tsx` | Rama `main` | UI de Actualizaciones en Configuración |
| `src/components/app-layout.tsx` | Rama `main` | Banner verde de "Nueva versión disponible" |
| `version.json` (en raíz del build) | Rama `gh-pages` | El archivo que se sirve públicamente |
| `deploy.sh` | Rama `main` | Script de despliegue automatizado |

### 3.3 Contenido de cada archivo

#### `src/lib/version.ts`
```typescript
export const APP_VERSION = "0.2.0"        // ← CAMBIAR en cada release
export const APP_NAME = "DataFlow"
export const GITHUB_OWNER = "angeltrabajo"
export const GITHUB_REPO = "dataflow"
export const DEPLOY_BASE_URL = "https://angeltrabajo.github.io/dataflow"
export const VERSION_CHECK_INTERVAL = 5 * 60 * 1000  // 5 minutos
```

#### `public/version.json`
```json
{
  "version": "0.2.0",
  "name": "DataFlow",
  "changelog": "Descripción de los cambios en esta versión",
  "date": "2026-05-26T03:00:00Z",
  "url": "https://angeltrabajo.github.io/dataflow/"
}
```

#### `src/hooks/use-version-check.ts`
- Hook de React que se ejecuta automáticamente al cargar la app
- Hace fetch a `version.json` con cache-busting (`?t=timestamp`)
- Compara versiones usando semver (major.minor.patch)
- Guarda estado en localStorage bajo clave `dataflow-ota`
- Re-check cada 5 minutos
- Retorna: `updateAvailable`, `latestVersion`, `checkForUpdates()`, `applyUpdate()`, `dismissUpdate()`, `dismissed`

### 3.4 Flujo de detección

1. App carga → lee `APP_VERSION` local
2. Después de 3 segundos → fetch a `/version.json` con cache-busting
3. Compara `version.json.version` vs `APP_VERSION`
4. Si remote > local → `updateAvailable = true`
5. Se muestra banner verde arriba + sección en Configuración
6. Usuario toca "Actualizar" → se limpian cachés y se recarga la página

---

## 4. Cómo Desplegar una Actualización

### 4.1 Usando el script deploy.sh (recomendado)

```bash
# Desde la raíz del proyecto, en rama main:
./deploy.sh [versión] [mensaje]

# Ejemplos:
./deploy.sh 0.3.0 "Agrega exportar PDF"
./deploy.sh 0.2.1 "Corrige bug en fórmulas"
./deploy.sh              # Auto-incrementa patch (0.2.0 → 0.2.1)
```

El script hace automáticamente:
1. Actualiza `APP_VERSION` en `src/lib/version.ts`
2. Actualiza `"version"` en `package.json`
3. Genera `public/version.json` con la nueva versión y changelog
4. Commitea y pushea a `main`
5. Ejecuta `GITHUB_PAGES=true bun run build`
6. Despliega el build a la rama `gh-pages`
7. Crea un git tag (ej: `v0.3.0`)
8. Crea un GitHub Release

**Nota:** El script pide confirmación antes de proceder.

### 4.2 Despliegue manual (paso a paso)

Si el script no funciona o prefieres control manual:

#### Paso 1: Actualizar versión en el código
```bash
# Editar src/lib/version.ts → cambiar APP_VERSION
# Ejemplo: "0.2.0" → "0.3.0"
```

#### Paso 2: Actualizar version.json
```bash
# Editar public/version.json → cambiar "version" y "changelog"
```

#### Paso 3: Commit y push a main
```bash
git add src/lib/version.ts public/version.json
git commit -m "v0.3.0 - Descripción del cambio"
git push origin main
```

#### Paso 4: Construir
```bash
GITHUB_PAGES=true bun run build
```

#### Paso 5: Desplegar a gh-pages
```bash
# Guardar build temporalmente
cp -r out /tmp/dataflow-build

# Cambiar a gh-pages
git checkout gh-pages

# Limpiar y copiar nuevo build
git rm -rf .
rm -rf src node_modules .next prisma docs 2>/dev/null
cp -r /tmp/dataflow-build/* .
touch .nojekyll

# Commit y push
git add -A
git commit -m "Deploy v0.3.0"
git push origin gh-pages --force

# Volver a main
git checkout main
```

#### Paso 6: Crear tag y release
```bash
# Tag
git tag -a v0.3.0 -m "v0.3.0 - Descripción"
git push origin v0.3.0

# Release (via API)
curl -X POST \
  -H "Authorization: token TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/angeltrabajo/dataflow/releases" \
  -d '{
    "tag_name": "v0.3.0",
    "name": "DataFlow v0.3.0",
    "body": "Descripción de cambios",
    "draft": false,
    "prerelease": false
  }'
```

---

## 5. Cómo Hacer Rollback (Volver a una versión anterior)

### Método 1: Desde la app (para el usuario)
1. Abrir DataFlow → Configuración → Actualizaciones
2. Ver la versión actual
3. El botón de GitHub Releases lleva al historial

### Método 2: Desde GitHub (sin terminal)
1. Ir a https://github.com/angeltrabajo/dataflow/releases
2. Encontrar la versión que funcionaba
3. Anotar el tag (ej: `v0.2.0`)
4. Pedir al asistente de IA que restaure esa versión

### Método 3: Desde terminal (para el asistente de IA)
```bash
# 1. Encontrar el commit del tag deseado
git checkout main
git log --oneline  # encontrar el commit del tag

# 2. Restaurar main al commit de ese tag
git checkout v0.2.0  # o el tag que se quiera
# Ese commit tiene el código fuente de esa versión

# 3. Construir y desplegar esa versión
GITHUB_PAGES=true bun run build
cp -r out /tmp/dataflow-rollback
git checkout gh-pages
git rm -rf .
rm -rf src node_modules .next prisma docs 2>/dev/null
cp -r /tmp/dataflow-rollback/* .
touch .nojekyll
git add -A
git commit -m "Rollback to v0.2.0"
git push origin gh-pages --force
git checkout main
```

### Método 4: Redesplegar un release específico
```bash
# Hacer checkout del tag en main
git checkout v0.2.0

# Esto deja el directorio con el código fuente de esa versión
# Luego seguir pasos 4-5 del despliegue manual

# Al terminar, volver al HEAD de main
git checkout main
```

---

## 6. Versionado (SemVer)

Formato: `MAJOR.MINOR.PATCH`

| Cambio | Ejemplo | Cuándo |
|--------|---------|--------|
| PATCH | 0.2.0 → 0.2.1 | Bug fixes, correcciones menores |
| MINOR | 0.2.0 → 0.3.0 | Nuevas funcionalidades, mejoras |
| MAJOR | 0.2.0 → 1.0.0 | Cambios breaking, reescritura |

**Regla:** Siempre actualizar `APP_VERSION` en `src/lib/version.ts` y `"version"` en `public/version.json` y `"version"` en `package.json`.

---

## 7. Configuración de GitHub Pages

- **Fuente:** Rama `gh-pages`, directorio `/` (raíz)
- **Tipo:** Legacy (no GitHub Actions)
- **URL:** https://angeltrabajo.github.io/dataflow/
- **Archivo `.nojekyll`:** Debe existir en la raíz de `gh-pages` para evitar que Jekyll procese los archivos

### Verificar/actualizar configuración via API:
```bash
# Ver configuración actual
curl -H "Authorization: token TOKEN" \
  https://api.github.com/repos/angeltrabajo/dataflow/pages

# Cambiar rama fuente
curl -X PUT \
  -H "Authorization: token TOKEN" \
  -H "Content-Type: application/json" \
  https://api.github.com/repos/angeltrabajo/dataflow/pages \
  -d '{"source":{"branch":"gh-pages","path":"/"}}'
```

---

## 8. Credenciales y Acceso

| Recurso | Valor |
|---------|-------|
| GitHub Username | `angeltrabajo` |
| GitHub Token | *(Solicitar al propietario del repo — se usa en deploy.sh y API calls)* |
| Repo | `angeltrabajo/dataflow` |

**Limitación del token:** NO tiene permiso `workflow`, por lo que no se puede pushear archivos en `.github/workflows/` directamente. Por eso usamos rama `gh-pages` manual en vez de GitHub Actions.

---

## 9. Estructura del Proyecto (rama main)

```
dataflow/
├── deploy.sh                    # Script de despliegue
├── next.config.ts               # Next.js config (output: "export")
├── package.json                 # Dependencias (version: "0.2.0")
├── public/
│   ├── version.json             # Versionado OTA (se copia al build)
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── app-layout.tsx       # Layout principal (banner OTA aquí)
│   │   ├── views/
│   │   │   ├── settings-view.tsx # Sección Actualizaciones aquí
│   │   │   ├── dashboard-view.tsx
│   │   │   ├── table-view.tsx
│   │   │   ├── editor-view.tsx
│   │   │   └── project-detail-view.tsx
│   │   └── ui/                  # Componentes shadcn/ui
│   ├── hooks/
│   │   └── use-version-check.ts # Hook OTA
│   ├── lib/
│   │   ├── version.ts           # APP_VERSION centralizada
│   │   ├── store.ts             # Zustand store
│   │   └── utils.ts
│   └── features/                # Vertical slice architecture
└── prisma/
    └── schema.prisma
```

---

## 10. Estructura del Deploy (rama gh-pages)

```
gh-pages/
├── .nojekyll              # Evita procesamiento Jekyll
├── index.html             # Página principal
├── version.json           # Para detección OTA
├── 404.html               # Página 404
├── _next/                 # Assets estáticos (JS, CSS, fonts)
│   └── static/
├── _not-found/
├── logo.svg
└── robots.txt
```

---

## 11. Checklist de Verificación Post-Deploy

Después de cada despliegue, verificar:

```bash
# 1. version.json es accesible
curl https://angeltrabajo.github.io/dataflow/version.json
# Debe devolver JSON con la versión correcta

# 2. La app carga
curl -s -o /dev/null -w "%{http_code}" https://angeltrabajo.github.io/dataflow/
# Debe devolver 200

# 3. El tag existe
git tag -l "v*"
# Debe mostrar la versión recién creada

# 4. El Release existe
curl -s -H "Authorization: token TOKEN" \
  https://api.github.com/repos/angeltrabajo/dataflow/releases/tags/v0.3.0
# Debe devolver el release

# 5. GitHub Pages está activo
curl -s -H "Authorization: token TOKEN" \
  https://api.github.com/repos/angeltrabajo/dataflow/pages | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['status'])"
# Debe devolver "built"
```

---

## 12. Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| La app muestra el README | GitHub Pages sirve desde `main` en vez de `gh-pages` | Cambiar fuente via API (sección 7) |
| version.json devuelve versión vieja | Caché de GitHub Pages/CDN | Esperar 1-2 minutos o forzar rebuild via API |
| El build falla | Error de TypeScript | Usar `ignoreBuildErrors: true` en next.config.ts (ya configurado) |
| Token no puede pushear workflow | Sin permiso `workflow` | Usar rama `gh-pages` manual (ya implementado) |
| La app no detecta actualizaciones | version.json no cambió o caché del navegador | El hook usa cache-busting (`?t=timestamp`) |
| gh-pages tiene código fuente en vez de build | Se pusheó main a gh-pages por error | Rehacer paso 5 del despliegue manual |

---

## 13. Comandos Rápidos de Referencia

```bash
# Desarrollo local
bun install                    # Instalar dependencias
bun run dev                    # Servidor en puerto 3000
bun run lint                   # Verificar código

# Build
GITHUB_PAGES=true bun run build   # Construir para producción

# Git básico
git checkout main              # Ir a código fuente
git checkout gh-pages          # Ir a archivos de deploy
git tag -l "v*"               # Listar todas las versiones

# Despliegue completo
./deploy.sh 0.3.0 "Cambios"   # Una sola línea hace todo

# Verificar producción
curl https://angeltrabajo.github.io/dataflow/version.json
```

---

## 14. Notas para Asistentes de IA

1. **Siempre trabajar en rama `main`** para modificar código
2. **La rama `gh-pages` es solo para el build** — nunca editar archivos ahí directamente
3. **Después de cada cambio de código, hay que build + deploy** para que se refleje en producción
4. **El token no tiene permiso workflow** — no intentar crear `.github/workflows/`
5. **Nunca mezclar contenido entre ramas** — main = source, gh-pages = static
6. **El archivo `version.json` debe estar en ambos lados:** en `public/version.json` (main) y en la raíz (gh-pages)
7. **El deploy.sh necesita permisos de ejecución** — si falla, usar `bash deploy.sh`
8. **Siempre verificar con curl después de deploy** que version.json refleja la nueva versión
9. **Para rollback, siempre usar git tags** — cada deploy tiene su tag
10. **La app hace auto-check cada 5 minutos** — no es necesario que el usuario haga nada

---

*Última actualización: v0.2.0 — 2026-05-26*
