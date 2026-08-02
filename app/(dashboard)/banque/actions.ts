"use server";

import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";

export async function ajouterMouvementBanque(formData: FormData) {
  const { tenantId } = await requireUser();

  const libelle = String(formData.get("libelle"));
  const sens = String(formData.get("sens")) as "DEBIT" | "CREDIT";
  const montant = new Decimal(Number(formData.get("montant")));

  const dernier = await prisma.banqueMouvement.findFirst({
    where: { tenantId },
    orderBy: { ordo: "desc" },
  });

  const ordo = (dernier?.ordo ?? 0) + 1;
  const soldePrecedent = new Decimal(dernier?.solde?.toString() ?? "0");

  // Convention VB6 : solde = report + credit - debit (inverse de la caisse)
  const solde =
    sens === "CREDIT" ? soldePrecedent.add(montant) : soldePrecedent.sub(montant);

  await withRetry(() =>
    prisma.banqueMouvement.create({
      data: {
        tenantId,
        ordo,
        libelle,
        debit: sens === "DEBIT" ? montant.toNumber() : 0,
        credit: sens === "CREDIT" ? montant.toNumber() : 0,
        solde: solde.toNumber(),
      },
    })
  );

  revalidatePath("/banque");
}
