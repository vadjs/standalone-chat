import { describe, it, expect } from "vitest";
import { reducer, ChatState } from "@/hooks/useChat";
import { Conversation, Message } from "@/types/chat";

const emptyState: ChatState = {
  conversations: [],
  activeId: null,
  isLoading: false,
  isStreaming: false,
  error: null,
};

function makeConv(id: string, title = "Test"): Conversation {
  return { id, title, createdAt: "2024-01-01T00:00:00.000Z", messages: [] };
}

function makeMsg(id: string, role: "user" | "assistant", content: string): Message {
  return { id, role, content, timestamp: "2024-01-01T00:00:00.000Z" };
}

describe("chatReducer", () => {
  describe("LOAD", () => {
    it("replaces conversations list", () => {
      const convs = [makeConv("a"), makeConv("b")];
      const next = reducer(emptyState, { type: "LOAD", conversations: convs });
      expect(next.conversations).toEqual(convs);
    });
  });

  describe("NEW_CONV", () => {
    it("prepends a new conversation with 'New Chat' title", () => {
      const existing: ChatState = {
        ...emptyState,
        conversations: [makeConv("existing")],
      };
      const next = reducer(existing, { type: "NEW_CONV", id: "new-1" });
      expect(next.conversations[0].id).toBe("new-1");
      expect(next.conversations[0].title).toBe("New Chat");
      expect(next.conversations).toHaveLength(2);
    });

    it("sets activeId to the new conversation", () => {
      const next = reducer(emptyState, { type: "NEW_CONV", id: "conv-1" });
      expect(next.activeId).toBe("conv-1");
    });
  });

  describe("SELECT_CONV", () => {
    it("updates activeId", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a"), makeConv("b")],
        activeId: "a",
      };
      const next = reducer(state, { type: "SELECT_CONV", id: "b" });
      expect(next.activeId).toBe("b");
    });
  });

  describe("DELETE_CONV", () => {
    it("removes the conversation from the list", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a"), makeConv("b")],
        activeId: "b",
      };
      const next = reducer(state, { type: "DELETE_CONV", id: "a" });
      expect(next.conversations).toHaveLength(1);
      expect(next.conversations[0].id).toBe("b");
    });

    it("moves activeId to the next conversation when the active one is deleted", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a"), makeConv("b")],
        activeId: "a",
      };
      const next = reducer(state, { type: "DELETE_CONV", id: "a" });
      expect(next.activeId).toBe("b");
    });

    it("keeps activeId unchanged when a non-active conversation is deleted", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a"), makeConv("b")],
        activeId: "b",
      };
      const next = reducer(state, { type: "DELETE_CONV", id: "a" });
      expect(next.activeId).toBe("b");
    });

    it("sets activeId to null when the last conversation is deleted", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a")],
        activeId: "a",
      };
      const next = reducer(state, { type: "DELETE_CONV", id: "a" });
      expect(next.activeId).toBeNull();
    });
  });

  describe("APPEND_USER_MSG", () => {
    it("appends the message to the conversation", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a")],
      };
      const msg = makeMsg("m1", "user", "Hello");
      const next = reducer(state, { type: "APPEND_USER_MSG", convId: "a", msg });
      expect(next.conversations[0].messages).toHaveLength(1);
      expect(next.conversations[0].messages[0]).toEqual(msg);
    });

    it("sets the conversation title from the first message (max 40 chars)", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a", "New Chat")],
      };
      const longContent = "A".repeat(50);
      const msg = makeMsg("m1", "user", longContent);
      const next = reducer(state, { type: "APPEND_USER_MSG", convId: "a", msg });
      expect(next.conversations[0].title).toBe("A".repeat(40) + "…");
    });

    it("does not truncate the title for short first messages", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a", "New Chat")],
      };
      const msg = makeMsg("m1", "user", "Short message");
      const next = reducer(state, { type: "APPEND_USER_MSG", convId: "a", msg });
      expect(next.conversations[0].title).toBe("Short message");
    });

    it("does not update the title on subsequent messages", () => {
      const firstMsg = makeMsg("m0", "user", "Original title");
      const state: ChatState = {
        ...emptyState,
        conversations: [{ ...makeConv("a", "Original title"), messages: [firstMsg] }],
      };
      const msg = makeMsg("m1", "user", "Second message");
      const next = reducer(state, { type: "APPEND_USER_MSG", convId: "a", msg });
      expect(next.conversations[0].title).toBe("Original title");
    });
  });

  describe("APPEND_ASSISTANT_MSG", () => {
    it("appends the message to the conversation", () => {
      const state: ChatState = {
        ...emptyState,
        conversations: [makeConv("a")],
      };
      const msg = makeMsg("m1", "assistant", "I can help!");
      const next = reducer(state, {
        type: "APPEND_ASSISTANT_MSG",
        convId: "a",
        msg,
      });
      expect(next.conversations[0].messages).toHaveLength(1);
      expect(next.conversations[0].messages[0]).toEqual(msg);
    });
  });

  describe("SET_LOADING", () => {
    it("sets isLoading to true", () => {
      const next = reducer(emptyState, { type: "SET_LOADING", value: true });
      expect(next.isLoading).toBe(true);
    });

    it("sets isLoading to false", () => {
      const state = { ...emptyState, isLoading: true };
      const next = reducer(state, { type: "SET_LOADING", value: false });
      expect(next.isLoading).toBe(false);
    });
  });

  describe("STREAM_TO_LAST_MSG", () => {
    it("appends content to the matching message", () => {
      const msg = makeMsg("m1", "assistant", "Hello");
      const state: ChatState = {
        ...emptyState,
        conversations: [{ ...makeConv("a"), messages: [msg] }],
      };
      const next = reducer(state, {
        type: "STREAM_TO_LAST_MSG",
        convId: "a",
        msgId: "m1",
        content: " world",
      });
      expect(next.conversations[0].messages[0].content).toBe("Hello world");
    });

    it("does not modify other messages", () => {
      const m1 = makeMsg("m1", "user", "Hi");
      const m2 = makeMsg("m2", "assistant", "Hey");
      const state: ChatState = {
        ...emptyState,
        conversations: [{ ...makeConv("a"), messages: [m1, m2] }],
      };
      const next = reducer(state, {
        type: "STREAM_TO_LAST_MSG",
        convId: "a",
        msgId: "m2",
        content: "!",
      });
      expect(next.conversations[0].messages[0].content).toBe("Hi");
      expect(next.conversations[0].messages[1].content).toBe("Hey!");
    });
  });

  describe("SET_STREAMING", () => {
    it("sets isStreaming to true", () => {
      const next = reducer(emptyState, { type: "SET_STREAMING", value: true });
      expect(next.isStreaming).toBe(true);
    });

    it("sets isStreaming to false", () => {
      const state = { ...emptyState, isStreaming: true };
      const next = reducer(state, { type: "SET_STREAMING", value: false });
      expect(next.isStreaming).toBe(false);
    });
  });

  describe("SET_ERROR", () => {
    it("sets the error message", () => {
      const next = reducer(emptyState, {
        type: "SET_ERROR",
        error: "Something went wrong",
      });
      expect(next.error).toBe("Something went wrong");
    });

    it("clears the error when set to null", () => {
      const state = { ...emptyState, error: "old error" };
      const next = reducer(state, { type: "SET_ERROR", error: null });
      expect(next.error).toBeNull();
    });
  });
});
