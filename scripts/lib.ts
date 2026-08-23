// external.ts / gen-skills-md.ts 共通のヘルパー
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const REPO = resolve(import.meta.dir, "..");
export const MANIFEST = join(REPO, "external-skills.json");
export const SKILLS_DIR = join(REPO, "skills");
export const EXTERNAL_DIR = join(SKILLS_DIR, "external");
export const SKIP_DIRS = new Set([".git", "node_modules"]);

export type Entry = {
  source: string;
  url: string;
  path: string;
  ref?: string;
  commit: string;
  updatedAt: string;
};

export type Manifest = { version: 1; skills: Record<string, Entry> };

export async function readManifest(): Promise<Manifest> {
  const file = Bun.file(MANIFEST);
  if (!(await file.exists())) return { version: 1, skills: {} };
  const parsed = (await file.json()) as Partial<Manifest>;
  return { version: 1, skills: parsed.skills ?? {} };
}

export async function writeManifest(manifest: Manifest): Promise<void> {
  const sorted: Record<string, Entry> = {};
  for (const name of Object.keys(manifest.skills).sort()) sorted[name] = manifest.skills[name]!;
  await Bun.write(MANIFEST, JSON.stringify({ version: 1, skills: sorted }, null, 2) + "\n");
}

export function findSkillDirs(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name));
      } else if (entry.name === "SKILL.md") {
        found.push(dir);
      }
    }
  };
  walk(root);
  return found;
}

export type Frontmatter = {
  name: string | null;
  description: string | null;
  internal: boolean;
  userInvoked: boolean;
};

export async function readFrontmatter(skillDir: string): Promise<Frontmatter> {
  const text = await Bun.file(join(skillDir, "SKILL.md")).text();
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { name: null, description: null, internal: false, userInvoked: false };
  const lines = m[1]!.split(/\r?\n/);
  const scalar = (key: string): string | null => {
    const i = lines.findIndex((l) => new RegExp(`^${key}:`).test(l));
    if (i < 0) return null;
    let value = lines[i]!.slice(key.length + 1).trim();
    if (value === "" || value === "|" || value === ">" || value === "|-" || value === ">-") {
      // ブロックスカラー: 続くインデント行を結合
      const parts: string[] = [];
      for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]!); j++) parts.push(lines[j]!.trim());
      value = parts.join(" ");
    }
    if (/^".*"$/.test(value)) value = value.slice(1, -1).replace(/\\(["\\])/g, "$1");
    else if (/^'.*'$/.test(value)) value = value.slice(1, -1).replace(/''/g, "'");
    return value.trim() || null;
  };
  const internal = lines.some((l, i) => /^metadata:/.test(l) && lines.slice(i + 1).some((n) => /^\s+internal:\s*true/.test(n)));
  const userInvoked = lines.some((l) => /^disable-model-invocation:\s*true/.test(l));
  return { name: scalar("name"), description: scalar("description"), internal, userInvoked };
}

export async function frontmatterName(skillDir: string): Promise<string | null> {
  return (await readFrontmatter(skillDir)).name;
}

export function oneLine(text: string | null): string {
  return text ? text.replace(/\s+/g, " ").trim() : "";
}
