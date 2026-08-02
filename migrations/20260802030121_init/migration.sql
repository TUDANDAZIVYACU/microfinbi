-- CreateEnum
CREATE TYPE "RoleUser" AS ENUM ('SUPER_ADMIN', 'ADMIN_TENANT', 'AGENT_CREDIT', 'CAISSIER', 'AUDITEUR');

-- CreateEnum
CREATE TYPE "StatutMembre" AS ENUM ('ACTIF', 'SUSPENDU', 'RADIE');

-- CreateEnum
CREATE TYPE "TypeMouvementEpargne" AS ENUM ('DEPOT', 'RETRAIT', 'INTERET', 'FRAIS');

-- CreateEnum
CREATE TYPE "StatutCredit" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REJETE', 'DECAISSE', 'EN_COURS', 'SOLDE', 'EN_RETARD', 'CONTENTIEUX');

-- CreateEnum
CREATE TYPE "StatutEcheance" AS ENUM ('A_VENIR', 'PAYEE', 'PARTIELLE', 'EN_RETARD');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sigle" TEXT,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "planAbonnement" TEXT NOT NULL DEFAULT 'essai',
    "dateExpiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agenceId" TEXT,
    "clerkId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "RoleUser" NOT NULL DEFAULT 'AGENT_CREDIT',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membre" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agenceId" TEXT NOT NULL,
    "numeroMembre" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "pieceIdentite" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "statut" "StatutMembre" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitEpargne" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tauxRemuneration" DECIMAL(5,2) NOT NULL,
    "soldeMinimum" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProduitEpargne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteEpargne" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "numeroCompte" TEXT NOT NULL,
    "solde" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompteEpargne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementEpargne" (
    "id" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "type" "TypeMouvementEpargne" NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "soldeApres" DECIMAL(14,2) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementEpargne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProduitCredit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "tauxInteret" DECIMAL(5,2) NOT NULL,
    "dureeMinMois" INTEGER NOT NULL,
    "dureeMaxMois" INTEGER NOT NULL,
    "montantMin" DECIMAL(14,2) NOT NULL,
    "montantMax" DECIMAL(14,2) NOT NULL,
    "penaliteRetard" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProduitCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agenceId" TEXT NOT NULL,
    "membreId" TEXT NOT NULL,
    "produitId" TEXT NOT NULL,
    "agentCreditId" TEXT NOT NULL,
    "numeroCredit" TEXT NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "tauxInteret" DECIMAL(5,2) NOT NULL,
    "dureeMois" INTEGER NOT NULL,
    "dateDecaissement" TIMESTAMP(3),
    "statut" "StatutCredit" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcheanceCredit" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "numeroEcheance" INTEGER NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "montantCapital" DECIMAL(14,2) NOT NULL,
    "montantInteret" DECIMAL(14,2) NOT NULL,
    "montantTotal" DECIMAL(14,2) NOT NULL,
    "montantPaye" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "statut" "StatutEcheance" NOT NULL DEFAULT 'A_VENIR',

    CONSTRAINT "EcheanceCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remboursement" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modePaiement" TEXT,
    "reference" TEXT,

    CONSTRAINT "Remboursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaisseMouvement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agenceId" TEXT,
    "userId" TEXT NOT NULL,
    "ordo" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "solde" DECIMAL(14,2) NOT NULL,
    "dateOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaisseMouvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BanqueMouvement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agenceId" TEXT,
    "ordo" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "solde" DECIMAL(14,2) NOT NULL,
    "dateOp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BanqueMouvement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepenseTenant" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(14,2) NOT NULL,
    "categorie" TEXT,
    "dateDepense" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepenseTenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Agence_tenantId_idx" ON "Agence"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "Membre_tenantId_idx" ON "Membre"("tenantId");

-- CreateIndex
CREATE INDEX "Membre_agenceId_idx" ON "Membre"("agenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Membre_tenantId_numeroMembre_key" ON "Membre"("tenantId", "numeroMembre");

-- CreateIndex
CREATE INDEX "ProduitEpargne_tenantId_idx" ON "ProduitEpargne"("tenantId");

-- CreateIndex
CREATE INDEX "CompteEpargne_tenantId_idx" ON "CompteEpargne"("tenantId");

-- CreateIndex
CREATE INDEX "CompteEpargne_membreId_idx" ON "CompteEpargne"("membreId");

-- CreateIndex
CREATE UNIQUE INDEX "CompteEpargne_tenantId_numeroCompte_key" ON "CompteEpargne"("tenantId", "numeroCompte");

-- CreateIndex
CREATE INDEX "MouvementEpargne_compteId_idx" ON "MouvementEpargne"("compteId");

-- CreateIndex
CREATE INDEX "ProduitCredit_tenantId_idx" ON "ProduitCredit"("tenantId");

-- CreateIndex
CREATE INDEX "Credit_tenantId_idx" ON "Credit"("tenantId");

-- CreateIndex
CREATE INDEX "Credit_membreId_idx" ON "Credit"("membreId");

-- CreateIndex
CREATE INDEX "Credit_statut_idx" ON "Credit"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "Credit_tenantId_numeroCredit_key" ON "Credit"("tenantId", "numeroCredit");

-- CreateIndex
CREATE INDEX "EcheanceCredit_creditId_idx" ON "EcheanceCredit"("creditId");

-- CreateIndex
CREATE INDEX "EcheanceCredit_dateEcheance_idx" ON "EcheanceCredit"("dateEcheance");

-- CreateIndex
CREATE INDEX "Remboursement_creditId_idx" ON "Remboursement"("creditId");

-- CreateIndex
CREATE INDEX "CaisseMouvement_tenantId_idx" ON "CaisseMouvement"("tenantId");

-- CreateIndex
CREATE INDEX "CaisseMouvement_ordo_idx" ON "CaisseMouvement"("ordo");

-- CreateIndex
CREATE INDEX "BanqueMouvement_tenantId_idx" ON "BanqueMouvement"("tenantId");

-- CreateIndex
CREATE INDEX "BanqueMouvement_ordo_idx" ON "BanqueMouvement"("ordo");

-- CreateIndex
CREATE INDEX "DepenseTenant_tenantId_idx" ON "DepenseTenant"("tenantId");

-- AddForeignKey
ALTER TABLE "Agence" ADD CONSTRAINT "Agence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "Agence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membre" ADD CONSTRAINT "Membre_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membre" ADD CONSTRAINT "Membre_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "Agence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitEpargne" ADD CONSTRAINT "ProduitEpargne_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteEpargne" ADD CONSTRAINT "CompteEpargne_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteEpargne" ADD CONSTRAINT "CompteEpargne_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteEpargne" ADD CONSTRAINT "CompteEpargne_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "ProduitEpargne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementEpargne" ADD CONSTRAINT "MouvementEpargne_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "CompteEpargne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProduitCredit" ADD CONSTRAINT "ProduitCredit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "Agence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_membreId_fkey" FOREIGN KEY ("membreId") REFERENCES "Membre"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "ProduitCredit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_agentCreditId_fkey" FOREIGN KEY ("agentCreditId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcheanceCredit" ADD CONSTRAINT "EcheanceCredit_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remboursement" ADD CONSTRAINT "Remboursement_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "Credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaisseMouvement" ADD CONSTRAINT "CaisseMouvement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaisseMouvement" ADD CONSTRAINT "CaisseMouvement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BanqueMouvement" ADD CONSTRAINT "BanqueMouvement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepenseTenant" ADD CONSTRAINT "DepenseTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
