import test from "node:test";
import assert from "node:assert/strict";

import { generateQR } from "../components/qrcode-gen.js";

test("generateQR кодирует длинную ссылку верификации через версии выше 20", () => {
  const longUrl = `https://verify.example.com/session/${"a".repeat(1400)}`;
  const result = generateQR(longUrl);

  assert.ok(result.size > 97);
  assert.ok(Array.isArray(result.modules));
  assert.strictEqual(result.modules.length, result.size);
  assert.strictEqual(result.modules[0].length, result.size);
});

test("generateQR всё ещё отклоняет данные сверх лимита QR версии 40", () => {
  const tooLong = `https://verify.example.com/session/${"b".repeat(5000)}`;

  assert.throws(() => generateQR(tooLong), /Текст слишком длинный для QR/);
});
