"use server";

import { requireRole } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function creerProduitCredit(formData: FormData) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.produitCredit.create({
      data: {
        tenantId,
        nom: String(formData.get("nom")),
        tauxInteret: Number(formData.get("tauxInteret")),
        dureeMinMois: Number(formData.get("dureeMinMois")),
        dureeMaxMois: Number(formData.get("dureeMaxMois")),
        montantMin: Number(formData.get("montantMin")),
        montantMax: Number(formData.get("montantMax")),
        penaliteRetard: Number(formData.get("penaliteRetard") || 0),
      },
    })
  );

  revalidatePath("/admin");
}

export async function creerProduitEpargne(formData: FormData) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.produitEpargne.create({
      data: {
        tenantId,
        nom: String(formData.get("nom")),
        tauxRemuneration: Number(formData.get("tauxRemuneration")),
        soldeMinimum: Number(formData.get("soldeMinimum") || 0),
      },
    })
  );

  revalidatePath("/admin");
}

export async function creerAgence(formData: FormData) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.agence.create({
      data: {
        tenantId,
        nom: String(formData.get("nom")),
        ville: String(formData.get("ville") || ""),
      },
    })
  );

  revalidatePath("/admin");
}

/**
 * Crée un utilisateur local lié à un compte Clerk déjà créé (par clerkId).
 * Le rôle et le tenantId doivent aussi être configurés dans les métadonnées
 * Clerk (sessionClaims.metadata) pour que requireUser() fonctionne.
 */
export async function creerUtilisateur(formData: FormData) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.user.create({
      data: {
        tenantId,
        clerkId: String(formData.get("clerkId")),
        nom: String(formData.get("nom")),
        email: String(formData.get("email")),
        role: String(formData.get("role")) as never,
        agenceId: String(formData.get("agenceId")) || null,
      },
    })
  );

  revalidatePath("/admin");
}

export async function desactiverUtilisateur(userId: string) {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  await withRetry(() =>
    prisma.user.update({
      where: { id: userId, tenantId },
      data: { actif: false },
    })
  );

  revalidatePath("/admin");
}
