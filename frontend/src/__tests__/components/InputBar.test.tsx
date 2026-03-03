import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InputBar from "@/components/InputBar";

describe("InputBar", () => {
  it("calls onSend with trimmed content when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Message Standalone Chat/);
    await user.type(textarea, "Hello{Enter}");

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("does not call onSend when Shift+Enter is pressed", () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Message Standalone Chat/);
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onSend when the send button is clicked", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Message Standalone Chat/);
    await user.type(textarea, "Hello");
    await user.click(screen.getByTitle("Send message"));

    expect(onSend).toHaveBeenCalledWith("Hello");
  });

  it("does not call onSend for whitespace-only input", () => {
    const onSend = vi.fn();
    render(<InputBar onSend={onSend} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Message Standalone Chat/);
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables the textarea and button when disabled prop is true", () => {
    render(<InputBar onSend={vi.fn()} disabled={true} />);

    expect(screen.getByPlaceholderText(/Message Standalone Chat/)).toBeDisabled();
    expect(screen.getByTitle("Send message")).toBeDisabled();
  });

  it("clears the textarea after a successful send", async () => {
    const user = userEvent.setup();
    render(<InputBar onSend={vi.fn()} disabled={false} />);

    const textarea = screen.getByPlaceholderText(
      /Message Standalone Chat/
    ) as HTMLTextAreaElement;
    await user.type(textarea, "Hello{Enter}");

    expect(textarea.value).toBe("");
  });
});
