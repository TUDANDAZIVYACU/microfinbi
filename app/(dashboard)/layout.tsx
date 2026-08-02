import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { requireUser } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Tableau de bord", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "AGENT_CREDIT", "CAISSIER", "AUDITEUR"] },
  { href: "/membres", label: "Membres", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "AGENT_CREDIT", "CAISSIER", "AUDITEUR"] },
  { href: "/credits", label: "Crédits", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "AGENT_CREDIT", "AUDITEUR"] },
  { href: "/epargne", label: "Épargne", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "CAISSIER", "AUDITEUR"] },
  { href: "/caisse", label: "Caisse", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "CAISSIER"] },
  { href: "/banque", label: "Banque", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "CAISSIER"] },
  { href: "/rapports", label: "Rapports", roles: ["SUPER_ADMIN", "ADMIN_TENANT", "AUDITEUR"] },
  { href: "/admin", label: "Administration", roles: ["SUPER_ADMIN", "ADMIN_TENANT"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser();
  const items = NAV.filter((item) => item.roles.includes(ctx.role as string));

  return (
    <div className="drawer lg:drawer-open min-h-screen bg-base-200">
      <input id="nav-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <header className="navbar bg-base-100 border-b border-base-300 px-4 lg:hidden">
          <label htmlFor="nav-drawer" className="btn btn-square btn-ghost">
            ☰
          </label>
          <span className="ml-2 font-semibold">microfin.bi</span>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>

      <div className="drawer-side">
        <label htmlFor="nav-drawer" className="drawer-overlay" />
        <aside className="w-64 min-h-full bg-base-100 border-r border-base-300 flex flex-col">
          <div className="p-4 border-b border-base-300 flex items-center justify-between">
            <span className="font-bold text-lg">microfin.bi</span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>

          <nav className="flex-1 p-2">
            <ul className="menu">
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 text-xs text-base-content/60 border-t border-base-300">
            Connecté en tant que {ctx.role}
          </div>
        </aside>
      </div>
    </div>
  );
}
