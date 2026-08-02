import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma, withRetry } from "./prisma";

interface SessionMetadata {
  role?: "SUPER_ADMIN" | "ADMIN_TENANT" | "AGENT_CREDIT" | "CAISSIER" | "AUDITEUR";
  tenantId?: string;
}

/**
 * À utiliser en haut de chaque page/action serveur du dashboard.
 * Redirige vers /sign-in si non connecté, lève une erreur explicite
 * si les métadonnées Clerk (tenantId) ne sont pas configurées.
 *
 * Rappel : la clé de session Clerk est `metadata` (pas `publicMetadata`)
 * en environnement Development pour ce projet.
 */
export async function requireUser() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  const metadata = (sessionClaims?.metadata ?? {}) as SessionMetadata;
  const tenantId = metadata.tenantId;

  if (!tenantId) {
    throw new Error(
      "Aucun tenantId dans les métadonnées Clerk de cet utilisateur. " +
        "Configure sessionClaims.metadata.tenantId dans le dashboard Clerk."
    );
  }

  const user = await withRetry(() =>
    prisma.user.findUnique({ where: { clerkId: userId } })
  );

  if (!user || !user.actif) redirect("/sign-in");

  return {
    clerkId: userId,
    tenantId,
    role: metadata.role ?? user.role,
    userId_db: user.id,
    user,
  };
}

/** Restreint l'accès à certains rôles. Lève une erreur sinon. */
export async function requireRole(roles: SessionMetadata["role"][]) {
  const ctx = await requireUser();
  if (!roles.includes(ctx.role)) {
    throw new Error("Accès refusé : rôle insuffisant pour cette action.");
  }
  return ctx;
}
