'use client';

import { Toaster } from "@/components/ui/sonner"
import { Inter } from "next/font/google";
import {
  WalletProvider,
  SuietWallet,
  SuiWallet,
} from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <WalletProvider defaultWallets={[
          SuietWallet,
          SuiWallet,
        ]}>{children}</WalletProvider>
        <Toaster />
      </body>
    </html>
  );
}