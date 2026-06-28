import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES,
  optimizeWorkflowImageUploadFile,
  validateWorkflowImageUploadFile,
} from "../imageUploadOptimization.js";

function createFile(name, type, size) {
  return { name, type, size };
}

test("validateWorkflowImageUploadFile принимает корректное изображение", () => {
  assert.strictEqual(
    validateWorkflowImageUploadFile(createFile("cat.png", "image/png", 1024)),
    true,
  );
});

test("validateWorkflowImageUploadFile отклоняет не-изображения и слишком большие файлы", () => {
  assert.throws(
    () => validateWorkflowImageUploadFile(createFile("clip.mp4", "video/mp4", 1024)),
    /изображения/,
  );
  assert.throws(
    () => validateWorkflowImageUploadFile(createFile("huge.png", "image/png", MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES + 1)),
    /50 МБ/,
  );
});

test("optimizeWorkflowImageUploadFile не трогает маленькие изображения", async () => {
  const file = createFile("small.png", "image/png", 256 * 1024);
  const result = await optimizeWorkflowImageUploadFile(file);
  assert.strictEqual(result, file);
});

test("optimizeWorkflowImageUploadFile сжимает большие изображения в браузерном рантайме", async () => {
  const file = createFile("large.png", "image/png", 6 * 1024 * 1024);
  class FakeFileReader {
    readAsDataURL() {
      this.onload?.({ target: { result: "data:image/png;base64,abc" } });
    }
  }
  class FakeImage {
    constructor() {
      this.width = 3200;
      this.height = 2400;
    }
    set src(_value) {
      this.onload?.();
    }
  }
  class FakeFile {
    constructor(parts, name, options = {}) {
      this.parts = parts;
      this.name = name;
      this.type = options.type || "image/jpeg";
      this.size = parts[0]?.size || 0;
    }
  }
  const runtime = {
    FileReader: FakeFileReader,
    Image: FakeImage,
    File: FakeFile,
    document: {
      createElement(tag) {
        assert.strictEqual(tag, "canvas");
        return {
          width: 0,
          height: 0,
          getContext() {
            return { drawImage() {} };
          },
          toBlob(callback, type, quality) {
            callback({
              size: quality < 0.8 ? 900 * 1024 : 2.2 * 1024 * 1024,
              type,
            });
          },
        };
      },
    },
  };

  const result = await optimizeWorkflowImageUploadFile(file, {}, runtime);
  assert.notStrictEqual(result, file);
  assert.strictEqual(result.name, "large.jpg");
  assert.strictEqual(result.type, "image/jpeg");
  assert.ok(result.size < file.size);
});
