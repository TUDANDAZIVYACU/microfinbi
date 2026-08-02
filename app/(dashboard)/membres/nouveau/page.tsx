import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { creerMembre } from "../actions";

export default async function NouveauMembrePage() {
  const { tenantId } = await requireUser();

  const agences = await withRetry(() =>
    prisma.agence.findMany({ where: { tenantId, actif: true }, orderBy: { nom: "asc" } })
  );

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nouveau membre</h1>

      <form action={creerMembre} className="space-y-4 bg-base-100 p-6 rounded-box border border-base-300">
        <div className="form-control">
          <label className="label"><span className="label-text">Agence</span></label>
          <select name="agenceId" required className="select select-bordered w-full">
            <option value="">Sélectionner une agence</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Nom</span></label>
            <input name="nom" required className="input input-bordered w-full" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Prénom</span></label>
            <input name="prenom" required className="input input-bordered w-full" />
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Téléphone</span></label>
          <input name="telephone" placeholder="+257 ..." className="input input-bordered w-full" />
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Adresse</span></label>
          <textarea name="adresse" className="textarea textarea-bordered w-full" />
        </div>

        <button type="submit" className="btn btn-primary w-full">Enregistrer le membre</button>
      </form>
    </div>
  );
}
