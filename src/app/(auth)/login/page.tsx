import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-white/60">
          Sign in to your Mu Xi alumni account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-white/40 text-sm text-center py-8">
          [ Login form — Phase 3 ]
        </p>
      </CardContent>
    </Card>
  );
}
