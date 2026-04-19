import type {Metadata} from 'next';
import { Inter } from "next/font/google";
import './globals.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "自驾路 | 探索中心",
  description: "中国公路旅行探索中心",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-900`}>
        <main className="max-w-[480px] mx-auto min-h-screen bg-background relative overflow-hidden shadow-2xl">
          {children}
        </main>
      </body>
    </html>
  );
}
