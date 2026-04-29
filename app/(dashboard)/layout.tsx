import "@/app/platform.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { ReactNode } from "react";

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mra-platform">
      <Sidebar />
      <div className="p-main">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
