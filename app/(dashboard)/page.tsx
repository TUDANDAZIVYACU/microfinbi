import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import Decimal from "decimal.js";

export default async function DashboardHome() {
  const { tenantId } = await requireUser();

  const [membresActifs, credits, echeancesEnRetard, soldeCaisse] = await withRetry(() =>
    Promise.all([
      prisma.membre.count({ where: { tenantId, statut: "ACTIF" } }),
      prisma.credit.findMany({
        where: { tenantId, statut: { in: ["EN_COURS", "EN_RETARD"] } },
        select: { montant: true, statut: true },
      }),
      prisma.echeanceCredit.count({
        where: { statut: "EN_RETARD", credit: { tenantId } },
      }),
      prisma.caisseMouvement.findFirst({
        where: { tenantId },
        orderBy: { dateOp: "desc" },
        select: { solde: true },
      }),
    ])
  );

  const encoursTotal = credits.reduce(
    (acc, c) => acc.add(new Decimal(c.montant.toString())),
    new Decimal(0)
  );
  const encoursEnRetard = credits
    .filter((c) => c.statut === "EN_RETARD")
    .reduce((acc, c) => acc.add(new Decimal(c.montant.toString())), new Decimal(0));

  const par = encoursTotal.gt(0)
    ? encoursEnRetard.div(encoursTotal).mul(100).toDecimalPlaces(1)
    : new Decimal(0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Membres actifs" value={membresActifs.toLocaleString("fr-FR")} />
        <StatCard
          label="Encours de crédit"
          value={`${encoursTotal.toNumber().toLocaleString("fr-FR")} FBU`}
        />
        <StatCard
          label="Portefeuille à risque (PAR)"
          value={`${par}%`}
          alert={par.gt(5)}
        />
        <StatCard
          label="Échéances en retard"
          value={echeancesEnRetard.toLocaleString("fr-FR")}
          alert={echeancesEnRetard > 0}
        />
        <StatCard
          label="Solde caisse"
          value={`${(soldeCaisse?.solde.toString() ?? "0").toLocaleString?.("fr-FR") ?? soldeCaisse?.solde.toString() ?? "0"} FBU`}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={`card bg-base-100 border ${alert ? "border-error" : "border-base-300"}`}>
      <div className="card-body p-4">
        <span className="text-xs uppercase text-base-content/60">{label}</span>
        <span className={`text-2xl font-bold ${alert ? "text-error" : ""}`}>{value}</span>
      </div>
    </div>
  );
}
