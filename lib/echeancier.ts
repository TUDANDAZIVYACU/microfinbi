// ==========================================================
// lib/echeancier.ts
// microfin.bi — Génération de l'échéancier de crédit
// Méthode : DÉGRESSIF (intérêt sur capital restant dû)
//   - Capital remboursé constant chaque mois : montant / dureeMois
//   - Intérêt = solde restant dû (avant l'échéance) x taux mensuel
//   - Mensualité totale décroissante au fil du temps
// ==========================================================

import { PrismaClient, Decimal as PrismaDecimal } from "@prisma/client";
import Decimal from "decimal.js";

export interface LigneEcheancier {
  numeroEcheance: number;
  dateEcheance: Date;
  montantCapital: Decimal;
  montantInteret: Decimal;
  montantTotal: Decimal;
  soldeRestantApres: Decimal;
}

/**
 * Calcule l'échéancier dégressif d'un crédit, sans toucher à la base.
 * Fonction pure, testable indépendamment de Prisma.
 *
 * @param montant        Montant du crédit décaissé
 * @param tauxAnnuelPct   Taux d'intérêt ANNUEL en pourcentage (ex: 24 pour 24%/an)
 * @param dureeMois       Durée du crédit en mois
 * @param dateDecaissement Date de décaissement (point de départ des échéances)
 */
export function calculerEcheancierDegressif(
  montant: number | string,
  tauxAnnuelPct: number | string,
  dureeMois: number,
  dateDecaissement: Date
): LigneEcheancier[] {
  if (dureeMois <= 0) {
    throw new Error("dureeMois doit être supérieur à 0");
  }

  const montantD = new Decimal(montant);
  const tauxMensuel = new Decimal(tauxAnnuelPct).div(100).div(12);
  const capitalConstant = montantD.div(dureeMois);

  const lignes: LigneEcheancier[] = [];
  let soldeRestant = montantD;

  for (let i = 1; i <= dureeMois; i++) {
    // Dernière échéance : on solde exactement le capital restant
    // (évite les écarts d'arrondi cumulés)
    const capitalEcheance =
      i === dureeMois ? soldeRestant : capitalConstant;

    const interetEcheance = soldeRestant.mul(tauxMensuel);
    const totalEcheance = capitalEcheance.add(interetEcheance);

    soldeRestant = soldeRestant.sub(capitalEcheance);

    const dateEcheance = new Date(dateDecaissement);
    dateEcheance.setMonth(dateEcheance.getMonth() + i);

    lignes.push({
      numeroEcheance: i,
      dateEcheance,
      montantCapital: capitalEcheance.toDecimalPlaces(2),
      montantInteret: interetEcheance.toDecimalPlaces(2),
      montantTotal: totalEcheance.toDecimalPlaces(2),
      soldeRestantApres: soldeRestant.toDecimalPlaces(2),
    });
  }

  return lignes;
}

/**
 * Génère et persiste l'échéancier d'un crédit en base (EcheanceCredit),
 * puis passe le crédit au statut EN_COURS.
 * À appeler au moment du décaissement (dateDecaissement doit être renseignée).
 *
 * IMPORTANT : toujours vérifier credit.tenantId dans la requête appelante
 * avant d'invoquer cette fonction (isolation multi-tenant).
 */
export async function genererEcheancierCredit(
  prisma: PrismaClient,
  creditId: string
) {
  const credit = await prisma.credit.findUniqueOrThrow({
    where: { id: creditId },
    include: { produit: true },
  });

  if (!credit.dateDecaissement) {
    throw new Error(
      "Le crédit doit avoir une dateDecaissement avant de générer l'échéancier"
    );
  }

  // Supprime un éventuel échéancier existant (régénération)
  await prisma.echeanceCredit.deleteMany({ where: { creditId } });

  const lignes = calculerEcheancierDegressif(
    credit.montant.toString(),
    credit.tauxInteret.toString(),
    credit.dureeMois,
    credit.dateDecaissement
  );

  await prisma.$transaction([
    ...lignes.map((ligne) =>
      prisma.echeanceCredit.create({
        data: {
          creditId: credit.id,
          numeroEcheance: ligne.numeroEcheance,
          dateEcheance: ligne.dateEcheance,
          montantCapital: ligne.montantCapital.toNumber(),
          montantInteret: ligne.montantInteret.toNumber(),
          montantTotal: ligne.montantTotal.toNumber(),
          montantPaye: 0,
          statut: "A_VENIR",
        },
      })
    ),
    prisma.credit.update({
      where: { id: credit.id },
      data: { statut: "EN_COURS" },
    }),
  ]);

  return lignes;
}

/**
 * Met à jour le statut d'une échéance après un remboursement partiel/total,
 * et recalcule le statut EN_RETARD si la date est dépassée sans paiement complet.
 * À appeler après chaque création de Remboursement.
 */
export async function reevaluerStatutEcheances(
  prisma: PrismaClient,
  creditId: string
) {
  const echeances = await prisma.echeanceCredit.findMany({
    where: { creditId },
    orderBy: { numeroEcheance: "asc" },
  });

  const aujourdHui = new Date();

  for (const e of echeances) {
    const du = new Decimal(e.montantTotal.toString());
    const paye = new Decimal(e.montantPaye.toString());

    let statut: "A_VENIR" | "PAYEE" | "PARTIELLE" | "EN_RETARD" = "A_VENIR";

    if (paye.gte(du)) {
      statut = "PAYEE";
    } else if (paye.gt(0)) {
      statut = e.dateEcheance < aujourdHui ? "EN_RETARD" : "PARTIELLE";
    } else if (e.dateEcheance < aujourdHui) {
      statut = "EN_RETARD";
    }

    if (statut !== e.statut) {
      await prisma.echeanceCredit.update({
        where: { id: e.id },
        data: { statut },
      });
    }
  }

  // Statut global du crédit : SOLDE si toutes payées, EN_RETARD si au moins une en retard
  const toutesPayees = echeances.every(
    (e) => new Decimal(e.montantPaye.toString()).gte(new Decimal(e.montantTotal.toString()))
  );
  const auMoinsUneEnRetard = echeances.some((e) => {
    const du = new Decimal(e.montantTotal.toString());
    const paye = new Decimal(e.montantPaye.toString());
    return paye.lt(du) && e.dateEcheance < aujourdHui;
  });

  await prisma.credit.update({
    where: { id: creditId },
    data: {
      statut: toutesPayees ? "SOLDE" : auMoinsUneEnRetard ? "EN_RETARD" : "EN_COURS",
    },
  });
}

/**
 * Applique un remboursement : crée l'enregistrement Remboursement,
 * affecte le montant aux échéances impayées les plus anciennes d'abord
 * (FIFO), puis réévalue les statuts.
 */
export async function enregistrerRemboursement(
  prisma: PrismaClient,
  params: {
    creditId: string;
    montant: number | string;
    modePaiement?: string;
    reference?: string;
  }
) {
  const { creditId, montant, modePaiement, reference } = params;

  let montantRestant = new Decimal(montant);

  await prisma.remboursement.create({
    data: {
      creditId,
      montant: montantRestant.toNumber(),
      modePaiement,
      reference,
    },
  });

  const echeancesImpayees = await prisma.echeanceCredit.findMany({
    where: {
      creditId,
      statut: { in: ["A_VENIR", "PARTIELLE", "EN_RETARD"] },
    },
    orderBy: { numeroEcheance: "asc" },
  });

  for (const e of echeancesImpayees) {
    if (montantRestant.lte(0)) break;

    const du = new Decimal(e.montantTotal.toString()).sub(
      new Decimal(e.montantPaye.toString())
    );
    const affectation = Decimal.min(du, montantRestant);

    await prisma.echeanceCredit.update({
      where: { id: e.id },
      data: {
        montantPaye: new Decimal(e.montantPaye.toString())
          .add(affectation)
          .toNumber(),
      },
    });

    montantRestant = montantRestant.sub(affectation);
  }

  await reevaluerStatutEcheances(prisma, creditId);

  return {
    montantAffecte: new Decimal(montant).sub(montantRestant).toNumber(),
    excedentNonAffecte: montantRestant.toNumber(), // > 0 si le client paie plus que ce qui est dû
  };
}
