import { computeBlurIndices } from "../helpers/searchUtils.js";
import assert from "node:assert/strict";
import { test } from "node:test";

test("computeBlurIndices returns ~40% unique indices deterministically", () => {
  const n = 50;
  const ratio = 0.4;
  const seed = "query:test@example.com";
  const set1 = computeBlurIndices(n, ratio, seed);
  const set2 = computeBlurIndices(n, ratio, seed);
  assert.equal(set1.size, Math.round(n * ratio));
  assert.equal(set2.size, Math.round(n * ratio));
  assert.deepEqual([...set1].sort((a,b)=>a-b), [...set2].sort((a,b)=>a-b));
  for (const idx of set1) {
    assert.ok(idx >= 0 && idx < n);
  }
});

test("computeBlurIndices ratio clamps to bounds", () => {
  const n = 10;
  const setLow = computeBlurIndices(n, -1, "a");
  const setHigh = computeBlurIndices(n, 10, "b");
  assert.equal(setLow.size, 0);
  assert.equal(setHigh.size, n);
});
