"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "Start" },
  { href: "/egzamin", label: "Egzamin" },
  { href: "/nauka", label: "Nauka" },
  { href: "/baza", label: "Baza pytań" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.16em] text-forest uppercase">
            Małopolska WPA
          </p>
          <p className="truncate font-serif text-lg leading-tight">Pozwolenie kolekcjonerskie</p>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex gap-1 text-sm">
            {links.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 ${
                    active ? "bg-forest text-paper" : "text-muted hover:bg-card hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
