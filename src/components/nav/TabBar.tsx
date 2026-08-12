"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, GitBranch } from "lucide-react";

const TAB_ITEMS = [
  { href: "/home", label: "Home", Icon: LayoutDashboard },
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/directory", label: "Directory", Icon: Users },
  { href: "/family-tree", label: "Tree", Icon: GitBranch },
];

export function TabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around bg-sn-rail border-t border-white/8 pt-[11px]"
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      {TAB_ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex flex-col items-center justify-center gap-[5px] min-w-11 min-h-11 px-2",
              active ? "text-sn-gold-light" : "text-sn-gray-medium",
            ].join(" ")}
          >
            <Icon size={17} />
            <span className="text-[9.5px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
