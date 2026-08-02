import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

const STATUT_BADGE: Record<string, string> = {
  ACTIF: "badge-success",
  SUSPENDU: "badge-warning",
  RADIE: "badge-error",
};

export default async function MembresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { tenantId } = await requireUser();
  const { q } = await searchParams;

  const membres = await withRetry(() =>
    prisma.membre.findMany({
      where: {
        tenantId,
        ...(q
          ? {
              OR: [
                { nom: { contains: q, mode: "insensitive" } },
                { prenom: { contains: q, mode: "insensitive" } },
                { numeroMembre: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { agence: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Membres</h1>
        <Link href="/membres/nouveau" className="btn btn-primary">
          + Nouveau membre
        </Link>
      </div>

      <form className="max-w-sm">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher un membre..."
          className="input input-bordered w-full"
        />
      </form>

      <div className="overflow-x-auto bg-base-100 rounded-box border border-base-300">
        <table className="table">
          <thead>
            <tr>
              <th>N° membre</th>
              <th>Nom</th>
              <th>Agence</th>
              <th>Téléphone</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {membres.map((m) => (
              <tr key={m.id} className="hover">
                <td>
                  <Link href={`/membres/${m.id}`} className="link link-primary">
                    {m.numeroMembre}
                  </Link>
                </td>
                <td>{m.nom} {m.prenom}</td>
                <td>{m.agence.nom}</td>
                <td>{m.telephone || "—"}</td>
                <td>
                  <span className={`badge ${STATUT_BADGE[m.statut]}`}>{m.statut}</span>
                </td>
              </tr>
            ))}
            {membres.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-base-content/60 py-8">
                  Aucun membre trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
