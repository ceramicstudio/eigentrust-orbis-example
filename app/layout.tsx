import "./globals.css"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { NextFont } from "next/dist/compiled/@next/font"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import React from "react"

import { Web3ModalProvider } from "../context/Web3ModalProvider"
import StoreProvider from "@/context/StoreProvider"

const inter: NextFont = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Hive Network - Agent UI",
  description: "UI for Hive Agents",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3ModalProvider>
          <StoreProvider>{children}</StoreProvider>
        </Web3ModalProvider>
        <ToastContainer />
      </body>
    </html>
  )
}
