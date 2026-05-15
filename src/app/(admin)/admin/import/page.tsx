import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import ImportClient from "./ImportClient";

export const metadata: Metadata = { title: "Import — Admin" };

export default async function AdminImportPage() {
  const admin = createAdminClient();
  const { count } = await admin
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("status", "stub");

  return <ImportClient initialStubCount={count ?? 0} />;
}
