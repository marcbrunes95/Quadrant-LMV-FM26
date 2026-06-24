import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SlotCell } from "../SlotCell";
import type { Slot } from "@/lib/types";

const base: Slot = {
  id: 5, table: "FM", block: "B", time: "t", tag: null,
  color: "verd", col: "C", taken_by: null, taken_at: null,
};

describe("SlotCell", () => {
  it("free slot shows its number and calls onClaim when clicked", () => {
    const onClaim = vi.fn();
    render(<SlotCell slot={base} mine={false} onClaim={onClaim} onRelease={vi.fn()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(onClaim).toHaveBeenCalledWith(5);
  });

  it("slot taken by someone else (not mine) shows the name and does not release", () => {
    const onRelease = vi.fn();
    render(
      <SlotCell slot={{ ...base, taken_by: "Anna" }} mine={false} onClaim={vi.fn()} onRelease={onRelease} />,
    );
    expect(screen.getByText("Anna")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Anna"));
    expect(onRelease).not.toHaveBeenCalled();
  });

  it("slot that is mine (by ID) calls onRelease when clicked", () => {
    const onRelease = vi.fn();
    render(
      <SlotCell slot={{ ...base, taken_by: "Marc" }} mine={true} onClaim={vi.fn()} onRelease={onRelease} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onRelease).toHaveBeenCalledWith(5);
  });

  it("a namesake (same name, different ID) cannot release: mine=false", () => {
    const onRelease = vi.fn();
    render(
      <SlotCell slot={{ ...base, taken_by: "Alex" }} mine={false} onClaim={vi.fn()} onRelease={onRelease} />,
    );
    fireEvent.click(screen.getByText("Alex"));
    expect(onRelease).not.toHaveBeenCalled();
  });
});
