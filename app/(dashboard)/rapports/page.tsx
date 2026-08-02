import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import Decimal from "decimal.js";

export default async function RapportsPage() {
  const { tenantId } = await requireUser();

  const [credits, comptesEpargne, remboursements30j] = await withRetry(() =>
    Promise.all([
      prisma.credit.findMany({
        where: { tenantId, statut: { in: ["EN_COURS", "EN_RETARD", "SOLDE"] } },
        select: { montant: true, statut: true },
      }),
      prisma.compteEpargne.aggregate({
        where: { tenantId },
        _sum: { solde: true },
        _count: true,
      }),
      prisma.remboursement.aggregate({
        where: {
          credit: { tenantId },
          datePaiement: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { montant: true },
      }),
    ])
  );

  const encoursActif = credits
    .filter((c) => c.statut !== "SOLDE")
    .reduce((acc, c) => acc.add(new Decimal(c.montant.toString())), new Decimal(0));

  const encoursEnRetard = credits
    .filter((c) => c.statut === "EN_RETARD")
    .reduce((acc, c) => acc.add(new Decimal(c.montant.toString())), new Decimal(0));

  const par = encoursActif.gt(0)
    ? encoursEnRetard.div(encoursActif).mul(100).toDecimalPlaces(2)
    : new Decimal(0);

  const nbCreditsActifs = credits.filter((c) => c.statut !== "SOLDE").length;
  const nbCreditsEnRetard = credits.filter((c) => c.statut === "EN_RETARD").length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rapports</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Portefeuille de crédit</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Encours actif" value={`${encoursActif.toNumber().toLocaleString("fr-FR")} FBU`} />
          <Stat label="Crédits actifs" value={String(nbCreditsActifs)} />
          <Stat
            label="PAR (portefeuille à risque)"
            value={`${par}%`}
            alert={par.gt(5)}
          />
          <Stat label="Crédits en retard" value={String(nbCreditsEnRetard)} alert={nbCreditsEnRetard > 0} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Épargne</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="Encours d'épargne"
            value={`${(comptesEpargne._sum.solde ?? 0).toString()} FBU`}
          />
          <Stat label="Comptes actifs" value={String(comptesEpargne._count)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Activité récente (30 jours)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="Remboursements encaissés"
            value={`${(remboursements30j._sum.montant ?? 0).toString()} FBU`}
          />
        </div>
      </section>

      <p className="text-sm text-base-content/60">
        Note : le rapport réglementaire complet pour la BRB (ratios prudentiels détaillés)
        reste à définir avec toi selon le format exact exigé.
      </p>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className={`card bg-base-100 border ${alert ? "border-error" : "border-base-300"}`}>
      <div className="card-body p-4">
        <span className="text-xs uppercase text-base-content/60">{label}</span>
        <span className={`text-xl font-bold ${alert ? "text-error" : ""}`}>{value}</span>
      </div>
    </div>
  );
}
