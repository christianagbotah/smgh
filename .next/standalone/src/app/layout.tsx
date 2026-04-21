import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import BrandThemeProvider from '@/components/BrandThemeProvider';
import { db } from '@/lib/db'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [seoTitle, seoDesc] = await Promise.all([
      db.siteSetting.findUnique({ where: { key: 'seo_title' } }),
      db.siteSetting.findUnique({ where: { key: 'seo_description' } }),
    ])
    
    const title = seoTitle?.value || "Sweet Mothers Ghana - Honouring & Supporting Mothers"
    const description = seoDesc?.value || "Sweet Mothers Ghana (SMGH) is a faith-based organization dedicated to honouring and supporting mothers, especially single mothers, widows, and the less privileged. Join our annual worship night programs."
    
    return {
      title,
      description,
      keywords: ["Sweet Mothers Ghana", "SMGH", "worship night", "mothers", "Ghana", "foundation", "single mothers", "widows", "donate", "gospel", "charity"],
      authors: [{ name: "Sweet Mothers Ghana", url: "https://sweetmothersgh.org" }],
      metadataBase: new URL("https://sweetmothersgh.org"),
      icons: {
        icon: "/favicon.png",
        apple: "/favicon.png",
      },
      openGraph: {
        title,
        description,
        type: "website",
        siteName: "Sweet Mothers Ghana",
        images: [{
          url: "/images/og-image.png",
          width: 1200,
          height: 630,
          alt: "Sweet Mothers Ghana",
        }],
      },
      twitter: {
        card: "summary_large_image",
        title: "Sweet Mothers Ghana",
        description,
        images: ["/images/og-image.png"],
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  } catch {
    return {
      title: "Sweet Mothers Ghana - Honouring & Supporting Mothers",
      description: "Sweet Mothers Ghana (SMGH) is a faith-based organization dedicated to honouring and supporting mothers.",
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <BrandThemeProvider>
          {children}
        </BrandThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
