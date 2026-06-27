import test from "node:test";
import assert from "node:assert/strict";

import {
  EXTEND_VIDEO_NAME,
  buildSeedanceExtendSession,
  getSeedanceExtendTargetModel,
} from "./seedanceExtend.js";

test("getSeedanceExtendTargetModel переводит все Seedance 2.0 семейства в t2v-режим продления", () => {
  assert.equal(getSeedanceExtendTargetModel("seedance-2.0-t2v"), "seedance-2.0-t2v");
  assert.equal(getSeedanceExtendTargetModel("seedance-2.0-i2v"), "seedance-2.0-t2v");
  assert.equal(getSeedanceExtendTargetModel("seedance-2.0-mini-i2v"), "seedance-2.0-mini-t2v");
  assert.equal(getSeedanceExtendTargetModel("seedance-2.0-fast-i2v"), "seedance-2.0-fast-t2v");
  assert.equal(getSeedanceExtendTargetModel("doubao-seedance-2-0-260128"), "seedance-2.0-t2v");
  assert.equal(getSeedanceExtendTargetModel("doubao-seedance-2-0-mini-260615"), "seedance-2.0-mini-t2v");
  assert.equal(getSeedanceExtendTargetModel("doubao-seedance-2-0-fast-260128"), "seedance-2.0-fast-t2v");
});

test("buildSeedanceExtendSession готовит продление по исходному video_url", () => {
  const session = buildSeedanceExtendSession({
    model: "seedance-2.0-mini-i2v",
    url: "https://cdn.example.com/source.mp4",
  });

  assert.deepStrictEqual(session, {
    ready: true,
    modelId: "seedance-2.0-mini-t2v",
    modelName: "Seedance 2.0 Mini",
    videoUrl: "https://cdn.example.com/source.mp4",
    videoName: EXTEND_VIDEO_NAME,
  });
});

test("buildSeedanceExtendSession отклоняет неподходящую запись истории", () => {
  const session = buildSeedanceExtendSession({
    model: "kling-v1",
    url: "",
  });

  assert.deepStrictEqual(session, {
    ready: false,
    modelId: "",
    modelName: "Seedance 2.0",
    videoUrl: null,
    videoName: null,
  });
});
