// Shared layout for /auth/forgot-password and /auth/reset-password.
// Mirrors the (auth) route group layout — same centered shell, same branding.
export default function AuthSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sn-black flex flex-col">
      <header className="px-6 py-4 border-b border-sn-gold/20">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-xs select-none">
            ΣΝ
          </div>
          <p className="text-sn-gold font-semibold text-sm">
            Sigma Nu · Mu Xi Alumni Hub
          </p>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
