import type {Metadata} from 'next';
import './globals.css';

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
      <body className="font-sans text-gray-900 bg-gray-950 antialiased overflow-x-hidden">
        <main className="min-h-screen bg-background relative shadow-2xl">
          {children}
        </main>
      </body>
    </html>
  );
}
