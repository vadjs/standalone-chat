"use client";

import { Conversation } from "@/types/chat";
import { MODEL_NAME } from "@/lib/api";
import ConversationItem from "./ConversationItem";
import ThemeToggle from "./ThemeToggle";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function Sidebar({
  conversations,
  activeId,
  theme,
  onToggleTheme,
  onNewChat,
  onSelect,
  onDelete,
}: Props) {
  return (
    <aside className="flex flex-col w-64 shrink-0 h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-700/60">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-white text-xs font-black">
            S
          </span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            Standalone Chat
          </span>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors cursor-pointer"
        >
          <PlusIcon />
          New chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-6">
            No conversations yet
          </p>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              onSelect={() => onSelect(c.id)}
              onDelete={() => onDelete(c.id)}
            />
          ))
        )}
      </nav>

      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700/60">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center">
          Powered by {MODEL_NAME}
        </p>
      </div>
    </aside>
  );
}
