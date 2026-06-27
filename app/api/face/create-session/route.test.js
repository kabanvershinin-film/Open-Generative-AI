import test from "node:test";
import assert from "node:assert/strict";

import { pickFaceVerificationLink } from "./logic.js";

test("pickFaceVerificationLink предпочитает короткую ссылку из ответа Volcano", () => {
  assert.strictEqual(
    pickFaceVerificationLink({
      H5Link: "https://example.com/long",
      ShortUrl: "https://example.com/short",
    }),
    "https://example.com/short",
  );
});

test("pickFaceVerificationLink использует H5Link как fallback", () => {
  assert.strictEqual(
    pickFaceVerificationLink({
      H5Link: "https://example.com/long",
    }),
    "https://example.com/long",
  );
});
