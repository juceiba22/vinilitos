import Link from "next/link";

const ITEMS = [
  { href: "/admin/pages", label: "Páginas" },
  { href: "/admin/renewals", label: "Códigos de renovación" },
];

export default function AdminNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 mb-8">
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-4 py-2 rounded-full text-sm border transition-colors ${
            item.href === current
              ? "bg-vinyl-accent text-vinyl-black border-vinyl-accent"
              : "border-vinyl-line hover:border-vinyl-accent"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <form action="/api/admin/logout" method="POST" className="ml-auto">
        <button
          type="submit"
          className="px-4 py-2 rounded-full text-sm border border-vinyl-line hover:border-vinyl-accent transition-colors"
        >
          Cerrar sesión
        </button>
      </form>
    </nav>
  );
}
