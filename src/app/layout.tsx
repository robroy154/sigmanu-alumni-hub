import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Sigma Nu Mu Xi Alumni Hub",
    default: "Sigma Nu Mu Xi Alumni Hub",
  },
  description:
    "The official alumni platform for Sigma Nu Fraternity, Mu Xi Chapter — Columbus State University.",
  icons: {
    icon:     "/favicon.svg",
    shortcut: "/favicon.svg",
    apple:    "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1a1a1d",
              border: "1px solid rgba(198,167,94,0.2)",
              color: "#f5f5f7",
            },
          }}
        />
      </body>
    </html>
  );
}
