import test from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_FIT_MIN_ZOOM,
  normalizeWorkflowNodePositions,
} from "../workflowViewport.js";

test("normalizeWorkflowNodePositions сдвигает граф в видимую область", () => {
  const nodes = [
    { id: "a", position: { x: -11011.4, y: -2188.6 } },
    { id: "b", position: { x: -50, y: 25 } },
  ];

  const normalized = normalizeWorkflowNodePositions(nodes);

  assert.deepStrictEqual(normalized, [
    { id: "a", position: { x: 120, y: 120 } },
    { id: "b", position: { x: 11081.4, y: 2333.6 } },
  ]);
});

test("normalizeWorkflowNodePositions не трогает уже нормальные координаты", () => {
  const nodes = [
    { id: "a", position: { x: 300, y: 150 } },
    { id: "b", position: { x: 640, y: 400 } },
  ];

  assert.strictEqual(normalizeWorkflowNodePositions(nodes), nodes);
  assert.strictEqual(WORKFLOW_FIT_MIN_ZOOM, 0.02);
});
