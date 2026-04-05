import Link from "next/link";

// Member layout — wraps all authenticated member pages.
// Phase 3: verify session and member status (status === "member" | "admin") here.
export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-sn-navy border-b border-sn-gold/20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sn-gold flex items-center justify-center text-sn-navy font-bold text-xs select-none">
              ΣΝ
            </div>
            <p className="text-sn-gold font-semibold text-sm">
              Sigma Nu · Mu Xi Alumni Hub
            </p>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/directory"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Directory
            </Link>
            <Link
              href="/family-tree"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              Family Tree
            </Link>
            <Link
              href="/profile"
              className="text-white/80 hover:text-white text-sm transition-colors"
            >
              My Profile
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
