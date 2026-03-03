"use client";

import { useCallback, useEffect, useReducer } from "react";
import { createConversation, openaiClient } from "@/lib/api";
import type { Conversation, Message } from "@/types/chat";

export interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}

const STORAGE_KEY = "smolchat_conversations";

function loadFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Ignore storage errors
  }
}

export type Action =
  | { type: "LOAD"; conversations: Conversation[] }
  | { type: "NEW_CONV"; id: string }
  | { type: "SELECT_CONV"; id: string }
  | { type: "DELETE_CONV"; id: string }
  | { type: "APPEND_USER_MSG"; convId: string; msg: Message }
  | { type: "APPEND_ASSISTANT_MSG"; convId: string; msg: Message }
  | { type: "STREAM_TO_LAST_MSG"; convId: string; msgId: string; content: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_STREAMING"; value: boolean }
  | { type: "SET_ERROR"; error: string | null };

export function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "LOAD":
      return { ...state, conversations: action.conversations };

    case "NEW_CONV": {
      const conv: Conversation = {
        id: action.id,
        title: "New Chat",
        createdAt: new Date().toISOString(),
        messages: [],
      };
      return {
        ...state,
        conversations: [conv, ...state.conversations],
        activeId: action.id,
      };
    }

    case "SELECT_CONV":
      return { ...state, activeId: action.id };

    case "DELETE_CONV": {
      const filtered = state.conversations.filter((c) => c.id !== action.id);
      const nextActive =
        state.activeId === action.id
          ? filtered.length > 0
            ? filtered[0].id
            : null
          : state.activeId;
      return { ...state, conversations: filtered, activeId: nextActive };
    }

    case "APPEND_USER_MSG": {
      const updated = state.conversations.map((c) => {
        if (c.id !== action.convId) return c;
        // Set title from the first user message
        const isFirst = c.messages.length === 0;
        const title = isFirst
          ? action.msg.content.slice(0, 40) +
            (action.msg.content.length > 40 ? "…" : "")
          : c.title;
        return { ...c, title, messages: [...c.messages, action.msg] };
      });
      return { ...state, conversations: updated };
    }

    case "APPEND_ASSISTANT_MSG": {
      const updated = state.conversations.map((c) => {
        if (c.id !== action.convId) return c;
        return { ...c, messages: [...c.messages, action.msg] };
      });
      return { ...state, conversations: updated };
    }

    case "STREAM_TO_LAST_MSG": {
      const updated = state.conversations.map((c) => {
        if (c.id !== action.convId) return c;
        const messages = c.messages.map((m) =>
          m.id === action.msgId
            ? { ...m, content: m.content + action.content }
            : m
        );
        return { ...c, messages };
      });
      return { ...state, conversations: updated };
    }

    case "SET_LOADING":
      return { ...state, isLoading: action.value };

    case "SET_STREAMING":
      return { ...state, isStreaming: action.value };

    case "SET_ERROR":
      return { ...state, error: action.error };

    default:
      return state;
  }
}

export function useChat() {
  const [state, dispatch] = useReducer(reducer, {
    conversations: [],
    activeId: null,
    isLoading: false,
    isStreaming: false,
    error: null,
  });

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved.length > 0) {
      dispatch({ type: "LOAD", conversations: saved });
      dispatch({ type: "SELECT_CONV", id: saved[0].id });
    }
  }, []);

  useEffect(() => {
    saveToStorage(state.conversations);
  }, [state.conversations]);

  const activeConversation = state.conversations.find(
    (c) => c.id === state.activeId
  ) ?? null;

  const newConversation = useCallback(() => {
    const id = createConversation();
    dispatch({ type: "NEW_CONV", id });
  }, []);

  const selectConversation = useCallback((id: string) => {
    dispatch({ type: "SELECT_CONV", id });
  }, []);

  const deleteConv = useCallback(async (id: string) => {
    dispatch({ type: "DELETE_CONV", id });
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      let convId = state.activeId;

      if (!convId) {
        convId = createConversation();
        dispatch({ type: "NEW_CONV", id: convId });
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      dispatch({ type: "APPEND_USER_MSG", convId, msg: userMsg });
      dispatch({ type: "SET_LOADING", value: true });
      dispatch({ type: "SET_ERROR", error: null });

      const conv = state.conversations.find((c) => c.id === convId);
      const priorMessages = (conv?.messages ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      const allMessages = [
        ...priorMessages,
        { role: "user" as const, content: content.trim() },
      ];

      const assistantMsgId = crypto.randomUUID();

      try {
        const stream = await openaiClient.chat.completions.create({
          model: "smollm2",
          messages: allMessages,
          stream: true,
        });

        let firstToken = true;
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (!delta) continue;

          if (firstToken) {
            // Append the assistant message only when the first token arrives
            const assistantMsg: Message = {
              id: assistantMsgId,
              role: "assistant",
              content: delta,
              timestamp: new Date().toISOString(),
            };
            dispatch({ type: "APPEND_ASSISTANT_MSG", convId, msg: assistantMsg });
            dispatch({ type: "SET_LOADING", value: false });
            dispatch({ type: "SET_STREAMING", value: true });
            firstToken = false;
          } else {
            dispatch({
              type: "STREAM_TO_LAST_MSG",
              convId,
              msgId: assistantMsgId,
              content: delta,
            });
          }
        }
      } catch {
        dispatch({
          type: "SET_ERROR",
          error: "Failed to get a response. Please try again.",
        });
      } finally {
        dispatch({ type: "SET_LOADING", value: false });
        dispatch({ type: "SET_STREAMING", value: false });
      }
    },
    [state.activeId, state.conversations]
  );

  const dismissError = useCallback(() => {
    dispatch({ type: "SET_ERROR", error: null });
  }, []);

  return {
    conversations: state.conversations,
    activeConversation,
    isLoading: state.isLoading,
    isStreaming: state.isStreaming,
    error: state.error,
    newConversation,
    selectConversation,
    deleteConversation: deleteConv,
    sendMessage,
    dismissError,
  };
}
