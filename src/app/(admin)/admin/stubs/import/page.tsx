import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ImportClient from "./ImportClient";

export const metadata: Metadata = { title: "Import Stubs — Admin" };

export default async function AdminStubsImportPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("status", "stub");

  return (
    <div className="space-y-4">
      <Link
        href="/admin/stubs"
        className="inline-block text-sn-gray-text hover:text-sn-off-white text-sm transition-colors"
      >
        ← Stubs
      </Link>
      <ImportClient initialStubCount={count ?? 0} />
    </div>
  );
}
