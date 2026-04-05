import type { Metadata } from "next";

export const metadata: Metadata = { title: "Family Tree" };

export default function FamilyTreePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-navy">Chapter Family Tree</h1>
      <p className="text-gray-500 mt-2 text-sm">
        [ Big/Little family tree visualization — Phase 8 ]
      </p>
    </div>
  );
}
