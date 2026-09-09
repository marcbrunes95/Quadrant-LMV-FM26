import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Countdown } from "../Countdown";

describe("Countdown", () => {
  it("mostra el temps que falta si la data és futura", () => {
    render(<Countdown target="2099-01-01T00:00:00+01:00" />);
    expect(screen.getByText(/Falten \d+ dies/)).toBeInTheDocument();
  });

  it("no dibuixa res si la data ja ha passat", () => {
    const { container } = render(<Countdown target="2020-01-01T00:00:00+01:00" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("no dibuixa res si la data no és vàlida", () => {
    const { container } = render(<Countdown target="qualsevol cosa" />);
    expect(container).toBeEmptyDOMElement();
  });
});
