import { prisma } from "./prisma";

/**
 * Génère un numéro séquentiel du type PREFIX-ANNEE-0001, propre à un tenant.
 * Compte les enregistrements existants de l'année en cours pour ce tenant.
 */
export async function genererNumero(params: {
  tenantId: string;
  prefixe: string;
  model: "membre" | "credit" | "compteEpargne";
}): Promise<string> {
  const { tenantId, prefixe, model } = params;
  const annee = new Date().getFullYear();

  let count = 0;
  if (model === "membre") {
    count = await prisma.membre.count({
      where: { tenantId, numeroMembre: { startsWith: `${prefixe}-${annee}-` } },
    });
  } else if (model === "credit") {
    count = await prisma.credit.count({
      where: { tenantId, numeroCredit: { startsWith: `${prefixe}-${annee}-` } },
    });
  } else if (model === "compteEpargne") {
    count = await prisma.compteEpargne.count({
      where: { tenantId, numeroCompte: { startsWith: `${prefixe}-${annee}-` } },
    });
  }

  const suivant = String(count + 1).padStart(4, "0");
  return `${prefixe}-${annee}-${suivant}`;
}
