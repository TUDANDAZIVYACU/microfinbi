import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

const STATUT_BADGE: Record<string, string> = {
  EN_ATTENTE: "badge-warning",
  APPROUVE: "badge-info",
  REJETE: "badge-error",
  DECAISSE: "badge-info",
  EN_COURS: "badge-success",
  SOLDE: "badge-neutral",
  EN_RETARD: "badge-error",
  CONTENTIEUX: "badge-error",
};

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { tenantId } = await requireUser();
  const { statut } = await searchParams;

  const credits = await withRetry(() =>
    prisma.credit.findMany({
      where: { tenantId, ...(statut ? { statut: statut as never } : {}) },
      include: { membre: true, produit: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  );

  const filtres = ["EN_ATTENTE", "APPROUVE", "EN_COURS", "EN_RETARD", "SOLDE"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Crédits</h1>
        <Link href="/credits/nouveau" className="btn btn-primary">
          + Nouvelle demande
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/credits" className={`btn btn-sm ${!statut ? "btn-active" : "btn-outline"}`}>
          Tous
        </Link>
        {filtres.map((s) => (
          <Link
            key={s}
            href={`/credits?statut=${s}`}
            className={`btn btn-sm ${statut === s ? "btn-active" : "btn-outline"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table">
          <thead>
            <tr>
              <th>N° crédit</th>
              <th>Membre</th>
              <th>Produit</th>
              <th>Montant</th>
              <th>Durée</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {credits.map((c) => (
              <tr key={c.id} className="hover">
                <td><Link href={`/credits/${c.id}`} className="link link-primary">{c.numeroCredit}</Link></td>
                <td>{c.membre.nom} {c.membre.prenom}</td>
                <td>{c.produit.nom}</td>
                <td>{c.montant.toString()} FBU</td>
                <td>{c.dureeMois} mois</td>
                <td><span className={`badge ${STATUT_BADGE[c.statut]}`}>{c.statut}</span></td>
              </tr>
            ))}
            {credits.length === 0 && (
              <tr><td colSpan={6} className="text-center text-base-content/60 py-8">Aucun crédit.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
