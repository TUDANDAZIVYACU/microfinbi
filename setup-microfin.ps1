# ==========================================================
# setup-microfin.ps1
# Scaffold du projet microfin.bi (Next.js + Prisma + Clerk + DaisyUI)
# À exécuter depuis C:\dev
# ==========================================================

$ErrorActionPreference = "Stop"

Write-Host "== Création du projet Next.js ==" -ForegroundColor Cyan
npx create-next-app@latest microfin.bi --typescript --tailwind --app --turbopack --src-dir=false --import-alias "@/*"

Set-Location microfin.bi

Write-Host "== Installation des dépendances ==" -ForegroundColor Cyan
npm install @prisma/client @clerk/nextjs decimal.js
npm install -D prisma daisyui@latest

Write-Host "== Initialisation Prisma ==" -ForegroundColor Cyan
npx prisma init

Write-Host "== Copie du schema.prisma ==" -ForegroundColor Cyan
Copy-Item -Path "..\microfin.bi-schema\schema.prisma" -Destination "prisma\schema.prisma" -Force -ErrorAction SilentlyContinue

Write-Host "== Création de la structure de dossiers ==" -ForegroundColor Cyan
$dirs = @(
    "app\(auth)\sign-in\[[...sign-in]]",
    "app\(auth)\sign-up\[[...sign-up]]",
    "app\(dashboard)\membres",
    "app\(dashboard)\credits",
    "app\(dashboard)\epargne",
    "app\(dashboard)\caisse",
    "app\(dashboard)\banque",
    "app\(dashboard)\rapports",
    "app\(dashboard)\admin",
    "app\api\membres",
    "app\api\credits",
    "app\api\epargne",
    "components\ui",
    "lib"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

Write-Host "== Fichier .env.example ==" -ForegroundColor Cyan
@"
# Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.us-east-2.aws.neon.tech/microfinbi?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/microfinbi?sslmode=require"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
"@ | Out-File -FilePath ".env.example" -Encoding utf8

Write-Host "== Configuration DaisyUI (2 thèmes seulement) ==" -ForegroundColor Cyan
Write-Host "N'oublie pas de configurer tailwind.config avec seulement retro/dark (leçon station.bi)" -ForegroundColor Yellow

Write-Host ""
Write-Host "== Terminé ==" -ForegroundColor Green
Write-Host "Prochaines étapes :"
Write-Host "1. Renseigner .env avec les vraies clés Neon + Clerk"
Write-Host "2. npx prisma generate"
Write-Host "3. Exécuter le SQL du schema dans Neon Console (ou npx prisma migrate dev si le réseau tient)"
Write-Host "4. Configurer proxy.ts pour l'auth (pas middleware.ts)"
