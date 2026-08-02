import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

export default async function EpargnePage() {
  const { tenantId } = await requireUser();

  const comptes = await withRetry(() =>
    prisma.compteEpargne.findMany({
      where: { tenantId },
      include: { membre: true, produit: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  );

  const soldeTotal = comptes.reduce((acc, c) => acc + Number(c.solde), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Épargne</h1>
        <div className="stat p-0">
          <div className="stat-title">Solde total</div>
          <div className="stat-value text-lg">{soldeTotal.toLocaleString("fr-FR")} FBU</div>
        </div>
      </div>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table">
          <thead>
            <tr><th>N° compte</th><th>Membre</th><th>Produit</th><th>Solde</th></tr>
          </thead>
          <tbody>
            {comptes.map((c) => (
              <tr key={c.id} className="hover">
                <td><Link href={`/epargne/${c.id}`} className="link link-primary">{c.numeroCompte}</Link></td>
                <td>{c.membre.nom} {c.membre.prenom}</td>
                <td>{c.produit.nom}</td>
                <td>{c.solde.toString()} FBU</td>
              </tr>
            ))}
            {comptes.length === 0 && (
              <tr><td colSpan={4} className="text-center text-base-content/60 py-8">Aucun compte épargne.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
