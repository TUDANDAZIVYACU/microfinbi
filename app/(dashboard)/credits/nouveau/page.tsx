import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { creerDemandeCredit } from "../actions";

export default async function NouvelleDemandeCreditPage({
  searchParams,
}: {
  searchParams: Promise<{ membreId?: string }>;
}) {
  const { tenantId } = await requireUser();
  const { membreId } = await searchParams;

  const [membres, produits] = await withRetry(() =>
    Promise.all([
      prisma.membre.findMany({
        where: { tenantId, statut: "ACTIF" },
        orderBy: { nom: "asc" },
        include: { agence: true },
      }),
      prisma.produitCredit.findMany({ where: { tenantId, actif: true } }),
    ])
  );

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nouvelle demande de crédit</h1>

      <form action={creerDemandeCredit} className="space-y-4 bg-base-100 p-6 rounded-box border border-base-300">
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
          <label className="label"><span className="label-text">Produit de crédit</span></label>
          <select name="produitId" required className="select select-bordered w-full">
            <option value="">Sélectionner un produit</option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} — {p.tauxInteret.toString()}%/an, {p.montantMin.toString()} à {p.montantMax.toString()} FBU
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Montant (FBU)</span></label>
            <input name="montant" type="number" min="0" step="1" required className="input input-bordered w-full" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Durée (mois)</span></label>
            <input name="dureeMois" type="number" min="1" required className="input input-bordered w-full" />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full">Soumettre la demande</button>
      </form>
    </div>
  );
}
