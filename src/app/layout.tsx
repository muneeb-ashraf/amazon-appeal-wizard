import type { Metadata } from "next";

/*
  NOTE: The direct import for 'globals.css' and 'next/font/google' caused compilation errors
  in this environment. In your actual Next.js project, those imports are correct and necessary.
  This file has been simplified to remove the errors for this preview.

  Please ensure your project's `app/layout.tsx` file includes:
  1. import { Inter } from "next/font/google";
  2. import "./globals.css";
  As they are essential for styling and font optimization in a real Next.js application.
*/

// const inter = Inter({ subsets: ["latin"] }); // This line is commented out as the import is unavailable here.

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
      {/* In your actual project, the body tag should look like this to apply the Inter font:
        <body className={`${inter.className} antialiased`}>{children}</body> 
      */}
      <body className="antialiased">{children}</body>
    </html>
  );
}

