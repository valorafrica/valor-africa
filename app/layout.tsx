import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valor Africa CRM",
  description: "Plateforme de gestion des opérations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}