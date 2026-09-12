import type { Metadata } from "next";
<<<<<<< HEAD
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
=======
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
>>>>>>> ef6c2ef48e940b95ef3432baf1cc3d8c24b60bbb
  subsets: ["latin"],
});

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "Sutura",
  description: "Tailoring shop operations dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable} h-full antialiased`}
=======
  title: "SUTURA",
  description: "A Digital Framework for Tailoring Businesses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
>>>>>>> ef6c2ef48e940b95ef3432baf1cc3d8c24b60bbb
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
