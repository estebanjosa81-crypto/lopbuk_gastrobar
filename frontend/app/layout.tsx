import React from "react"
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { GoogleOAuthWrapper } from '@/components/google-oauth-wrapper'
import { DynamicFavicon } from '@/components/dynamic-favicon'
import { PlatformThemeLoader } from '@/components/platform-theme-loader'
import './globals.css'

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const BRAND_ISOTIPO = '/daimuz-isotipo.png'
const BRAND_ICON = '/daimuz-icon.png'
// Favicon: variante con esquinas transparentes (sin recuadro blanco en la pestaña).
const BRAND_FAVICON = '/daimuz-icon-transparent.png'

export const metadata: Metadata = {
  title: 'DAIMUZ - !Bienvenido al epicentro digital de colombia!',
  description: 'Sistema completo de gestión de inventario para tiendas',
  generator: 'v0.app',
  manifest: '/manifest.json',
  applicationName: 'DAIMUZ',
  icons: {
    icon: BRAND_FAVICON,
    shortcut: BRAND_FAVICON,
    apple: BRAND_ICON,
  },
  openGraph: {
    title: 'DAIMUZ — Epicentro digital de Colombia',
    description: 'Plataforma de comercios, catálogo y gestión.',
    type: 'website',
    images: [{ url: BRAND_ICON, width: 512, height: 512, alt: 'DAIMUZ' }],
  },
  twitter: {
    card: 'summary',
    title: 'DAIMUZ',
    description: 'Plataforma de comercios, catálogo y gestión.',
    images: [BRAND_ICON],
  },
}

export const viewport = {
  themeColor: '#00833E',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <DynamicFavicon />
          <PlatformThemeLoader />
          <GoogleOAuthWrapper>
            {children}
          </GoogleOAuthWrapper>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  )
}
