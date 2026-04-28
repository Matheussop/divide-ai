import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DivideAí",
  description: "Divisão de despesas do apartamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn("font-sans", nunito.variable)} suppressHydrationWarning>
      <body className={`${nunito.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
