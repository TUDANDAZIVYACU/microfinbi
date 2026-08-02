"use server";

import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import Decimal from "decimal.js";

export async function ajouterMouvementCaisse(formData: FormData) {
  const { tenantId, userId_db } = await requireUser();

  const libelle = String(formData.get("libelle"));
  const sens = String(formData.get("sens")) as "DEBIT" | "CREDIT";
  const montant = new Decimal(Number(formData.get("montant")));

  const dernier = await prisma.caisseMouvement.findFirst({
    where: { tenantId },
    orderBy: { ordo: "desc" },
  });

  const ordo = (dernier?.ordo ?? 0) + 1;
  const soldePrecedent = new Decimal(dernier?.solde?.toString() ?? "0");

  // Convention VB6 : solde = report + debit - credit
  const solde =
    sens === "DEBIT" ? soldePrecedent.add(montant) : soldePrecedent.sub(montant);

  await withRetry(() =>
    prisma.caisseMouvement.create({
      data: {
        tenantId,
        userId: userId_db,
        ordo,
        libelle,
        debit: sens === "DEBIT" ? montant.toNumber() : 0,
        credit: sens === "CREDIT" ? montant.toNumber() : 0,
        solde: solde.toNumber(),
      },
    })
  );

  revalidatePath("/caisse");
}
