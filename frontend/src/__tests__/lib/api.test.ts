import { describe, expect, it } from "vitest";
import { createConversation } from "@/lib/api";

describe("api", () => {
  describe("createConversation", () => {
    it("returns a valid UUID without calling the backend", () => {
      const id = createConversation();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("returns a different UUID on each call", () => {
      const a = createConversation();
      const b = createConversation();
      expect(a).not.toBe(b);
    });
  });
});
