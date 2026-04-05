import type { Metadata } from "next";

export const metadata: Metadata = { title: "Brother Directory" };

export default function DirectoryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-navy">Brother Directory</h1>
      <p className="text-gray-500 mt-2 text-sm">[ Member directory — Phase 7 ]</p>
    </div>
  );
}
