"use server";

import { requireUser, requireRole } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { genererNumero } from "@/lib/numerotation";
import { genererEcheancierCredit, enregistrerRemboursement } from "@/lib/echeancier";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function creerDemandeCredit(formData: FormData) {
  const { tenantId, userId_db } = await requireUser();

  const membreId = String(formData.get("membreId"));
  const produitId = String(formData.get("produitId"));
  const montant = Number(formData.get("montant"));
  const dureeMois = Number(formData.get("dureeMois"));

  const [produit, membre] = await Promise.all([
    prisma.produitCredit.findFirstOrThrow({ where: { id: produitId, tenantId } }),
    prisma.membre.findFirstOrThrow({ where: { id: membreId, tenantId } }),
  ]);
  const agenceId = membre.agenceId;

  if (montant < Number(produit.montantMin) || montant > Number(produit.montantMax)) {
    throw new Error(
      `Montant hors des limites du produit (${produit.montantMin} - ${produit.montantMax} FBU).`
    );
  }
  if (dureeMois < produit.dureeMinMois || dureeMois > produit.dureeMaxMois) {
    throw new Error(
      `Durée hors des limites du produit (${produit.dureeMinMois} - ${produit.dureeMaxMois} mois).`
    );
  }

  const numeroCredit = await genererNumero({ tenantId, prefixe: "CR", model: "credit" });

  const credit = await withRetry(() =>
    prisma.credit.create({
      data: {
        tenantId,
        agenceId,
        membreId,
        produitId,
        agentCreditId: userId_db,
        numeroCredit,
        montant,
        tauxInteret: produit.tauxInteret,
        dureeMois,
        statut: "EN_ATTENTE",
      },
    })
  );

  revalidatePath("/credits");
  redirect(`/credits/${credit.id}`);
}

export async function approuverCredit(creditId: string) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.credit.update({
      where: { id: creditId, tenantId },
      data: { statut: "APPROUVE" },
    })
  );

  revalidatePath(`/credits/${creditId}`);
}

export async function rejeterCredit(creditId: string) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.credit.update({
      where: { id: creditId, tenantId },
      data: { statut: "REJETE" },
    })
  );

  revalidatePath(`/credits/${creditId}`);
}

export async function decaisserCredit(creditId: string) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN", "CAISSIER"]);

  await withRetry(() =>
    prisma.credit.update({
      where: { id: creditId, tenantId },
      data: { statut: "DECAISSE", dateDecaissement: new Date() },
    })
  );

  // Génère l'échéancier et passe le crédit à EN_COURS
  await genererEcheancierCredit(prisma, creditId);

  revalidatePath(`/credits/${creditId}`);
}

export async function enregistrerRemboursementAction(formData: FormData) {
  const { tenantId } = await requireUser();

  const creditId = String(formData.get("creditId"));
  const montant = Number(formData.get("montant"));
  const modePaiement = String(formData.get("modePaiement") || "ESPECES");
  const reference = String(formData.get("reference") || "");

  const credit = await prisma.credit.findFirstOrThrow({ where: { id: creditId, tenantId } });

  await enregistrerRemboursement(prisma, {
    creditId: credit.id,
    montant,
    modePaiement,
    reference,
  });

  revalidatePath(`/credits/${creditId}`);
}
