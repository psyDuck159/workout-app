"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, Dumbbell, History, ListOrdered, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Hôm nay", icon: CalendarCheck },
  { href: "/program", label: "Chương trình", icon: ListOrdered },
  { href: "/exercises", label: "Bài tập", icon: Dumbbell },
  { href: "/history", label: "Lịch sử", icon: History },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

/** Các màn hình toàn màn hình không hiện thanh tab (player có thanh nút riêng ở đáy). */
const HIDDEN_ON = ["/workout", "/welcome"];

/** Thanh tab dưới màn hình, vừa tầm ngón cái (SRS §8.1). */
export default function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav
      aria-label="Điều hướng chính"
      className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "stroke-[2.5]")} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
