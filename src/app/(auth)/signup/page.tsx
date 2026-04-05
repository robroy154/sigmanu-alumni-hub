import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Join the Hub</CardTitle>
        <CardDescription className="text-white/60">
          Create your Mu Xi alumni account. Your account will be reviewed by an
          admin before you have full access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white/40 text-sm text-center py-8">
          [ Signup form — Phase 3 ]
        </p>
      </CardContent>
    </Card>
  );
}
