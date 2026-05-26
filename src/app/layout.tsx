import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeSync } from "@/components/theme-sync"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "DataFlow - Gestión de Datos Personal",
  description: "Gestiona tus proyectos, tablas y datos desde un solo lugar. Una aplicación de gestión de datos personal tipo Airtable.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('dataflow-storage');if(t){var p=JSON.parse(t);if(p&&p.state&&p.state.theme==='dark'){document.documentElement.classList.add('dark')}}}catch(e){}})()` }} />
        <ThemeSync />
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
