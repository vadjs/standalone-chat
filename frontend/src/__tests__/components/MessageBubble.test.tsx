import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MessageBubble from "@/components/MessageBubble";
import { Message } from "@/types/chat";

const userMsg: Message = {
  id: "msg-1",
  role: "user",
  content: "Hello, world!",
  timestamp: "2024-01-15T10:30:00.000Z",
};

const assistantMsg: Message = {
  id: "msg-2",
  role: "assistant",
  content: "Hi there!",
  timestamp: "2024-01-15T10:30:01.000Z",
};

describe("MessageBubble", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders user message content", () => {
    render(<MessageBubble message={userMsg} />);
    expect(screen.getByText("Hello, world!")).toBeDefined();
  });

  it("renders assistant message content", () => {
    render(<MessageBubble message={assistantMsg} />);
    expect(screen.getByText("Hi there!")).toBeDefined();
  });

  it('shows "You" avatar for user messages', () => {
    render(<MessageBubble message={userMsg} />);
    expect(screen.getByText("You")).toBeDefined();
  });

  it('shows "AI" avatar for assistant messages', () => {
    render(<MessageBubble message={assistantMsg} />);
    expect(screen.getByText("AI")).toBeDefined();
  });

  it("copies message content when copy button is clicked", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<MessageBubble message={userMsg} />);
    await user.click(screen.getByTitle("Copy message"));

    expect(writeText).toHaveBeenCalledWith("Hello, world!");
  });

  it("shows check icon immediately after copying", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    const { container } = render(<MessageBubble message={userMsg} />);
    await user.click(screen.getByTitle("Copy message"));

    // The copy icon is replaced by the check icon until the timeout fires.
    // The check icon contains a path with "M5 13l4 4L19 7"
    expect(container.querySelector('path[d="M5 13l4 4L19 7"]')).not.toBeNull();
  });
});
