import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shift2 Auditor",
  description: "Tool voor het uitvoeren en rapporteren van WCAG toegankelijkheidsonderzoeken",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script src="https://code.iconify.design/3/3.1.0/iconify.min.js"></script>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
