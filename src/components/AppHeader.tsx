"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Trang chủ" },
  { href: "/program", label: "Chương trình" },
  { href: "/exercises", label: "Bài tập" },
  { href: "/settings", label: "Cài đặt" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex max-w-2xl gap-0.5 overflow-x-auto px-1"
      >
        {links.map(({ href, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 shrink-0 items-center px-2.5 text-sm font-medium",
                active
                  ? "border-primary text-foreground border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
