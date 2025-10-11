import type { Metadata } from "next";
import "./globals.css";
import PasswordProtection from "../components/PasswordProtection";

export const metadata: Metadata = {
  title: "AmzAppeal Pro",
  description: "Your AI-Powered Path to Reinstatement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PasswordProtection>
          {children}
        </PasswordProtection>
      </body>
    </html>
  );
}