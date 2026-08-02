import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import {
  approuverCredit,
  rejeterCredit,
  decaisserCredit,
  enregistrerRemboursementAction,
} from "../actions";

const STATUT_ECHEANCE_BADGE: Record<string, string> = {
  A_VENIR: "badge-ghost",
  PAYEE: "badge-success",
  PARTIELLE: "badge-warning",
  EN_RETARD: "badge-error",
};

export default async function CreditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId, role } = await requireUser();
  const { id } = await params;

  const credit = await withRetry(() =>
    prisma.credit.findFirst({
      where: { id, tenantId },
      include: {
        membre: true,
        produit: true,
        echeancier: { orderBy: { numeroEcheance: "asc" } },
        remboursements: { orderBy: { datePaiement: "desc" } },
      },
    })
  );

  if (!credit) notFound();

  const peutApprouver = ["ADMIN_TENANT", "SUPER_ADMIN"].includes(role as string) && credit.statut === "EN_ATTENTE";
  const peutDecaisser = ["ADMIN_TENANT", "SUPER_ADMIN", "CAISSIER"].includes(role as string) && credit.statut === "APPROUVE";
  const peutRembourser = ["EN_COURS", "EN_RETARD"].includes(credit.statut);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{credit.numeroCredit}</h1>
          <p className="text-base-content/60">
            {credit.membre.nom} {credit.membre.prenom} · {credit.produit.nom}
          </p>
        </div>
        <span className="badge badge-lg">{credit.statut}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
        <Info label="Montant" value={`${credit.montant.toString()} FBU`} />
        <Info label="Taux annuel" value={`${credit.tauxInteret.toString()}%`} />
        <Info label="Durée" value={`${credit.dureeMois} mois`} />
        <Info
          label="Décaissé le"
          value={credit.dateDecaissement ? new Date(credit.dateDecaissement).toLocaleDateString("fr-FR") : "—"}
        />
      </div>

      {(peutApprouver || peutDecaisser) && (
        <div className="flex gap-2">
          {peutApprouver && (
            <>
              <form action={approuverCredit.bind(null, credit.id)}>
                <button className="btn btn-success">Approuver</button>
              </form>
              <form action={rejeterCredit.bind(null, credit.id)}>
                <button className="btn btn-error btn-outline">Rejeter</button>
              </form>
            </>
          )}
          {peutDecaisser && (
            <form action={decaisserCredit.bind(null, credit.id)}>
              <button className="btn btn-primary">Décaisser et générer l'échéancier</button>
            </form>
          )}
        </div>
      )}

      {peutRembourser && (
        <section className="max-w-md space-y-2">
          <h2 className="text-lg font-semibold">Enregistrer un remboursement</h2>
          <form action={enregistrerRemboursementAction} className="space-y-3 bg-base-100 p-4 rounded-box border border-base-300">
            <input type="hidden" name="creditId" value={credit.id} />
            <div className="form-control">
              <label className="label"><span className="label-text">Montant (FBU)</span></label>
              <input name="montant" type="number" min="0" step="1" required className="input input-bordered w-full" />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Mode de paiement</span></label>
              <select name="modePaiement" className="select select-bordered w-full">
                <option value="ESPECES">Espèces</option>
                <option value="LUMICASH">Lumicash</option>
                <option value="CASHTEL">CashTel</option>
                <option value="COOPEC">COOPEC</option>
                <option value="BANCOBU">BANCOBU</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Référence (optionnel)</span></label>
              <input name="reference" className="input input-bordered w-full" />
            </div>
            <button type="submit" className="btn btn-primary w-full">Enregistrer</button>
          </form>
        </section>
      )}

      {credit.echeancier.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Échéancier</h2>
          <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Date</th><th>Capital</th><th>Intérêt</th><th>Total</th><th>Payé</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {credit.echeancier.map((e) => (
                  <tr key={e.id} className="hover">
                    <td>{e.numeroEcheance}</td>
                    <td>{new Date(e.dateEcheance).toLocaleDateString("fr-FR")}</td>
                    <td>{e.montantCapital.toString()}</td>
                    <td>{e.montantInteret.toString()}</td>
                    <td className="font-medium">{e.montantTotal.toString()}</td>
                    <td>{e.montantPaye.toString()}</td>
                    <td><span className={`badge ${STATUT_ECHEANCE_BADGE[e.statut]}`}>{e.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {credit.remboursements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Historique des remboursements</h2>
          <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Montant</th><th>Mode</th><th>Référence</th></tr>
              </thead>
              <tbody>
                {credit.remboursements.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.datePaiement).toLocaleDateString("fr-FR")}</td>
                    <td>{r.montant.toString()} FBU</td>
                    <td>{r.modePaiement || "—"}</td>
                    <td>{r.reference || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
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
