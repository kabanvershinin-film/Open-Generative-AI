import test from "node:test";
import assert from "node:assert/strict";

import { resolveVideoHistoryFetchFailure } from "./videoHistoryFetchState.js";

test("resolveVideoHistoryFetchFailure показывает ошибку для первой загрузки истории", () => {
  const result = resolveVideoHistoryFetchFailure({
    reset: true,
    existingEntriesCount: 0,
    error: new Error("Gallery 401"),
  });

  assert.deepStrictEqual(result, {
    remoteHistoryError: "Gallery 401",
  });
});

test("resolveVideoHistoryFetchFailure скрывает ошибку для догрузки уже видимой истории", () => {
  const result = resolveVideoHistoryFetchFailure({
    reset: false,
    existingEntriesCount: 12,
    error: new Error("Gallery 500"),
  });

  assert.deepStrictEqual(result, {
    remoteHistoryError: null,
  });
});
