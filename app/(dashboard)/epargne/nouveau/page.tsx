import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { ouvrirCompteEpargne } from "../actions";

export default async function NouveauCompteEpargnePage({
  searchParams,
}: {
  searchParams: Promise<{ membreId?: string }>;
}) {
  const { tenantId } = await requireUser();
  const { membreId } = await searchParams;

  const [membres, produits] = await withRetry(() =>
    Promise.all([
      prisma.membre.findMany({ where: { tenantId, statut: "ACTIF" }, orderBy: { nom: "asc" } }),
      prisma.produitEpargne.findMany({ where: { tenantId, actif: true } }),
    ])
  );

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nouveau compte épargne</h1>

      <form action={ouvrirCompteEpargne} className="space-y-4 bg-base-100 p-6 rounded-box border border-base-300">
        <div className="form-control">
          <label className="label"><span className="label-text">Membre</span></label>
          <select name="membreId" required defaultValue={membreId ?? ""} className="select select-bordered w-full">
            <option value="">Sélectionner un membre</option>
            {membres.map((m) => (
              <option key={m.id} value={m.id}>{m.numeroMembre} — {m.nom} {m.prenom}</option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Produit d'épargne</span></label>
          <select name="produitId" required className="select select-bordered w-full">
            <option value="">Sélectionner un produit</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>{p.nom} — {p.tauxRemuneration.toString()}%/an</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-primary w-full">Ouvrir le compte</button>
      </form>
    </div>
  );
}
