import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { changerStatutMembre } from "../actions";

export default async function MembreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId } = await requireUser();
  const { id } = await params;

  const membre = await withRetry(() =>
    prisma.membre.findFirst({
      where: { id, tenantId },
      include: {
        agence: true,
        comptesEpargne: { include: { produit: true } },
        credits: { include: { produit: true }, orderBy: { createdAt: "desc" } },
      },
    })
  );

  if (!membre) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{membre.nom} {membre.prenom}</h1>
          <p className="text-base-content/60">{membre.numeroMembre} · {membre.agence.nom}</p>
        </div>
        <form action={changerStatutMembre.bind(null, membre.id, membre.statut === "ACTIF" ? "SUSPENDU" : "ACTIF")}>
          <button className="btn btn-outline">
            {membre.statut === "ACTIF" ? "Suspendre" : "Réactiver"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Info label="Téléphone" value={membre.telephone || "—"} />
        <Info label="Statut" value={membre.statut} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Comptes épargne</h2>
          <Link href={`/epargne/nouveau?membreId=${membre.id}`} className="btn btn-sm btn-outline">
            + Compte épargne
          </Link>
        </div>
        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
          <table className="table">
            <thead>
              <tr><th>N° compte</th><th>Produit</th><th>Solde</th></tr>
            </thead>
            <tbody>
              {membre.comptesEpargne.map((c) => (
                <tr key={c.id} className="hover">
                  <td><Link href={`/epargne/${c.id}`} className="link link-primary">{c.numeroCompte}</Link></td>
                  <td>{c.produit.nom}</td>
                  <td>{c.solde.toString()} FBU</td>
                </tr>
              ))}
              {membre.comptesEpargne.length === 0 && (
                <tr><td colSpan={3} className="text-center text-base-content/60 py-6">Aucun compte épargne.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Crédits</h2>
          <Link href={`/credits/nouveau?membreId=${membre.id}`} className="btn btn-sm btn-outline">
            + Demande de crédit
          </Link>
        </div>
        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
          <table className="table">
            <thead>
              <tr><th>N° crédit</th><th>Produit</th><th>Montant</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {membre.credits.map((c) => (
                <tr key={c.id} className="hover">
                  <td><Link href={`/credits/${c.id}`} className="link link-primary">{c.numeroCredit}</Link></td>
                  <td>{c.produit.nom}</td>
                  <td>{c.montant.toString()} FBU</td>
                  <td><span className="badge">{c.statut}</span></td>
                </tr>
              ))}
              {membre.credits.length === 0 && (
                <tr><td colSpan={4} className="text-center text-base-content/60 py-6">Aucun crédit.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs uppercase text-base-content/60 block">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
