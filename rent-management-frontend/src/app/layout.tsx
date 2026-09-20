import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Singh Rent House - Zero-Trust Identity Gateway",
  description: "Enterprise Zero-Trust Authentication and Member Management Portal for Singh Rent House",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
