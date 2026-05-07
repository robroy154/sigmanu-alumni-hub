"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/actions";

interface NavbarProps {
  firstName: string | null;
  lastName:  string | null;
  isAdmin:   boolean;
  photoUrl:  string | null;
}

const BASE_LINKS = [
  { href: "/home",        label: "Home" },
  { href: "/directory",   label: "Directory" },
  { href: "/family-tree", label: "Family Tree" },
  { href: "/my-events",   label: "My Events" },
];

export function Navbar({ firstName, lastName, isAdmin, photoUrl }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "?";

  const links = [
    ...BASE_LINKS,
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  // Exact match for /home, prefix match for everything else
  function isActive(href: string) {
    if (href === "/home") return pathname === "/home";
    return pathname === href || pathname.startsWith(href + "/");
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Close both menus on navigation
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <header className="sticky top-0 z-50 bg-sn-black border-b border-sn-gold/20">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

        {/* ── Brand ─────────────────────────────────────────────────── */}
        <Link href="/home" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-7 h-7 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none group-hover:bg-sn-gold-light transition-colors">
            ΣΝ
          </div>
          <span className="hidden sm:block text-sn-off-white text-sm font-semibold tracking-wide">
            Sigma Nu{" "}
            <span className="text-sn-gold/50 font-normal">·</span>{" "}
            Mu Xi
          </span>
        </Link>

        {/* ── Desktop nav ───────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-7 flex-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={[
                "relative text-sm tracking-wide transition-colors whitespace-nowrap py-0.5",
                isActive(href)
                  ? "text-sn-gold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-sn-gold"
                  : "text-sn-gray-text hover:text-sn-off-white",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right side ────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">

          {/* Avatar + dropdown — desktop only */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
              className="w-8 h-8 rounded-full overflow-hidden bg-sn-gold text-sn-black font-bold text-xs flex items-center justify-center hover:opacity-90 transition-opacity select-none focus-visible:ring-2 focus-visible:ring-sn-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sn-black focus-visible:outline-none"
            >
              {photoUrl !== null
                ? <img src={photoUrl} alt={initials} className="w-full h-full object-cover" />
                : initials}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-sn-surface border border-white/10 rounded-sm shadow-xl overflow-hidden">
                <Link
                  href="/profile"
                  className="block px-4 py-2.5 text-sm text-sn-gray-text hover:text-sn-off-white hover:bg-white/5 transition-colors"
                >
                  My Profile
                </Link>
                <div className="border-t border-white/10" />
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
          </div>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="md:hidden p-2 text-sn-gray-text hover:text-sn-off-white transition-colors"
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="2" x2="16" y2="16" />
                <line x1="16" y1="2" x2="2" y2="16" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="4" x2="16" y2="4" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="14" x2="16" y2="14" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-sn-gold/10 bg-sn-black-secondary">
          <nav className="px-6 pt-4 pb-2 flex flex-col">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={[
                  "py-3 text-sm tracking-wide border-l-2 pl-3 transition-colors",
                  isActive(href)
                    ? "text-sn-gold border-l-sn-gold"
                    : "text-sn-gray-text hover:text-sn-off-white border-l-transparent",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-white/10 mx-6" />

          <div className="px-6 py-4 flex items-center justify-between">
            <Link
              href="/profile"
              className="flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-sn-gold text-sn-black font-bold text-xs flex items-center justify-center select-none group-hover:opacity-90 transition-opacity">
                {photoUrl !== null
                  ? <img src={photoUrl} alt={initials} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <span className="text-sm text-sn-gray-text group-hover:text-sn-off-white transition-colors">
                My Profile
              </span>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-sn-gray-text hover:text-sn-off-white transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
