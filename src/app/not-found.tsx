import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sn-black-secondary flex flex-col items-center justify-center px-6 text-center">
      {/* Crest */}
      <div className="w-16 h-16 rounded-full bg-sn-gold flex items-center justify-center text-sn-black font-bold text-2xl select-none mb-6">
        ΣΝ
      </div>

      <p className="text-sn-gold text-sm font-semibold uppercase tracking-widest mb-3">
        404 — Page not found
      </p>

      <h1 className="text-white text-3xl font-bold mb-4 leading-tight">
        This page doesn&rsquo;t exist
      </h1>

      <p className="text-white/50 text-sm max-w-xs leading-relaxed mb-8">
        The link may be broken, or the page may have been moved or removed.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-sn-gold px-6 text-sm font-semibold text-sn-black hover:bg-sn-gold-light transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/directory"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-6 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          Brother directory
        </Link>
      </div>

      <p className="mt-16 text-white/20 text-xs">
        Sigma Nu · Mu Xi Chapter · Columbus State University
      </p>
    </div>
  );
}
