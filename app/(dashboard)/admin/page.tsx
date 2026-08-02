import { requireRole } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import {
  creerAgence,
  creerProduitCredit,
  creerProduitEpargne,
  creerUtilisateur,
  desactiverUtilisateur,
} from "./actions";

export default async function AdminPage() {
  const { tenantId } = await requireRole(["ADMIN_TENANT", "SUPER_ADMIN"]);

  const [agences, produitsCredit, produitsEpargne, users] = await withRetry(() =>
    Promise.all([
      prisma.agence.findMany({ where: { tenantId }, orderBy: { nom: "asc" } }),
      prisma.produitCredit.findMany({ where: { tenantId }, orderBy: { nom: "asc" } }),
      prisma.produitEpargne.findMany({ where: { tenantId }, orderBy: { nom: "asc" } }),
      prisma.user.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } }),
    ])
  );

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Administration</h1>

      {/* AGENCES */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Agences</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <ul className="bg-base-100 rounded-box border border-base-300 divide-y divide-base-300">
            {agences.map((a) => (
              <li key={a.id} className="p-3">{a.nom} {a.ville ? `— ${a.ville}` : ""}</li>
            ))}
            {agences.length === 0 && <li className="p-3 text-base-content/60">Aucune agence.</li>}
          </ul>
          <form action={creerAgence} className="space-y-2 bg-base-100 p-4 rounded-box border border-base-300">
            <input name="nom" placeholder="Nom de l'agence" required className="input input-bordered w-full" />
            <input name="ville" placeholder="Ville" className="input input-bordered w-full" />
            <button type="submit" className="btn btn-primary btn-sm">+ Ajouter une agence</button>
          </form>
        </div>
      </section>

      {/* PRODUITS CREDIT */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Produits de crédit</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
            <table className="table table-sm">
              <thead><tr><th>Nom</th><th>Taux</th><th>Durée</th><th>Montant</th></tr></thead>
              <tbody>
                {produitsCredit.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nom}</td>
                    <td>{p.tauxInteret.toString()}%</td>
                    <td>{p.dureeMinMois}-{p.dureeMaxMois} mois</td>
                    <td>{p.montantMin.toString()}-{p.montantMax.toString()}</td>
                  </tr>
                ))}
                {produitsCredit.length === 0 && (
                  <tr><td colSpan={4} className="text-base-content/60">Aucun produit.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <form action={creerProduitCredit} className="space-y-2 bg-base-100 p-4 rounded-box border border-base-300">
            <input name="nom" placeholder="Nom du produit" required className="input input-bordered w-full" />
            <div className="grid grid-cols-2 gap-2">
              <input name="tauxInteret" type="number" step="0.1" placeholder="Taux annuel %" required className="input input-bordered w-full" />
              <input name="penaliteRetard" type="number" step="0.1" placeholder="Pénalité %" className="input input-bordered w-full" />
              <input name="dureeMinMois" type="number" placeholder="Durée min (mois)" required className="input input-bordered w-full" />
              <input name="dureeMaxMois" type="number" placeholder="Durée max (mois)" required className="input input-bordered w-full" />
              <input name="montantMin" type="number" placeholder="Montant min" required className="input input-bordered w-full" />
              <input name="montantMax" type="number" placeholder="Montant max" required className="input input-bordered w-full" />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">+ Ajouter un produit crédit</button>
          </form>
        </div>
      </section>

      {/* PRODUITS EPARGNE */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Produits d'épargne</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <ul className="bg-base-100 rounded-box border border-base-300 divide-y divide-base-300">
            {produitsEpargne.map((p) => (
              <li key={p.id} className="p-3">{p.nom} — {p.tauxRemuneration.toString()}%/an</li>
            ))}
            {produitsEpargne.length === 0 && <li className="p-3 text-base-content/60">Aucun produit.</li>}
          </ul>
          <form action={creerProduitEpargne} className="space-y-2 bg-base-100 p-4 rounded-box border border-base-300">
            <input name="nom" placeholder="Nom du produit" required className="input input-bordered w-full" />
            <input name="tauxRemuneration" type="number" step="0.1" placeholder="Taux annuel %" required className="input input-bordered w-full" />
            <input name="soldeMinimum" type="number" placeholder="Solde minimum" className="input input-bordered w-full" />
            <button type="submit" className="btn btn-primary btn-sm">+ Ajouter un produit épargne</button>
          </form>
        </div>
      </section>

      {/* UTILISATEURS */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Utilisateurs</h2>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
            <table className="table table-sm">
              <thead><tr><th>Nom</th><th>Rôle</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nom}</td>
                    <td>{u.role}</td>
                    <td>{u.actif ? "Actif" : "Désactivé"}</td>
                    <td>
                      {u.actif && (
                        <form action={desactiverUtilisateur.bind(null, u.id)}>
                          <button className="btn btn-xs btn-error btn-outline">Désactiver</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form action={creerUtilisateur} className="space-y-2 bg-base-100 p-4 rounded-box border border-base-300">
            <input name="clerkId" placeholder="Clerk User ID (depuis dashboard Clerk)" required className="input input-bordered w-full" />
            <input name="nom" placeholder="Nom" required className="input input-bordered w-full" />
            <input name="email" type="email" placeholder="Email" required className="input input-bordered w-full" />
            <select name="role" required className="select select-bordered w-full">
              <option value="AGENT_CREDIT">Agent de crédit</option>
              <option value="CAISSIER">Caissier</option>
              <option value="ADMIN_TENANT">Admin</option>
              <option value="AUDITEUR">Auditeur</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm">+ Ajouter un utilisateur</button>
          </form>
        </div>
        <p className="text-xs text-base-content/60">
          Rappel : après création ici, va aussi configurer le rôle et le tenantId
          dans les métadonnées Clerk (sessionClaims.metadata) de ce même utilisateur.
        </p>
      </section>
    </div>
  );
}
