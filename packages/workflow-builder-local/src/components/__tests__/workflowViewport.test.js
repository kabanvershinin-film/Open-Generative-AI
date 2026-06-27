import test from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_FIT_MIN_ZOOM,
  WORKFLOW_MAX_VIEWPORT_HEIGHT,
  WORKFLOW_MAX_VIEWPORT_WIDTH,
  normalizeWorkflowNodePositions,
} from "../workflowViewport.js";

test("normalizeWorkflowNodePositions сдвигает и ужимает старый граф в видимую область", () => {
  const nodes = [
    { id: "a", position: { x: -11011.4, y: -2188.6 } },
    { id: "b", position: { x: -50, y: 25 } },
  ];

  const normalized = normalizeWorkflowNodePositions(nodes);

  assert.deepStrictEqual(normalized[0], { id: "a", position: { x: 120, y: 120 } });
  assert.ok(normalized[1].position.x <= 120 + WORKFLOW_MAX_VIEWPORT_WIDTH);
  assert.ok(normalized[1].position.y <= 120 + WORKFLOW_MAX_VIEWPORT_HEIGHT);
});

test("normalizeWorkflowNodePositions не трогает уже нормальные координаты", () => {
  const nodes = [
    { id: "a", position: { x: 300, y: 150 } },
    { id: "b", position: { x: 640, y: 400 } },
  ];

  assert.strictEqual(normalizeWorkflowNodePositions(nodes), nodes);
  assert.strictEqual(WORKFLOW_FIT_MIN_ZOOM, 0.08);
});

test("normalizeWorkflowNodePositions ужимает слишком широкий граф", () => {
  const nodes = [
    { id: "a", position: { x: 0, y: 0 } },
    { id: "b", position: { x: 10000, y: 500 } },
  ];

  const normalized = normalizeWorkflowNodePositions(nodes);
  const width = normalized[1].position.x - normalized[0].position.x;

  assert.ok(width <= WORKFLOW_MAX_VIEWPORT_WIDTH);
  assert.strictEqual(normalized[0].position.x, 120);
});
