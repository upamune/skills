import { describe, test } from "bun:test";
import assert from "node:assert/strict";
import { cloneRequestForRef } from "./lib";

const PIN = "4dd968349e54ca45a05dd5c818fb035c9054b022";

describe("cloneRequestForRef", () => {
  test("treats a 40-hex ref as a commit pin", () => {
    assert.deepEqual(cloneRequestForRef(PIN), { commit: PIN });
    assert.deepEqual(cloneRequestForRef(PIN.toUpperCase()), { commit: PIN });
  });

  test("keeps branch names as refs", () => {
    assert.deepEqual(cloneRequestForRef("main"), { ref: "main" });
    assert.deepEqual(cloneRequestForRef(undefined), {});
    assert.deepEqual(cloneRequestForRef(PIN.slice(0, 7)), { ref: PIN.slice(0, 7) });
  });
});
