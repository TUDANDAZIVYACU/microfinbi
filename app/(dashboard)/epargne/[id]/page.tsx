import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { effectuerMouvementEpargne } from "../actions";

export default async function CompteEpargneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId } = await requireUser();
  const { id } = await params;

  const compte = await withRetry(() =>
    prisma.compteEpargne.findFirst({
      where: { id, tenantId },
      include: {
        membre: true,
        produit: true,
        mouvements: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    })
  );

  if (!compte) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{compte.numeroCompte}</h1>
        <p className="text-base-content/60">
          {compte.membre.nom} {compte.membre.prenom} · {compte.produit.nom}
        </p>
      </div>

      <div className="stat bg-base-100 rounded-box border border-base-300 max-w-xs">
        <div className="stat-title">Solde actuel</div>
        <div className="stat-value text-2xl">{compte.solde.toString()} FBU</div>
      </div>

      <section className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold">Effectuer un mouvement</h2>
        <form action={effectuerMouvementEpargne} className="space-y-3 bg-base-100 p-4 rounded-box border border-base-300">
          <input type="hidden" name="compteId" value={compte.id} />
          <div className="form-control">
            <label className="label"><span className="label-text">Type</span></label>
            <select name="type" className="select select-bordered w-full">
              <option value="DEPOT">Dépôt</option>
              <option value="RETRAIT">Retrait</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Montant (FBU)</span></label>
            <input name="montant" type="number" min="0" step="1" required className="input input-bordered w-full" />
          </div>
          <button type="submit" className="btn btn-primary w-full">Valider</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historique des mouvements</h2>
        <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Montant</th><th>Solde après</th></tr>
            </thead>
            <tbody>
              {compte.mouvements.map((m) => (
                <tr key={m.id} className="hover">
                  <td>{new Date(m.createdAt).toLocaleString("fr-FR")}</td>
                  <td>
                    <span className={`badge ${m.type === "DEPOT" ? "badge-success" : "badge-warning"}`}>
                      {m.type}
                    </span>
                  </td>
                  <td>{m.montant.toString()} FBU</td>
                  <td>{m.soldeApres.toString()} FBU</td>
                </tr>
              ))}
              {compte.mouvements.length === 0 && (
                <tr><td colSpan={4} className="text-center text-base-content/60 py-6">Aucun mouvement.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
