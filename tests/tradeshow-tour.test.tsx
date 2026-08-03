import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TradeshowTour, type TradeshowStep } from "../app/components/TradeshowTour";

const noop = () => {};

test("renders the tradeshow launcher and safe replay promise", () => {
  const html = renderToStaticMarkup(
    <TradeshowTour active={false} step={0} onStart={noop} onNext={noop} onExit={noop} onRestart={noop} />,
  );
  assert.match(html, /Start guided demo/);
  assert.match(html, /3 minute safe replay/);
});

test("renders all six guided workflow steps", () => {
  const expected = [
    "Read the farm in one glance",
    "See where the signal came from",
    "The model proposes. Policy decides",
    "Make the accountable decision",
    "Verify where automation stops",
    "Close the loop with evidence",
  ];

  expected.forEach((title, index) => {
    const html = renderToStaticMarkup(
      <TradeshowTour active step={index as TradeshowStep} onStart={noop} onNext={noop} onExit={noop} onRestart={noop} />,
    );
    assert.match(html, new RegExp(title.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /No data writes/);
    assert.match(html, new RegExp(`${index + 1} of 6`));
  });
});
