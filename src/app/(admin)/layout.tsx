import Link from "next/link";

// Admin layout — visually distinct from member layout (darker header).
// Phase 6: enforce status === "admin" before rendering.
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-sn-navy-dark border-b border-sn-gold/30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sn-gold flex items-center justify-center text-sn-navy font-bold text-xs select-none">
              ΣΝ
            </div>
            <div>
              <p className="text-sn-gold font-semibold text-sm leading-none">
                Admin Panel
              </p>
              <p className="text-white/50 text-xs leading-none mt-0.5">
                Sigma Nu · Mu Xi Alumni Hub
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
