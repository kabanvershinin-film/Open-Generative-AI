import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRestoredNode,
  getCategoryFromStoredNode,
  getModelIdFromStoredNode,
  getNodeTypeFromStoredNode,
  getWorkflowNodesList,
} from "../workflowNodeRestore.js";

test("getWorkflowNodesList читает и вложенный, и плоский формат узлов", () => {
  assert.deepStrictEqual(
    getWorkflowNodesList({ data: { nodes: [{ id: "text1" }] } }),
    [{ id: "text1" }],
  );

  assert.deepStrictEqual(
    getWorkflowNodesList({ nodes: [{ id: "image1" }] }),
    [{ id: "image1" }],
  );
});

test("buildRestoredNode восстанавливает legacy-ноду воркфлоу", () => {
  const restored = buildRestoredNode(
    {
      id: "image1",
      category: "image",
      model: "image-passthrough",
      position: { x: 120, y: 80 },
      input_params: { image_url: "https://cdn.example.com/image.png" },
      output_params: { outputs: [{ type: "image_url", value: "https://cdn.example.com/out.png" }] },
    },
    {
      workflowData: { run_history: {} },
      getModelObj: (category, modelId) => ({ id: modelId, name: `${category}:${modelId}` }),
    },
  );

  assert.deepStrictEqual(restored, {
    id: "image1",
    type: "imageNode",
    position: { x: 120, y: 80 },
    data: {
      nodeSchemas: undefined,
      modelId: "image-passthrough",
      selectedModel: { id: "image-passthrough", name: "image:image-passthrough" },
      outputs: [{ type: "image_url", value: "https://cdn.example.com/out.png" }],
      resultUrl: null,
      formValues: { image_url: "https://cdn.example.com/image.png" },
      outputHistory: [],
    },
  });
});

test("buildRestoredNode сохраняет runtime-данные builder-ноды", () => {
  const restored = buildRestoredNode(
    {
      id: "text7",
      type: "textNode",
      position: { x: 10, y: 20 },
      data: {
        modelId: "text-passthrough",
        selectedModel: { id: "text-passthrough", name: "Текст" },
        formValues: { prompt: "Привет" },
        outputs: [{ type: "text", value: "Готово" }],
        nodeSize: { width: 320, height: 400 },
      },
    },
    {
      workflowData: { run_history: {} },
    },
  );

  assert.strictEqual(restored.type, "textNode");
  assert.deepStrictEqual(restored.position, { x: 10, y: 20 });
  assert.deepStrictEqual(restored.data.formValues, { prompt: "Привет" });
  assert.deepStrictEqual(restored.data.outputs, [{ type: "text", value: "Готово" }]);
  assert.deepStrictEqual(restored.data.nodeSize, { width: 320, height: 400 });
  assert.deepStrictEqual(restored.data.selectedModel, { id: "text-passthrough", name: "Текст" });
});

test("хелперы корректно определяют категорию, тип и модель по builder-ноде", () => {
  const node = {
    type: "vidConcatNode",
    data: {},
  };

  assert.strictEqual(getCategoryFromStoredNode(node), "utility");
  assert.strictEqual(getNodeTypeFromStoredNode(node), "vidConcatNode");
  assert.strictEqual(getModelIdFromStoredNode(node), "video-combiner");
});
