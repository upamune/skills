#!/usr/bin/env bun
// 外部スキルを skills/external/ に vendor（コピー）して external-skills.json で管理する。
//
//   scripts/external.ts add <source> [<skill>...] [--ref <ref>] [--path <repo内パス>]
//   scripts/external.ts sync [<skill>...] [--frozen]
//   scripts/external.ts remove <skill>...
//   scripts/external.ts list
//
// <source> は owner/repo, https://github.com/owner/repo(/tree/<ref>/<path>),
// https://gist.github.com/<user>/<id>, git URL のいずれか。

import { $ } from "bun";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import { writeSkillsMd } from "./gen-skills-md";
import {
  EXTERNAL_DIR,
  findSkillDirs,
  frontmatterName,
  readFrontmatter,
  readManifest,
  REPO,
  SKIP_DIRS,
  sourceLabel,
  sourceUrl,
  writeManifest,
  type Manifest,
} from "./lib";

type Flags = { ref?: string; path?: string; frozen?: boolean; list?: boolean };

function usage(code = 1): never {
  console.error(`Usage:
  scripts/external.ts add <source> [<skill>...] [--ref <ref>] [--path <repo内パス>] [--list]
                                  (スキル名を省略すると対話的に選択、--list は一覧表示のみ)
  scripts/external.ts sync [<skill>...] [--frozen]
  scripts/external.ts remove <skill>...
  scripts/external.ts list

Examples:
  scripts/external.ts add mattpocock/skills               # 対話的に選ぶ
  scripts/external.ts add mattpocock/skills --list        # 一覧だけ見る
  scripts/external.ts add mattpocock/skills grilling tdd
  scripts/external.ts add vercel-labs/agent-browser agent-browser --ref main
  scripts/external.ts add https://github.com/openai/plugins/tree/main/plugins/build-ios-apps/skills/ios-debugger-agent
  scripts/external.ts add https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d
  scripts/external.ts sync            # 全部を最新 ref に更新
  scripts/external.ts sync --frozen   # manifest の commit で取り直す`);
  process.exit(code);
}

function parseArgs(argv: string[]): { positional: string[]; flags: Flags } {
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--ref" || a === "--path") flags[a.slice(2) as "ref" | "path"] = argv[++i];
    else if (a === "--frozen") flags.frozen = true;
    else if (a === "--list" || a === "-l") flags.list = true;
    else if (a === "-h" || a === "--help") usage(0);
    else if (a.startsWith("--")) usage();
    else positional.push(a);
  }
  return { positional, flags };
}

type Source = { source: string; url: string; ref?: string; path?: string };

// source 文字列 → { source, url, ref?, path? }
function resolveSource(input: string): Source {
  // gist も git repo として clone できる（ファイルは常にルート直下）
  const gist = input.match(/^https?:\/\/gist\.github\.com\/(?:([^/]+)\/)?([0-9a-f]+)(?:\.git)?\/?$/);
  if (gist) {
    const [, owner, id] = gist;
    const slug = owner ? `${owner}/${id}` : id!;
    return { source: `gist:${slug}`, url: `https://gist.github.com/${slug}.git` };
  }
  const gh = input.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?\/?$/);
  if (gh) {
    const [, owner, repo, ref, path] = gh;
    return { source: `${owner}/${repo}`, url: `https://github.com/${owner}/${repo}.git`, ref, path };
  }
  if (/^[\w.-]+\/[\w.-]+$/.test(input)) {
    return { source: input, url: `https://github.com/${input}.git` };
  }
  if (/^(git@|ssh:\/\/|https?:\/\/)/.test(input)) {
    return { source: input, url: input };
  }
  throw new Error(`source の形式を解釈できません: ${input}`);
}

async function cloneRepo(url: string, opts: { ref?: string; commit?: string }): Promise<{ dir: string; commit: string }> {
  const dir = mkdtempSync(join(tmpdir(), "external-skill-"));
  if (opts.commit) {
    await $`git init -q`.cwd(dir).quiet();
    await $`git remote add origin ${url}`.cwd(dir).quiet();
    await $`git fetch -q --depth 1 origin ${opts.commit}`.cwd(dir);
    await $`git checkout -q FETCH_HEAD`.cwd(dir).quiet();
  } else {
    const branch = opts.ref ? ["--branch", opts.ref] : [];
    await $`git clone -q --depth 1 ${branch} ${url} ${dir}`;
  }
  const commit = (await $`git rev-parse HEAD`.cwd(dir).text()).trim();
  return { dir, commit };
}

type Choice = {
  label: string;
  hint?: string;
  disabled?: boolean;
  checked?: boolean;
  // header: true の行はグループ見出し。Space でそのグループの項目をまとめて選択/解除する
  header?: boolean;
  group?: string;
};

// 依存なしの複数選択プロンプト。↑↓ / j k / Ctrl-n Ctrl-p 移動、Space 選択（見出し上ならグループごと）、a 全選択、i 反転、Enter 確定、q/Esc/Ctrl-C 中止。
async function multiSelect(title: string, choices: Choice[]): Promise<number[] | null> {
  const stdin = process.stdin;
  if (!stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("対話モードには TTY が必要です。スキル名を引数で指定するか、--list で一覧を確認してください");
  }
  const checked = choices.map((c) => !!c.checked && !c.header);
  const selectable = (i: number) => !choices[i]!.disabled && !choices[i]!.header;
  const groupItems = (group: string | undefined) =>
    choices.flatMap((c, i) => (c.group === group && selectable(i) ? [i] : []));
  const total = choices.filter((_, i) => selectable(i)).length;
  const grouped = choices.some((c) => c.header);
  let cursor = choices.findIndex((c) => !c.disabled);
  if (cursor < 0) cursor = 0;
  let top = 0;
  let renderedLines = 0;
  const out = (s: string) => process.stdout.write(s);
  const visibleRows = () => Math.max(3, Math.floor(((process.stdout.rows || 24) - 5) * 0.8));

  const render = () => {
    const rows = visibleRows();
    if (cursor < top) top = cursor;
    if (cursor >= top + rows) top = cursor - rows + 1;
    const lines: string[] = [];
    const count = checked.filter(Boolean).length;
    lines.push(`\x1b[1m${title}\x1b[0m \x1b[2m(${count}/${total} 選択)\x1b[0m`);
    lines.push("\x1b[2m↑↓ / j k / C-n C-p 移動  Space 選択（見出しならグループ一括）  a 全選択  i 反転  Enter 確定  q 中止\x1b[0m");
    if (top > 0) lines.push(`\x1b[2m  ... 上に ${top} 件\x1b[0m`);
    for (let i = top; i < Math.min(choices.length, top + rows); i++) {
      const c = choices[i]!;
      const pointer = i === cursor ? "\x1b[36m❯\x1b[0m" : " ";
      if (c.header) {
        const items = groupItems(c.group);
        const picked = items.filter((j) => checked[j]).length;
        const mark = items.length === 0 ? "\x1b[2m-\x1b[0m" : picked === items.length ? "\x1b[32m◉\x1b[0m" : picked > 0 ? "\x1b[33m◐\x1b[0m" : "◯";
        const hdr = i === cursor ? `\x1b[1;7;35m ${c.label} \x1b[0m` : `\x1b[1;35m▾ ${c.label}\x1b[0m`;
        if (i > top) lines.push("");
        lines.push(`${pointer} ${mark} ${hdr} \x1b[2m(${picked}/${items.length})\x1b[0m`);
        continue;
      }
      const box = c.disabled ? "\x1b[2m-\x1b[0m" : checked[i] ? "\x1b[32m◉\x1b[0m" : "◯";
      const label = c.disabled ? `\x1b[2m${c.label}\x1b[0m` : i === cursor ? `\x1b[1m${c.label}\x1b[0m` : c.label;
      const hint = c.hint ? `  \x1b[2m${c.hint}\x1b[0m` : "";
      const indent = c.group !== undefined && grouped ? "  " : "";
      lines.push(`${pointer} ${indent}${box} ${label}${hint}`);
    }
    const below = choices.length - (top + rows);
    if (below > 0) lines.push(`\x1b[2m  ... 下に ${below} 件\x1b[0m`);
    const width = process.stdout.columns || 80;
    const clipped = lines.map((l) => clip(l, width));
    if (renderedLines > 0) out(`\x1b[${renderedLines}A\x1b[J`);
    out(clipped.join("\n") + "\n");
    renderedLines = clipped.length;
  };

  const move = (delta: number) => {
    if (choices.every((c) => c.disabled)) return;
    let next = cursor;
    do {
      next = (next + delta + choices.length) % choices.length;
    } while (choices[next]!.disabled && next !== cursor);
    cursor = next;
  };

  stdin.setRawMode(true);
  stdin.resume();
  out("\x1b[?25l");
  render();
  try {
    return await new Promise<number[] | null>((resolvePromise) => {
      const handleKey = (key: string): number[] | null | undefined => {
        if (key === "\x03" || key === "q" || key === "\x1b") return null;
        if (key === "\r" || key === "\n") return checked.flatMap((v, i) => (v ? [i] : []));
        if (key === "\x1b[A" || key === "k" || key === "\x10") move(-1);
        else if (key === "\x1b[B" || key === "j" || key === "\x0e") move(1);
        else if (key === " ") {
          const c = choices[cursor]!;
          if (c.header) {
            const items = groupItems(c.group);
            const all = items.length > 0 && items.every((j) => checked[j]);
            for (const j of items) checked[j] = !all;
          } else if (selectable(cursor)) {
            checked[cursor] = !checked[cursor];
          }
        } else if (key === "a") {
          const all = choices.every((_, i) => !selectable(i) || checked[i]);
          choices.forEach((_, i) => {
            if (selectable(i)) checked[i] = !all;
          });
        } else if (key === "i") {
          choices.forEach((_, i) => {
            if (selectable(i)) checked[i] = !checked[i];
          });
        }
        return undefined;
      };
      const onData = (buf: Buffer) => {
        for (const key of splitKeys(buf.toString())) {
          const done = handleKey(key);
          if (done !== undefined) {
            stdin.off("data", onData);
            resolvePromise(done);
            return;
          }
        }
        render();
      };
      stdin.on("data", onData);
    });
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
    out("\x1b[?25h");
  }
}

// 1 チャンクに複数キーが入っていても扱えるよう、エスケープシーケンス単位に分割する
function splitKeys(input: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < input.length; ) {
    if (input[i] === "\x1b" && input[i + 1] === "[") {
      let j = i + 2;
      while (j < input.length && !/[A-Za-z~]/.test(input[j]!)) j++;
      keys.push(input.slice(i, j + 1));
      i = j + 1;
    } else {
      keys.push(input[i]!);
      i++;
    }
  }
  return keys;
}

function isWide(cp: number): boolean {
  return (
    (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1faff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
  );
}

function clip(line: string, width: number): string {
  // ANSI を無視した可視幅で切り詰める（全角は 2 幅）
  let visible = 0;
  let outStr = "";
  for (let i = 0; i < line.length; ) {
    if (line[i] === "\x1b") {
      const end = line.indexOf("m", i);
      if (end < 0) break;
      outStr += line.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    const cp = line.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    const w = isWide(cp) ? 2 : 1;
    if (visible + w > width - 1) {
      outStr += "…";
      break;
    }
    outStr += ch;
    visible += w;
    i += ch.length;
  }
  return outStr + "\x1b[0m";
}

async function locateSkill(repoDir: string, name: string, explicitPath?: string): Promise<string> {
  if (explicitPath) {
    const dir = join(repoDir, explicitPath);
    if (!existsSync(join(dir, "SKILL.md"))) throw new Error(`${explicitPath} に SKILL.md がありません`);
    return dir;
  }
  const candidates: string[] = [];
  for (const d of findSkillDirs(repoDir)) {
    if (basename(d) === name || (await frontmatterName(d)) === name) candidates.push(d);
  }
  const live = candidates.filter((d) => !/\/(deprecated|\.out-of-scope)\//.test(d + "/"));
  const picks = live.length > 0 ? live : candidates;
  if (picks.length === 0) throw new Error(`スキル "${name}" が見つかりません`);
  if (picks.length > 1) {
    throw new Error(
      `スキル "${name}" の候補が複数あります。--path で指定してください:\n` +
        picks.map((d) => `  ${relative(repoDir, d)}`).join("\n"),
    );
  }
  return picks[0]!;
}

async function folderHash(dir: string): Promise<string> {
  const hasher = new Bun.CryptoHasher("sha256");
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(dir);
  for (const f of files.sort()) {
    hasher.update(relative(dir, f));
    hasher.update(await Bun.file(f).arrayBuffer());
  }
  return hasher.digest("hex");
}

function assertNoConflict(name: string): void {
  const skillsRoot = join(REPO, "skills");
  for (const bucket of readdirSync(skillsRoot)) {
    if (bucket === "external") continue;
    const p = join(skillsRoot, bucket, name);
    if (existsSync(p) && statSync(p).isDirectory()) {
      throw new Error(`自作スキル skills/${bucket}/${name} と名前が衝突します`);
    }
  }
}

// clone 済みの repo から 1 スキルを skills/external/<name>/ にコピーする
async function copySkill(
  repoDir: string,
  name: string,
  explicitPath?: string,
): Promise<{ path: string; changed: boolean }> {
  const src = await locateSkill(repoDir, name, explicitPath);
  const dest = join(EXTERNAL_DIR, name);
  const before = existsSync(dest) ? await folderHash(dest) : null;
  rmSync(dest, { recursive: true, force: true });
  // スキルが repo ルート直下（gist など）の場合に .git を持ち込まないよう除外する
  cpSync(src, dest, { recursive: true, filter: (p) => !SKIP_DIRS.has(basename(p)) });
  const after = await folderHash(dest);
  // gist などスキルが repo ルート直下にある場合、relative は "" を返すので "." に正規化する
  return { path: relative(repoDir, src) || ".", changed: before !== after };
}

async function vendor(
  name: string,
  entry: { url: string; ref?: string; path?: string },
  opts: { commit?: string } = {},
): Promise<{ path: string; commit: string; changed: boolean }> {
  const { dir, commit } = await cloneRepo(entry.url, { ref: entry.ref, commit: opts.commit });
  try {
    return { ...(await copySkill(dir, name, entry.path)), commit };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

type Discovered = { name: string; dir: string; group: string; description: string | null };

// repo 内の配布対象スキルを列挙（deprecated / internal は除外、同名は浅い方を優先）
async function discoverSkills(repoDir: string): Promise<Discovered[]> {
  const dirs = findSkillDirs(repoDir).sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  const seen = new Set<string>();
  const result: Discovered[] = [];
  for (const dir of dirs) {
    if (/\/(deprecated|\.out-of-scope)\//.test(dir + "/")) continue;
    const fm = await readFrontmatter(dir);
    if (fm.internal) continue;
    const name = fm.name ?? basename(dir);
    if (seen.has(name)) continue;
    seen.add(name);
    const rel = relative(repoDir, dir);
    const group = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) + "/" : "./";
    result.push({ name, dir, group, description: fm.description });
  }
  return result.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));
}

async function chooseSkills(repoDir: string, src: Source, manifest: Manifest): Promise<string[]> {
  const found = await discoverSkills(repoDir);
  if (found.length === 0) throw new Error(`${src.source} に SKILL.md が見つかりません`);
  if (found.length === 1) {
    console.log(`スキルが 1 つだけなので自動選択: ${found[0]!.name}`);
    return [found[0]!.name];
  }
  const choices: Choice[] = [];
  const indexMap: (Discovered | null)[] = [];
  let currentGroup: string | null = null;
  for (const s of found) {
    if (s.group !== currentGroup) {
      currentGroup = s.group;
      choices.push({ label: s.group, header: true, group: s.group });
      indexMap.push(null);
    }
    const existing = manifest.skills[s.name];
    const vendored = existing !== undefined;
    const desc = s.description ? s.description.replace(/\s+/g, " ") : "";
    choices.push({
      label: s.name,
      hint: vendored ? `(vendor 済み: ${existing.source}) ${desc}` : desc,
      disabled: vendored,
      group: s.group,
    });
    indexMap.push(s);
  }
  const picked = await multiSelect(`${src.source} から追加するスキルを選択`, choices);
  if (picked === null) {
    console.log("中止しました");
    process.exit(0);
  }
  return picked.flatMap((i) => (indexMap[i] ? [indexMap[i]!.name] : []));
}

async function writeExternalReadme(manifest: Manifest): Promise<void> {
  const names = Object.keys(manifest.skills).sort();
  const rows = names.map((n) => {
    const e = manifest.skills[n]!;
    const url = sourceUrl(e);
    const link = url ? `[${e.source}](${url})` : e.source;
    return `| [${n}](./${n}/SKILL.md) | ${link} | \`${e.ref ?? "default"}\` | \`${e.commit.slice(0, 7)}\` |`;
  });
  const body = [
    "# external",
    "",
    "外部リポジトリから vendor したスキル。**このディレクトリを直接編集しない**（`scripts/external.ts sync` で上書きされる）。",
    "出所と pin は [`external-skills.json`](../../external-skills.json) が正。追加・更新・削除は `scripts/external.ts` で行う。",
    "",
    "| skill | source | ref | commit |",
    "| --- | --- | --- | --- |",
    ...(rows.length ? rows : ["| (なし) | | | |"]),
    "",
  ];
  await Bun.write(join(EXTERNAL_DIR, "README.md"), body.join("\n"));
}

async function cmdAdd(positional: string[], flags: Flags): Promise<void> {
  const [sourceInput, ...names] = positional;
  if (!sourceInput) usage();
  const src = resolveSource(sourceInput);
  const ref = flags.ref ?? src.ref;
  const explicitPath = flags.path ?? src.path;
  if (names.length > 1 && explicitPath) throw new Error("--path は 1 スキルずつ指定してください");

  const manifest = await readManifest();
  const { dir, commit } = await cloneRepo(src.url, { ref });
  try {
    if (flags.list) {
      const found = await discoverSkills(dir);
      const width = Math.max(0, ...found.map((f) => f.name.length));
      let currentGroup: string | null = null;
      for (const f of found) {
        if (f.group !== currentGroup) {
          currentGroup = f.group;
          console.log(`${currentGroup === found[0]!.group ? "" : "\n"}\x1b[1m${f.group}\x1b[0m`);
        }
        const mark = manifest.skills[f.name] ? "✓" : " ";
        console.log(`  ${mark} ${f.name.padEnd(width)}  ${f.description?.replace(/\s+/g, " ") ?? ""}`);
      }
      console.log(`\n${found.length} skills (✓ = vendor 済み) @ ${commit.slice(0, 7)}`);
      return;
    }
    let targets: string[];
    if (names.length > 0) {
      targets = names;
    } else if (explicitPath) {
      // --path のみ: SKILL.md の name を採用
      const skillDir = join(dir, explicitPath);
      targets = [(await frontmatterName(skillDir)) ?? basename(skillDir)];
    } else {
      targets = await chooseSkills(dir, src, manifest);
      if (targets.length === 0) {
        console.log("何も選択されませんでした");
        return;
      }
    }

    for (const name of targets) assertNoConflict(name);
    for (const name of targets) {
      const result = await copySkill(dir, name, explicitPath);
      manifest.skills[name] = {
        source: src.source,
        url: src.url,
        path: result.path,
        ...(ref ? { ref } : {}),
        commit,
        updatedAt: new Date().toISOString(),
      };
      console.log(`added   ${name}  <- ${sourceLabel(manifest.skills[name]!)} @ ${commit.slice(0, 7)}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  await writeManifest(manifest);
  await writeExternalReadme(manifest);
  await writeSkillsMd();
}

async function cmdSync(positional: string[], flags: Flags): Promise<void> {
  const manifest = await readManifest();
  const names = positional.length > 0 ? positional : Object.keys(manifest.skills);
  for (const name of names) {
    const entry = manifest.skills[name];
    if (!entry) throw new Error(`manifest に "${name}" がありません`);
    const result = await vendor(name, entry, { commit: flags.frozen ? entry.commit : undefined });
    const status = result.changed ? "updated " : "同じ    ";
    console.log(`${status}${name}  @ ${entry.commit.slice(0, 7)} -> ${result.commit.slice(0, 7)}`);
    manifest.skills[name] = {
      ...entry,
      path: result.path,
      commit: result.commit,
      ...(result.changed ? { updatedAt: new Date().toISOString() } : {}),
    };
  }
  await writeManifest(manifest);
  await writeExternalReadme(manifest);
  await writeSkillsMd();
}

async function cmdRemove(positional: string[]): Promise<void> {
  if (positional.length === 0) usage();
  const manifest = await readManifest();
  for (const name of positional) {
    if (!manifest.skills[name]) throw new Error(`manifest に "${name}" がありません`);
    delete manifest.skills[name];
    rmSync(join(EXTERNAL_DIR, name), { recursive: true, force: true });
    console.log(`removed ${name}`);
  }
  await writeManifest(manifest);
  await writeExternalReadme(manifest);
  await writeSkillsMd();
}

async function cmdList(): Promise<void> {
  const manifest = await readManifest();
  const names = Object.keys(manifest.skills).sort();
  if (names.length === 0) {
    console.log("(external skills なし)");
    return;
  }
  const width = Math.max(...names.map((n) => n.length));
  for (const name of names) {
    const e = manifest.skills[name]!;
    console.log(`${name.padEnd(width)}  ${sourceLabel(e)}  ${e.ref ?? ""}@${e.commit.slice(0, 7)}`);
  }
}

const [command, ...rest] = Bun.argv.slice(2);
const { positional, flags } = parseArgs(rest);
try {
  switch (command) {
    case "add":
      await cmdAdd(positional, flags);
      break;
    case "sync":
    case "update":
      await cmdSync(positional, flags);
      break;
    case "remove":
    case "rm":
      await cmdRemove(positional);
      break;
    case "list":
    case "ls":
      await cmdList();
      break;
    default:
      usage();
  }
} catch (err) {
  console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
