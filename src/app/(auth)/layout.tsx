// Auth layout — centers forms on navy background with Sigma Nu branding header.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-sn-navy flex flex-col">
      <header className="px-6 py-4 border-b border-sn-gold/20">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sn-gold flex items-center justify-center text-sn-navy font-bold text-xs select-none">
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
