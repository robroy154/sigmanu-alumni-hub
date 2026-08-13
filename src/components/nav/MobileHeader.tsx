"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MoreSheet } from "./MoreSheet";

interface MobileHeaderProps {
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  photoUrl: string | null;
}

const PAGE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/events": "Events",
  "/directory": "Directory",
  "/family-tree": "Family Tree",
  "/my-events": "My Events",
  "/profile": "My Profile",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname];
  if (exact !== undefined) return exact;
  const matchKey = Object.keys(PAGE_TITLES).find((p) => pathname.startsWith(p + "/"));
  const matched = matchKey !== undefined ? PAGE_TITLES[matchKey] : undefined;
  return matched ?? "Mu Xi Hub";
}

export function MobileHeader({ firstName, lastName, isAdmin, photoUrl }: MobileHeaderProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?";

  return (
    <>
      <header className="md:hidden flex items-center justify-between px-4 py-2">
        <h1 className="text-sn-off-white font-heading text-[18px] font-bold">
          {getPageTitle(pathname)}
        </h1>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="Open menu"
          className="w-7.5 h-7.5 rounded-full overflow-hidden bg-sn-gray-dark text-sn-gold font-semibold text-[10.5px] flex items-center justify-center shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sn-gold focus-visible:ring-offset-2 focus-visible:ring-offset-sn-black-secondary"
        >
          {photoUrl !== null
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photoUrl} alt={initials} className="w-full h-full object-cover" />
            : initials}
        </button>
      </header>
      <MoreSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} isAdmin={isAdmin} />
    </>
  );
}
