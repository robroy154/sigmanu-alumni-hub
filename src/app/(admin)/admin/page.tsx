import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-navy">Admin Dashboard</h1>
      <p className="text-gray-500 mt-2 text-sm">[ Admin panel — Phase 6 ]</p>
    </div>
  );
}
