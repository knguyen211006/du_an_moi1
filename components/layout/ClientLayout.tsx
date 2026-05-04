"use client";

import { usePathname } from "next/navigation";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <main
      className={`flex-1 ${isLoginPage ? "" : "container mx-auto p-4 md:p-6 lg:p-8"}`}
    >
      {children}
    </main>
  );
}

