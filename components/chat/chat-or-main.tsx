"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ChatShell } from "@/components/chat/shell";
import { ActiveChatProvider } from "@/hooks/use-active-chat";

export function ChatOrMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/roadmap")) {
    return children;
  }

  return (
    <ActiveChatProvider>
      <ChatShell />
      {children}
    </ActiveChatProvider>
  );
}
