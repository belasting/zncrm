import "./globals.css";
import type { Metadata } from "next";
import TopLogo from "@/components/nav/TopLogo";
import BottomNav from "@/components/nav/BottomNav";
import NotificationInitializer from "@/components/NotificationInitializer"; // Ensure this file exists
// If the file does not exist, create it or correct the path.

export const metadata = {
  title: "zncustom CRM",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        <NotificationInitializer />
        <TopLogo />
        <main className="max-w-md mx-auto pt-14 pb-20">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}