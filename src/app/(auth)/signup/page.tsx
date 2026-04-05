import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/SignupForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

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
      <CardContent className="space-y-6">
        <SignupForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-2 text-white/40">or</span>
          </div>
        </div>

        <OAuthButtons />
      </CardContent>
    </Card>
  );
}
