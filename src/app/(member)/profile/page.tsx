import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Profile" };

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-navy">My Profile</h1>
      <p className="text-gray-500 mt-2 text-sm">
        [ Profile editing — Phase 4 ]
      </p>
    </div>
  );
}
