import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "经济补偿金计算器 - N+1在线计算",
  description: "在线计算N+1、2N等多种情况下的劳动合同解除经济补偿金。简单输入工龄和月薪，快速获取补偿金额。",
  verification: {
    google: "OnqNRFhSS5WrC5qPqyqZcBBkbMODuHVWoMxD3KGOIog",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
