import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { ajouterMouvementCaisse } from "./actions";

export default async function CaissePage() {
  const { tenantId } = await requireUser();

  const mouvements = await withRetry(() =>
    prisma.caisseMouvement.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { ordo: "desc" },
      take: 100,
    })
  );

  const soldeActuel = mouvements[0]?.solde.toString() ?? "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Caisse</h1>
        <div className="stat p-0">
          <div className="stat-title">Solde actuel</div>
          <div className="stat-value text-lg">{soldeActuel} FBU</div>
        </div>
      </div>

      <form action={ajouterMouvementCaisse} className="flex flex-wrap gap-2 items-end bg-base-100 p-4 rounded-box border border-base-300">
        <div className="form-control">
          <label className="label"><span className="label-text">Libellé</span></label>
          <input name="libelle" required className="input input-bordered" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Sens</span></label>
          <select name="sens" className="select select-bordered">
            <option value="DEBIT">Débit (entrée)</option>
            <option value="CREDIT">Crédit (sortie)</option>
          </select>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Montant (FBU)</span></label>
          <input name="montant" type="number" min="0" step="1" required className="input input-bordered" />
        </div>
        <button type="submit" className="btn btn-primary">Ajouter</button>
      </form>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table">
          <thead>
            <tr><th>Ordo</th><th>Libellé</th><th>Débit</th><th>Crédit</th><th>Solde</th><th>Agent</th></tr>
          </thead>
          <tbody>
            {mouvements.map((m) => (
              <tr key={m.id} className="hover">
                <td>{m.ordo}</td>
                <td>{m.libelle}</td>
                <td>{Number(m.debit) > 0 ? m.debit.toString() : "—"}</td>
                <td>{Number(m.credit) > 0 ? m.credit.toString() : "—"}</td>
                <td className="font-medium">{m.solde.toString()}</td>
                <td>{m.user.nom}</td>
              </tr>
            ))}
            {mouvements.length === 0 && (
              <tr><td colSpan={6} className="text-center text-base-content/60 py-8">Aucun mouvement.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
