"use client";

import { useEffect, useRef } from "react";
import { Conversation } from "@/types/chat";
import { MODEL_NAME } from "@/lib/api";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InputBar from "./InputBar";

interface Props {
  conversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  onSend: (content: string) => void;
  onNewChat: () => void;
}

const EXAMPLE_PROMPTS = [
  "Explain how neural networks learn in simple terms.",
  "Write a short poem about a rainy afternoon.",
  "What is the difference between a list and a tuple in Python?",
];

function EmptyState({ onSend }: { onSend: (content: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 dark:bg-teal-500/15 flex items-center justify-center mb-4">
        <span className="text-3xl">🤖</span>
      </div>
      <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
        Standalone Chat
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-xs">
        Powered by {MODEL_NAME} — a compact, open-source language
        model running locally on your machine.
      </p>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3 uppercase tracking-wide font-medium">
        Try asking
      </p>
      <div className="flex flex-col gap-2 w-full max-w-sm">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSend(prompt)}
            className="text-left text-sm px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 dark:hover:border-teal-600 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatWindow({
  conversation,
  isLoading,
  isStreaming,
  onSend,
  onNewChat,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, isLoading]);

  const hasMessages = (conversation?.messages.length ?? 0) > 0;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900">
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {conversation?.title ?? "New Chat"}
          </h1>
          {conversation && (
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {conversation.messages.length} message
              {conversation.messages.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <button
          onClick={onNewChat}
          title="New conversation"
          className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
        >
          + New
        </button>
      </div>

      {!hasMessages && !isLoading ? (
        <EmptyState onSend={onSend} />
      ) : (
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {conversation?.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      )}

      <InputBar onSend={onSend} disabled={isLoading || isStreaming} />
    </div>
  );
}
