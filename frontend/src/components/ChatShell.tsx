"use client";

import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function ChatShell() {
  const {
    conversations,
    activeConversation,
    isLoading,
    isStreaming,
    error,
    newConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    dismissError,
  } = useChat();

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(dismissError, 5000);
    return () => clearTimeout(timer);
  }, [error, dismissError]);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950">
      {error && (
        <div
          role="alert"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-red-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg"
        >
          <span>{error}</span>
          <button
            onClick={dismissError}
            className="font-bold text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <Sidebar
        conversations={conversations}
        activeId={activeConversation?.id ?? null}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNewChat={newConversation}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />

      <ChatWindow
        conversation={activeConversation}
        isLoading={isLoading}
        isStreaming={isStreaming}
        onSend={sendMessage}
        onNewChat={newConversation}
      />
    </div>
  );
}
