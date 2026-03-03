"use client";

import { KeyboardEvent, useRef } from "react";
import { MODEL_NAME } from "@/lib/api";

interface Props {
  onSend: (content: string) => void;
  disabled: boolean;
}

function SendIcon({ spinning }: { spinning: boolean }) {
  if (spinning) {
    return (
      <svg
        className="w-5 h-5 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

export default function InputBar({ onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  function submit() {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value.trim();
    if (!value || disabled) return;
    onSend(value);
    el.value = "";
    el.style.height = "auto";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3">
      <div className="flex items-end gap-3 max-w-3xl mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2 ring-1 ring-transparent focus-within:ring-teal-500 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Message Standalone Chat… (Shift+Enter for new line)"
          disabled={disabled}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none leading-relaxed py-1 max-h-[140px] disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={disabled}
          title="Send message"
          className="mb-1 shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
        >
          <SendIcon spinning={disabled} />
        </button>
      </div>
      <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-600 mt-1.5">
        {MODEL_NAME} · Responses may be inaccurate
      </p>
    </div>
  );
}
