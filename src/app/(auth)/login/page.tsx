import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata: Metadata = { title: "Sign In" };

interface LoginPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo } = await searchParams;

  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Welcome back</CardTitle>
        <CardDescription className="text-white/60">
          Sign in to your Mu Xi alumni account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LoginForm redirectTo={redirectTo} />

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
