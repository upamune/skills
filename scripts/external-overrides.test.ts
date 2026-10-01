import { describe, test } from "bun:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { applyExternalOverrides, EXTERNAL_OVERRIDES, externalOverrideNoticeLines } from "./external-overrides";
import { REPO } from "./lib";

const ARCHIFY_ROOT = join(REPO, "skills/external/archify");
const MANIFEST_URL = "https://tt-a1i.github.io/archify/skill-updates/archify/stable.json";

function writeFixture(root: string, replacements: { file: string; body: string }[]): void {
  for (const replacement of replacements) {
    const file = join(root, replacement.file);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, replacement.body);
  }
}

describe("external overrides", () => {
  test("archify notice names the opt-in and the update endpoint", () => {
    const notice = externalOverrideNoticeLines().join("\n");
    assert.match(notice, /archify/);
    assert.match(notice, /ARCHIFY_UPDATE_CHECK=1/);
    assert.match(notice, /ARCHIFY_UPDATE_CHECK_DISABLED=1/);
    assert.match(notice, new RegExp(MANIFEST_URL.replace(/[.]/g, "\\.")));
  });

  test("applies archify anchors once and leaves them in place on a second run", () => {
    const spec = EXTERNAL_OVERRIDES.archify!;
    const root = mkdtempSync(join(tmpdir(), "archify-override-"));
    try {
      writeFixture(
        root,
        spec.replacements.map((replacement) => ({
          file: replacement.file,
          body: `before\n${replacement.from}\nafter\n`,
        })),
      );
      applyExternalOverrides("archify", root);
      applyExternalOverrides("archify", root);
      for (const replacement of spec.replacements) {
        assert.equal(readFileSync(join(root, replacement.file), "utf8"), `before\n${replacement.to}\nafter\n`);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a missed anchor writes nothing", () => {
    const spec = EXTERNAL_OVERRIDES.archify!;
    const root = mkdtempSync(join(tmpdir(), "archify-override-miss-"));
    try {
      const [first, second] = spec.replacements;
      writeFixture(root, [
        { file: first!.file, body: first!.from },
        { file: second!.file, body: "upstream changed\n" },
      ]);
      assert.throws(() => applyExternalOverrides("archify", root), /アンカーが一致しません/);
      assert.equal(readFileSync(join(root, first!.file), "utf8"), first!.from);
      assert.equal(readFileSync(join(root, second!.file), "utf8"), "upstream changed\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("unknown skills are left untouched", () => {
    const root = mkdtempSync(join(tmpdir(), "archify-override-skip-"));
    try {
      applyExternalOverrides("not-a-skill", root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("vendored archify contains the local override", () => {
    const checker = readFileSync(join(ARCHIFY_ROOT, "scripts/check-update.mjs"), "utf8");
    const delivery = readFileSync(join(ARCHIFY_ROOT, "bin/delivery-update.mjs"), "utf8");
    assert.match(checker, /upamune\/skills local override/);
    assert.match(delivery, /upamune\/skills local override/);
    assert.doesNotMatch(checker, /return process\.env\.ARCHIFY_UPDATE_CHECK_DISABLED === '1';/);
    assert.doesNotMatch(
      delivery,
      /if \(env\.ARCHIFY_UPDATE_CHECK_DISABLED === '1'\) return Promise\.resolve\(unavailable\('disabled'\)\);/,
    );
  });
});

async function withUpdateEnv(
  values: Record<string, string | undefined>,
  run: () => Promise<void>,
): Promise<void> {
  const keys = ["ARCHIFY_UPDATE_CHECK", "ARCHIFY_UPDATE_CHECK_DISABLED"];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    await run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("vendored archify does not GET the update endpoint unless opted in", async () => {
  const { checkForUpdate } = await import("../skills/external/archify/scripts/check-update.mjs");
  const { startDeliveryUpdateCheck } = await import("../skills/external/archify/bin/delivery-update.mjs");
  const cacheDirectory = mkdtempSync(join(tmpdir(), "archify-update-cache-"));
  const spawnRoot = mkdtempSync(join(tmpdir(), "archify-update-spawn-"));
  const marker = join(spawnRoot, "spawned");
  const checkerPath = join(spawnRoot, "checker.mjs");
  writeFileSync(
    checkerPath,
    `import { writeFileSync } from "node:fs";
writeFileSync(${JSON.stringify(marker)}, "1");
process.stdout.write('{"status":"silent","reason":"spawned"}\\n');
`,
  );

  const calls: { url: string; method: string | undefined }[] = [];
  const fetchImpl = async (url: string, init?: { method?: string }) => {
    calls.push({ url: String(url), method: init?.method });
    return { status: 404, headers: { get: () => null }, body: null };
  };

  try {
    await withUpdateEnv({}, async () => {
      calls.length = 0;
      const result = await checkForUpdate({ fetchImpl, cacheDirectory, timeoutMs: 200 });
      assert.equal(result.reason, "disabled");
      assert.deepEqual(calls, []);

      const delivery = await startDeliveryUpdateCheck({ env: {}, checkerPath, deadlineMs: 1_000 });
      assert.equal(delivery.reason, "disabled");
      assert.equal(existsSync(marker), false);
    });

    await withUpdateEnv({ ARCHIFY_UPDATE_CHECK: "1", ARCHIFY_UPDATE_CHECK_DISABLED: "1" }, async () => {
      calls.length = 0;
      const result = await checkForUpdate({ fetchImpl, cacheDirectory, timeoutMs: 200 });
      assert.equal(result.reason, "disabled");
      assert.deepEqual(calls, []);
    });

    await withUpdateEnv({ ARCHIFY_UPDATE_CHECK: "1" }, async () => {
      calls.length = 0;
      await checkForUpdate({ fetchImpl, cacheDirectory, timeoutMs: 200 });
      assert.deepEqual(calls, [{ url: MANIFEST_URL, method: "GET" }]);

      rmSync(marker, { force: true });
      const delivery = await startDeliveryUpdateCheck({
        env: { ARCHIFY_UPDATE_CHECK: "1" },
        checkerPath,
        deadlineMs: 2_000,
      });
      assert.equal(delivery.reason, "spawned");
      assert.equal(readFileSync(marker, "utf8"), "1");
    });

    const cli = spawnSync(process.execPath, [join(ARCHIFY_ROOT, "scripts/check-update.mjs")], {
      encoding: "utf8",
      timeout: 5_000,
      env: { ...process.env, ARCHIFY_UPDATE_CHECK: "", ARCHIFY_UPDATE_CHECK_DISABLED: "" },
    });
    assert.equal(cli.status, 0, cli.stderr);
    assert.deepEqual(JSON.parse(cli.stdout), { status: "silent", reason: "disabled" });
  } finally {
    rmSync(cacheDirectory, { recursive: true, force: true });
    rmSync(spawnRoot, { recursive: true, force: true });
  }
});
