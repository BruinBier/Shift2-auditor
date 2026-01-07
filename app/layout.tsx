import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift2 Auditor - WCAG Toegankelijkheidsonderzoek",
  description: "Tool voor het uitvoeren en rapporteren van WCAG toegankelijkheidsonderzoeken",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
