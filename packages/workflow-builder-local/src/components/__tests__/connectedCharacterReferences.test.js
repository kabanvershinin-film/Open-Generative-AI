import test from "node:test";
import assert from "node:assert/strict";

import { collectConnectedCharacterReferences } from "../connectedCharacterReferences.js";

test("collectConnectedCharacterReferences finds direct and prompt-connected characters", () => {
  const nodes = [
    {
      id: "char-1",
      type: "characterNode",
      data: { formValues: { character_name: "Первый", face_asset: "asset://face-1", character_photo: "https://cdn.example.com/1.jpg" } },
    },
    {
      id: "char-2",
      type: "characterNode",
      data: { formValues: { character_name: "Второй", face_asset: "asset://face-2", character_photo: "https://cdn.example.com/2.jpg" } },
    },
    { id: "prompt-1", type: "seedancePromptNode", data: {} },
    { id: "video-1", type: "videoNode", data: {} },
  ];

  const edges = [
    { source: "char-1", target: "video-1" },
    { source: "char-2", target: "prompt-1" },
    { source: "prompt-1", target: "video-1" },
  ];

  const refs = collectConnectedCharacterReferences({ nodeId: "video-1", nodes, edges });

  assert.strictEqual(refs.length, 2);
  assert.deepStrictEqual(refs.map((ref) => ref.asset), ["asset://face-1", "asset://face-2"]);
});

test("collectConnectedCharacterReferences deduplicates the same character across multiple paths", () => {
  const nodes = [
    {
      id: "char-1",
      type: "characterNode",
      data: { formValues: { character_name: "Первый", face_asset: "asset://face-1", character_photo: "https://cdn.example.com/1.jpg" } },
    },
    { id: "prompt-1", type: "seedancePromptNode", data: {} },
    { id: "video-1", type: "videoNode", data: {} },
  ];

  const edges = [
    { source: "char-1", target: "video-1" },
    { source: "char-1", target: "prompt-1" },
    { source: "prompt-1", target: "video-1" },
  ];

  const refs = collectConnectedCharacterReferences({ nodeId: "video-1", nodes, edges });

  assert.strictEqual(refs.length, 1);
  assert.strictEqual(refs[0].asset, "asset://face-1");
});
