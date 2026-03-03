"use client";

import { useState } from "react";
import { Message } from "@/types/chat";

interface Props {
  message: Message;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={`group flex items-end gap-3 px-4 py-2 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${
          isUser ? "bg-indigo-500" : "bg-teal-500"
        }`}
      >
        {isUser ? "You" : "AI"}
      </div>

      {/* Bubble */}
      <div className="relative max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? "bg-indigo-500 text-white rounded-br-sm"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm"
          }`}
        >
          {message.content}
        </div>

        {/* Timestamp + copy button — visible on hover */}
        <div
          className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 select-none">
            {formatTime(message.timestamp)}
          </span>
          <button
            onClick={handleCopy}
            title="Copy message"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}
