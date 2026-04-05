// Public layout — unauthenticated access. Reserved for additional
// public sub-routes beyond the root page (e.g., a public event detail page).
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
