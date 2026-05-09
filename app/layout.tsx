import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Apex Training Log",
  description: "Your personal training cycle tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-bg text-white min-h-screen antialiased">
        <div className="max-w-[480px] mx-auto min-h-screen flex flex-col">
          {children}
          <BottomNav />
        </div>
        {/* Bottom padding so content isn't hidden behind the nav bar */}
        <style>{`
          body { padding-bottom: env(safe-area-inset-bottom); }
        `}</style>
      </body>
    </html>
  );
}