import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pending Approval" };

export default function PendingApprovalPage() {
  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20 text-center">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Account Pending</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-white/70">
          Your account is awaiting approval from a chapter admin. You&apos;ll
          receive an email once your access has been granted.
        </p>
        <p className="text-white/40 text-sm">
          In the meantime, you can still register for chapter events.
        </p>
      </CardContent>
    </Card>
  );
}
