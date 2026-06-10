"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/packaging",
    label: "Bottles & containers",
    match: (path: string) => path === "/packaging",
  },
  {
    href: "/packaging/caps",
    label: "Caps & lids",
    match: (path: string) => path.startsWith("/packaging/caps"),
  },
] as const;

export function PackagingTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex gap-1 border-b border-stone-200"
      aria-label="Packaging sections"
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-emerald-700 text-emerald-900"
                : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
