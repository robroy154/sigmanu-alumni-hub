"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, GitBranch, Ticket, Search } from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { getAccountMenuItems } from "./accountMenuItems";
import { useCommandPalette } from "./CommandPaletteContext";

interface AppRailProps {
  firstName: string | null;
  lastName: string | null;
  pledgeClass: string | null;
  isAdmin: boolean;
  photoUrl: string | null;
  eventsBadgeCount: number;
}

const NAV_ITEMS = [
  { href: "/home", label: "Home", Icon: LayoutDashboard },
  { href: "/events", label: "Events", Icon: Calendar },
  { href: "/directory", label: "Directory", Icon: Users },
  { href: "/family-tree", label: "Family Tree", Icon: GitBranch },
  { href: "/my-events", label: "My Events", Icon: Ticket },
];

export function AppRail({ firstName, lastName, pledgeClass, isAdmin, photoUrl, eventsBadgeCount }: AppRailProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open: openCommandPalette } = useCommandPalette();

  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const menuItems = getAccountMenuItems(isAdmin, false);

  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="hidden md:flex md:w-16 lg:w-53 flex-col gap-4.5 h-screen sticky top-0 bg-sn-rail border-r border-white/7 py-4 px-3">
      <Link href="/home" className="flex items-center gap-2.5 px-1.5">
        <div className="w-7.5 h-7.5 rounded-[9px] bg-sn-gold text-sn-black-secondary flex items-center justify-center font-bold text-[11px] shrink-0 select-none">
          ΣΝ
        </div>
        <div className="hidden lg:block min-w-0">
          <p className="text-sn-text text-xs font-semibold truncate">Mu Xi Hub</p>
          <p className="text-sn-gray-medium text-[10px] truncate">Columbus State</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={openCommandPalette}
        aria-label="Search"
        title="Search brothers and events"
        className="flex items-center gap-2 rounded-[9px] bg-sn-surface-2 border border-white/8 px-2.5 py-2 text-sn-gray-medium hover:bg-white/5 transition-colors"
      >
        <Search size={14} className="shrink-0" />
        <span className="hidden lg:block flex-1 text-left text-[11.5px]">Search</span>
        <span className="hidden lg:block font-mono text-[10px] bg-white/7 rounded px-1 py-0.5">⌘K</span>
      </button>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={[
                "flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[12.5px] font-medium transition-colors",
                active ? "bg-sn-gold/14 text-sn-gold-light" : "text-sn-gray-text hover:bg-white/5",
              ].join(" ")}
            >
              <Icon size={15} className={active ? "text-sn-gold-light shrink-0" : "text-sn-gray-medium shrink-0"} />
              <span className="hidden lg:block flex-1 truncate">{label}</span>
              {href === "/events" && eventsBadgeCount > 0 && (
                <span className="hidden lg:flex font-semibold text-[10px] text-sn-black-secondary bg-sn-gold rounded-full px-1.5 py-0.5 leading-none">
                  {eventsBadgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-sn-surface border border-white/8 rounded-2xl overflow-hidden shadow-xl">
            {menuItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-4 py-2.5 text-sm text-sn-gray-text hover:text-sn-off-white hover:bg-white/5 transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-white/8" />
            <form action={signOut}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2.5 text-sm text-sn-gray-text hover:text-sn-off-white hover:bg-white/5 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        )}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={menuOpen}
          className="w-full flex items-center gap-2.25 rounded-[10px] bg-sn-surface-2 px-2.5 py-2 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sn-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sn-rail"
        >
          <div className="w-6.5 h-6.5 rounded-full overflow-hidden bg-sn-gray-dark text-sn-gold font-semibold text-[10px] flex items-center justify-center shrink-0 select-none">
            {photoUrl !== null
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={photoUrl} alt={initials} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="hidden lg:block min-w-0 text-left">
            <p className="text-sn-text text-[11.5px] font-medium truncate">
              {[firstName, lastName].filter(Boolean).join(" ") || "Member"}
            </p>
            <p className="text-sn-gray-medium text-[10px] truncate">{pledgeClass ?? "—"}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
