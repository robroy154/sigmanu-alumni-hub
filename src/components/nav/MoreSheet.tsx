"use client";

import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getAccountMenuItems } from "./accountMenuItems";

interface MoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

export function MoreSheet({ isOpen, onClose, isAdmin }: MoreSheetProps) {
  if (!isOpen) return null;

  const menuItems = getAccountMenuItems(isAdmin, true);

  return (
    <div className="md:hidden fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        className="absolute bottom-0 left-0 right-0 bg-sn-surface border-t border-white/8 rounded-t-2xl overflow-hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="w-9 h-1 rounded-full bg-white/15 mx-auto mt-3 mb-1" />
        <nav className="py-2">
          {menuItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="block px-6 py-3.5 text-sm text-sn-gray-text hover:text-sn-off-white hover:bg-white/5 transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-white/8 mx-6" />
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-6 py-3.5 text-sm text-sn-gray-text hover:text-sn-off-white hover:bg-white/5 transition-colors"
            >
              Sign Out
            </button>
          </form>
        </nav>
      </div>
    </div>
  );
}
