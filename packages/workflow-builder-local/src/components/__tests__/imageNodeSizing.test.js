import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_IMAGE_NODE_SIZE,
  MAX_IMAGE_NODE_SIZE,
  MIN_IMAGE_NODE_SIZE,
  buildWorkflowNodeData,
  normalizeImageNodeSize,
} from "../imageNodeSizing.js";

test("normalizeImageNodeSize возвращает уменьшенный размер по умолчанию", () => {
  assert.deepStrictEqual(normalizeImageNodeSize(), DEFAULT_IMAGE_NODE_SIZE);
});

test("normalizeImageNodeSize ограничивает размер минимальными и максимальными значениями", () => {
  assert.deepStrictEqual(
    normalizeImageNodeSize({ width: 10, height: 9999 }),
    {
      width: MIN_IMAGE_NODE_SIZE.width,
      height: MAX_IMAGE_NODE_SIZE.height,
    },
  );
});

test("normalizeImageNodeSize выравнивает старый большой размер к единому размеру ноды", () => {
  assert.deepStrictEqual(
    normalizeImageNodeSize({ width: 720, height: 920 }),
    DEFAULT_IMAGE_NODE_SIZE,
  );
});

test("buildWorkflowNodeData добавляет размер только для фото-ноды", () => {
  assert.deepStrictEqual(
    buildWorkflowNodeData("imageNode", { foo: 1 }),
    {
      foo: 1,
      nodeSize: DEFAULT_IMAGE_NODE_SIZE,
    },
  );

  assert.deepStrictEqual(
    buildWorkflowNodeData("textNode", { foo: 1 }),
    { foo: 1 },
  );
});
