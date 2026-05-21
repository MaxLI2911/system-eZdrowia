import type { ReactNode } from "react";
import { Space_Grotesk } from "next/font/google";
import { RoleSwitcher } from "@/app/_components/RoleSwitcher";
import { SidebarNav } from "@/app/_components/SidebarNav";
import "@/app/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Hospital Admin",
  description: "Hospital data console",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pl">
      <body className={spaceGrotesk.variable}>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <span>Hospital</span>
              <h2>Admin Console</h2>
            </div>
            <SidebarNav />
          </aside>
          <div className="main">
            <header className="topbar">
              <div>
                <p className="topbar-title">Hospital Workspace</p>
                <span className="topbar-subtitle">
                  Operacje dzienne i obsluga pacjentow
                </span>
              </div>
              <RoleSwitcher />
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
