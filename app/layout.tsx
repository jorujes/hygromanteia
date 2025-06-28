import type React from "react"
import type { Metadata } from "next"
import { Benne } from "next/font/google"
import "./globals.css"

const benne = Benne({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-benne",
})

export const metadata: Metadata = {
  title: "Hygromanteia",
  description: "Ferramenta Mágica Digital - Horas Planetárias",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${benne.className} antialiased`}>{children}</body>
    </html>
  )
}
