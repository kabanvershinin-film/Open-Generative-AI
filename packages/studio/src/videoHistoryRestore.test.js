import test from "node:test";
import assert from "node:assert/strict";

import {
  buildVideoHistoryRestoreState,
  getVideoHistoryRestoreState,
} from "./videoHistoryRestore.js";

test("buildVideoHistoryRestoreState сохраняет все использованные референсы без незавершённых загрузок", () => {
  const state = buildVideoHistoryRestoreState({
    prompt: "кот смотрит кино",
    selectedModel: "seedance-2.0-mini-t2v",
    imageMode: false,
    v2vMode: false,
    selectedAr: "16:9",
    selectedDuration: 5,
    selectedResolution: "720p",
    uploadedImageUrl: "https://cdn.example.com/image.png",
    uploadedEndImageUrl: "https://cdn.example.com/end.png",
    uploadedVideoUrl: "https://cdn.example.com/ref.mp4",
    uploadedVideoName: "ref.mp4",
    uploadedAudioUrl: "https://cdn.example.com/sound.mp3",
    uploadedAudioName: "sound.mp3",
    refFiles: [
      { id: "img-1", url: "https://cdn.example.com/ref-image.png", kind: "image", name: "ref-image.png", uploading: false },
      { id: "video-1", url: "https://cdn.example.com/ref-video.mp4", kind: "video", name: "ref-video.mp4", uploading: false },
      { id: "pending", url: null, kind: "audio", name: "pending.mp3", uploading: true },
    ],
    faceAsset: { uri: "asset://face-1", name: "Лицо 1", thumbnail: "https://cdn.example.com/face.jpg" },
    seed: 42,
    returnLastFrame: true,
  });

  assert.strictEqual(state.prompt, "кот смотрит кино");
  assert.strictEqual(state.selectedModel, "seedance-2.0-mini-t2v");
  assert.strictEqual(state.uploadedImageUrl, "https://cdn.example.com/image.png");
  assert.strictEqual(state.uploadedEndImageUrl, "https://cdn.example.com/end.png");
  assert.strictEqual(state.uploadedVideoUrl, "https://cdn.example.com/ref.mp4");
  assert.strictEqual(state.uploadedAudioUrl, "https://cdn.example.com/sound.mp3");
  assert.strictEqual(state.seed, 42);
  assert.strictEqual(state.returnLastFrame, true);
  assert.deepStrictEqual(state.refFiles.map((file) => file.id), ["img-1", "video-1"]);
  assert.deepStrictEqual(state.faceAsset, {
    uri: "asset://face-1",
    name: "Лицо 1",
    thumbnail: "https://cdn.example.com/face.jpg",
    status: "",
  });
});

test("getVideoHistoryRestoreState берёт сохранённый снимок и fallback из записи истории", () => {
  const state = getVideoHistoryRestoreState({
    model: "seedance-2.0-fast-t2v",
    prompt: "старый промпт",
    aspect_ratio: "9:16",
    duration: 8,
    resolution: "480p",
    seed: 7,
    last_frame_url: "https://cdn.example.com/fallback-last-frame.png",
    restoreState: {
      prompt: "новый промпт",
      selectedModel: "seedance-2.0-mini-t2v",
      selectedAr: "16:9",
      uploadedVideoUrl: "https://cdn.example.com/reference.mp4",
      refFiles: [
        { url: "https://cdn.example.com/reference-image.png", kind: "image" },
      ],
      returnLastFrame: true,
    },
  });

  assert.strictEqual(state.prompt, "новый промпт");
  assert.strictEqual(state.selectedModel, "seedance-2.0-mini-t2v");
  assert.strictEqual(state.selectedAr, "16:9");
  assert.strictEqual(state.uploadedVideoUrl, "https://cdn.example.com/reference.mp4");
  assert.strictEqual(state.uploadedEndImageUrl, "https://cdn.example.com/fallback-last-frame.png");
  assert.strictEqual(state.seed, 7);
  assert.strictEqual(state.returnLastFrame, true);
  assert.deepStrictEqual(state.refFiles, [
    {
      id: "restored_0",
      url: "https://cdn.example.com/reference-image.png",
      kind: "image",
      name: "reference-image.png",
      uploading: false,
      progress: 100,
    },
  ]);
});
