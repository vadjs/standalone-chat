import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

function setupMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to dark when system prefers dark", () => {
    setupMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("defaults to light when system prefers light", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("uses stored theme from localStorage even when system preference differs", () => {
    localStorage.setItem("theme", "dark");
    setupMatchMedia(false); // system says light
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme switches from light to dark", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme switches from dark to light", () => {
    localStorage.setItem("theme", "dark");
    setupMatchMedia(true);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe("light");
  });

  it("toggleTheme persists the new theme to localStorage", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("toggleTheme adds dark class to document when switching to dark", () => {
    setupMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggleTheme removes dark class from document when switching to light", () => {
    localStorage.setItem("theme", "dark");
    setupMatchMedia(true);
    document.documentElement.classList.add("dark");
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
