"use server";

import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { genererNumero } from "@/lib/numerotation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function creerMembre(formData: FormData) {
  const { tenantId } = await requireUser();

  const agenceId = String(formData.get("agenceId"));
  const nom = String(formData.get("nom"));
  const prenom = String(formData.get("prenom"));
  const telephone = String(formData.get("telephone") || "");
  const adresse = String(formData.get("adresse") || "");

  if (!agenceId || !nom || !prenom) {
    throw new Error("Agence, nom et prénom sont obligatoires.");
  }

  const numeroMembre = await genererNumero({ tenantId, prefixe: "MB", model: "membre" });

  const membre = await withRetry(() =>
    prisma.membre.create({
      data: { tenantId, agenceId, nom, prenom, telephone, adresse, numeroMembre },
    })
  );

  revalidatePath("/membres");
  redirect(`/membres/${membre.id}`);
}

export async function changerStatutMembre(membreId: string, statut: "ACTIF" | "SUSPENDU" | "RADIE") {
  const { tenantId } = await requireUser();

  await withRetry(() =>
    prisma.membre.update({
      where: { id: membreId, tenantId },
      data: { statut },
    })
  );

  revalidatePath(`/membres/${membreId}`);
}
