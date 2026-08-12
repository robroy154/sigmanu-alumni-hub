export interface AccountMenuItem {
  href: string;
  label: string;
}

export function getAccountMenuItems(isAdmin: boolean, includeMyEvents: boolean): AccountMenuItem[] {
  return [
    ...(includeMyEvents ? [{ href: "/my-events", label: "My Events" }] : []),
    { href: "/profile", label: "My Profile" },
    { href: "/settings", label: "Settings" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
}
