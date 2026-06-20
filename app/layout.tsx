import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

// Configure fonts with proper options
const geist = Geist({
  subsets: ["latin"],
  variable: '--font-geist',
  display: 'swap',
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono',
  display: 'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://moshradix.dev'),
  title: {
    default: "MOSHRADIX — Mohamed Shamil's Digital Workshop",
    template: "%s | MOSHRADIX",
  },
  description:
    "Random ideas, tools, and tinkering from the Maldivian isles. Open-source experiments, home-automation builds, and offline-first software by Mohamed Shamil.",
  keywords: ["Electron", "Home Assistant", "Offline-first Software", "Node.js", "Dhivehi i18n", "Dart", "Open Source", "Maldives", "Government Tech", "Self-hosting"],
  authors: [{ name: "Mohamed Shamil", url: "https://github.com/MoshRadix" }],
  creator: "Mohamed Shamil",
  publisher: "Mohamed Shamil",
  generator: "v0.app",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "MOSHRADIX — Mohamed Shamil's Digital Workshop",
    description: "Random ideas, tools, and tinkering from the Maldivian isles. Open-source experiments, home-automation builds, and offline-first software.",
    siteName: "MOSHRADIX",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MOSHRADIX — Mohamed Shamil's Digital Workshop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MOSHRADIX — Mohamed Shamil's Digital Workshop",
    description: "Random ideas, tools, and tinkering from the Maldivian isles.",
    creator: "@MoshRadix",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true} storageKey="theme-mode">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
