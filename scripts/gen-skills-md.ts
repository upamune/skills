#!/usr/bin/env bun
// repo 内の全スキル（自作 + external）を SKILLS.md に一覧として書き出す。
// external.ts の add / sync / remove 後にも自動で呼ばれる。

import { existsSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { EXTERNAL_DIR, findSkillDirs, oneLine, readFrontmatter, readManifest, REPO, SKILLS_DIR, type Manifest } from "./lib";

const BUCKET_ORDER = ["engineering", "productivity", "in-progress", "deprecated", "external"];
const BUCKET_LABEL: Record<string, string> = {
  engineering: "日常のコード作業向け（自作）",
  productivity: "コード以外のワークフロー向け（自作）",
  "in-progress": "作りかけ・試用中（自作）",
  deprecated: "使わなくなったもの（自作）",
  external: "外部リポジトリから vendor したもの",
};

type Row = { name: string; relDir: string; description: string; userInvoked: boolean; internal: boolean };

async function collect(bucketDir: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (const dir of findSkillDirs(bucketDir).sort()) {
    const fm = await readFrontmatter(dir);
    rows.push({
      name: fm.name ?? basename(dir),
      relDir: relative(REPO, dir),
      description: oneLine(fm.description),
      userInvoked: fm.userInvoked,
      internal: fm.internal,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, "\\|");
}

function renderOwnBucket(rows: Row[]): string[] {
  const out: string[] = [];
  const groups: [string, Row[]][] = [
    ["User-invoked", rows.filter((r) => r.userInvoked)],
    ["Model-invoked", rows.filter((r) => !r.userInvoked)],
  ];
  for (const [label, items] of groups) {
    if (items.length === 0) continue;
    out.push(`**${label}**`, "");
    for (const r of items) {
      const flags = r.internal ? " `internal`" : "";
      out.push(`- [${r.name}](./${r.relDir}/SKILL.md)${flags}: ${r.description}`);
    }
    out.push("");
  }
  return out;
}

function renderExternal(rows: Row[], manifest: Manifest): string[] {
  const out = ["| skill | description | source | commit |", "| --- | --- | --- | --- |"];
  for (const r of rows) {
    const e = manifest.skills[r.name];
    const source = e
      ? e.url.startsWith("https://github.com/")
        ? `[${e.source}/${e.path}](${e.url.replace(/\.git$/, "")}/tree/${e.commit}/${e.path})`
        : `${e.source}/${e.path}`
      : "(manifest 未登録)";
    const commit = e ? `\`${e.commit.slice(0, 7)}\`` : "";
    out.push(`| [${r.name}](./${r.relDir}/SKILL.md) | ${escapeCell(r.description)} | ${source} | ${commit} |`);
  }
  out.push("");
  return out;
}

export async function generateSkillsMd(): Promise<string> {
  const manifest = await readManifest();
  const buckets = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => {
      const ia = BUCKET_ORDER.indexOf(a);
      const ib = BUCKET_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });

  const lines: string[] = [
    "# Skills",
    "",
    "<!-- このファイルは scripts/gen-skills-md.ts が自動生成する。手で編集しない。 -->",
    "",
    "このリポジトリに入っている全スキルの一覧。`npx skills add upamune/skills` でインストールできる。",
    "再生成: `scripts/gen-skills-md.ts`（`scripts/external.ts` の add / sync / remove 後は自動で更新される）。",
    "",
  ];

  let total = 0;
  const summary: string[] = [];
  const sections: string[] = [];
  for (const bucket of buckets) {
    const dir = join(SKILLS_DIR, bucket);
    const rows = await collect(dir);
    total += rows.length;
    summary.push(`| [${bucket}/](#${bucket}) | ${rows.length} | ${BUCKET_LABEL[bucket] ?? ""} |`);
    sections.push(`## ${bucket}`, "");
    if (BUCKET_LABEL[bucket]) sections.push(BUCKET_LABEL[bucket]!, "");
    if (rows.length === 0) {
      sections.push("（なし）", "");
      continue;
    }
    sections.push(...(dir === EXTERNAL_DIR ? renderExternal(rows, manifest) : renderOwnBucket(rows)));
  }

  lines.push(`合計 ${total} スキル`, "", "| bucket | count | 用途 |", "| --- | --- | --- |", ...summary, "", ...sections);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export async function writeSkillsMd(): Promise<void> {
  await Bun.write(join(REPO, "SKILLS.md"), await generateSkillsMd());
}

if (import.meta.main) {
  if (!existsSync(SKILLS_DIR)) {
    console.error("skills/ がありません");
    process.exit(1);
  }
  await writeSkillsMd();
  console.log("wrote SKILLS.md");
}
