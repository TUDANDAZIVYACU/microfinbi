"use server";

import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { genererNumero } from "@/lib/numerotation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";

export async function ouvrirCompteEpargne(formData: FormData) {
  const { tenantId } = await requireUser();

  const membreId = String(formData.get("membreId"));
  const produitId = String(formData.get("produitId"));

  const numeroCompte = await genererNumero({ tenantId, prefixe: "EP", model: "compteEpargne" });

  const compte = await withRetry(() =>
    prisma.compteEpargne.create({
      data: { tenantId, membreId, produitId, numeroCompte, solde: 0 },
    })
  );

  revalidatePath(`/membres/${membreId}`);
  redirect(`/epargne/${compte.id}`);
}

export async function effectuerMouvementEpargne(formData: FormData) {
  const { tenantId } = await requireUser();

  const compteId = String(formData.get("compteId"));
  const type = String(formData.get("type")) as "DEPOT" | "RETRAIT";
  const montant = new Decimal(Number(formData.get("montant")));

  const compte = await prisma.compteEpargne.findFirstOrThrow({
    where: { id: compteId, tenantId },
  });

  const soldeActuel = new Decimal(compte.solde.toString());

  if (type === "RETRAIT" && montant.gt(soldeActuel)) {
    throw new Error("Solde insuffisant pour ce retrait.");
  }

  const nouveauSolde = type === "DEPOT" ? soldeActuel.add(montant) : soldeActuel.sub(montant);

  await prisma.$transaction([
    prisma.compteEpargne.update({
      where: { id: compteId },
      data: { solde: nouveauSolde.toNumber() },
    }),
    prisma.mouvementEpargne.create({
      data: {
        compteId,
        type,
        montant: montant.toNumber(),
        soldeApres: nouveauSolde.toNumber(),
      },
    }),
  ]);

  revalidatePath(`/epargne/${compteId}`);
}
