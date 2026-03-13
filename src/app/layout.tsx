// Hello Khata - Root Layout
// হ্যালো খাতা - রুট লেআউট

import type { Metadata, Viewport } from "next";
import { Noto_Sans_Bengali, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/Providers";

// Bengali font for better Bangla text rendering
const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
});

// Inter as fallback English font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hello Khata - হ্যালো খাতা",
  description: "বাংলাদেশি এসএমই ব্যবসার জন্য সম্পূর্ণ ব্যবস্থাপনা সমাধান - Complete management solution for Bangladesh SME businesses",
  keywords: ["Hello Khata", "খাতা", "SME", "Bangladesh", "inventory", "sales", "accounting", "ব্যবসা", "হিসাব"],
  authors: [{ name: "Hello Khata Team" }],
  openGraph: {
    title: "Hello Khata - হ্যালো খাতা",
    description: "বাংলাদেশি এসএমই ব্যবসার জন্য সম্পূর্ণ ব্যবস্থাপনা সমাধান",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className="dark" suppressHydrationWarning>
      <body
        className={`${notoSansBengali.variable} ${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
