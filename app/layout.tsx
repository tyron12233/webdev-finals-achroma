import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Achroma",
  description: "A minimal Next.js + React Three Fiber starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased bg-black text-white">
        <main className="h-full w-full">{children}</main>
      </body>
    </html>
  );
}
