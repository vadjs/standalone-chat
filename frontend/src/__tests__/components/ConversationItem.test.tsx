import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConversationItem from "@/components/ConversationItem";
import { Conversation } from "@/types/chat";

const conversation: Conversation = {
  id: "conv-1",
  title: "Test Conversation",
  createdAt: new Date().toISOString(), // today
  messages: [],
};

describe("ConversationItem", () => {
  it("renders the conversation title", () => {
    render(
      <ConversationItem
        conversation={conversation}
        isActive={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Test Conversation")).toBeDefined();
  });

  it('shows "Today" for conversations created today', () => {
    render(
      <ConversationItem
        conversation={conversation}
        isActive={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Today")).toBeDefined();
  });

  it('shows "Yesterday" for conversations created yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    render(
      <ConversationItem
        conversation={{ ...conversation, createdAt: yesterday.toISOString() }}
        isActive={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText("Yesterday")).toBeDefined();
  });

  it("calls onSelect when the item is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ConversationItem
        conversation={conversation}
        isActive={false}
        onSelect={onSelect}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByText("Test Conversation"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete and not onSelect when the delete button is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    render(
      <ConversationItem
        conversation={conversation}
        isActive={false}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByTitle("Delete conversation"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("applies active styles when isActive is true", () => {
    const { container } = render(
      <ConversationItem
        conversation={conversation}
        isActive={true}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const item = container.firstChild as HTMLElement;
    expect(item.className).toContain("bg-teal-500");
  });

  it("does not apply active styles when isActive is false", () => {
    const { container } = render(
      <ConversationItem
        conversation={conversation}
        isActive={false}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const item = container.firstChild as HTMLElement;
    expect(item.className).not.toContain("bg-teal-500");
  });
});
