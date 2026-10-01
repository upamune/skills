// skills/external/ は add / sync で上流コピーに置き換わる。
// 残したい差分だけをここに置き、コピー直後に再適用する。
// アンカーが上流と一致しない場合は何も書かずに失敗する。

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type TextReplacement = {
  file: string;
  from: string;
  to: string;
};

type OverrideSpec = {
  readmeLine: string;
  replacements: TextReplacement[];
};

const ARCHIFY_UPDATE_MANIFEST = "https://tt-a1i.github.io/archify/skill-updates/archify/stable.json";

const ARCHIFY_CHECK_UPDATE_FROM = `function updatesDisabled() {
  return process.env.ARCHIFY_UPDATE_CHECK_DISABLED === '1';
}`;

const ARCHIFY_CHECK_UPDATE_TO = `function updatesDisabled() {
  // upamune/skills local override, re-applied by scripts/external.ts after vendor copy.
  // No update-endpoint request unless ARCHIFY_UPDATE_CHECK=1.
  // ARCHIFY_UPDATE_CHECK_DISABLED=1 still forces the check off.
  if (process.env.ARCHIFY_UPDATE_CHECK_DISABLED === '1') return true;
  return process.env.ARCHIFY_UPDATE_CHECK !== '1';
}`;

const ARCHIFY_DELIVERY_FROM =
  "  if (env.ARCHIFY_UPDATE_CHECK_DISABLED === '1') return Promise.resolve(unavailable('disabled'));";

const ARCHIFY_DELIVERY_TO = `  // upamune/skills local override, re-applied by scripts/external.ts after vendor copy.
  // Do not spawn the update check unless ARCHIFY_UPDATE_CHECK=1.
  // ARCHIFY_UPDATE_CHECK_DISABLED=1 still forces the check off.
  if (env.ARCHIFY_UPDATE_CHECK_DISABLED === '1' || env.ARCHIFY_UPDATE_CHECK !== '1') {
    return Promise.resolve(unavailable('disabled'));
  }`;

export const EXTERNAL_OVERRIDES: Record<string, OverrideSpec> = {
  archify: {
    readmeLine:
      `archify: 更新確認は既定でオフ。\`ARCHIFY_UPDATE_CHECK=1\` のときだけ ${ARCHIFY_UPDATE_MANIFEST} へ GET する。\`ARCHIFY_UPDATE_CHECK_DISABLED=1\` はオプトインより優先して止める。再適用は \`scripts/external-overrides.ts\`。`,
    replacements: [
      {
        file: "scripts/check-update.mjs",
        from: ARCHIFY_CHECK_UPDATE_FROM,
        to: ARCHIFY_CHECK_UPDATE_TO,
      },
      {
        file: "bin/delivery-update.mjs",
        from: ARCHIFY_DELIVERY_FROM,
        to: ARCHIFY_DELIVERY_TO,
      },
    ],
  },
};

export function externalOverrideNoticeLines(): string[] {
  const lines = Object.values(EXTERNAL_OVERRIDES).map((spec) => `- ${spec.readmeLine}`);
  if (lines.length === 0) return [];
  return [
    "次のスキルはコピー直後にローカル override を再適用する。`skills/external/` 側を手で戻しても、次の add / sync で同じ差分が入る。アンカーが上流とずれたらコマンドは失敗し、直前のツリーは残る。",
    "",
    ...lines,
    "",
  ];
}

function replaceOnce(source: string, from: string, to: string, file: string): string {
  if (source.includes(to) && !source.includes(from)) return source;
  const first = source.indexOf(from);
  const duplicate = first < 0 ? -1 : source.indexOf(from, first + from.length);
  if (first < 0 || duplicate >= 0 || source.includes(to)) {
    throw new Error(
      `local override のアンカーが一致しません: ${file}。上流の該当箇所が変わったので scripts/external-overrides.ts を更新してから sync してください。`,
    );
  }
  return source.slice(0, first) + to + source.slice(first + from.length);
}

// 検証が全部通ってから書く。途中のファイルだけパッチ済みにはしない。
export function applyExternalOverrides(name: string, dest: string): void {
  const spec = EXTERNAL_OVERRIDES[name];
  if (!spec) return;
  const edits: { file: string; next: string }[] = [];
  for (const replacement of spec.replacements) {
    const file = join(dest, replacement.file);
    let original: string;
    try {
      original = readFileSync(file, "utf8");
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`local override の対象を読めません: ${replacement.file} (${detail})`);
    }
    const next = replaceOnce(original, replacement.from, replacement.to, replacement.file);
    if (next !== original) edits.push({ file, next });
  }
  for (const edit of edits) writeFileSync(edit.file, edit.next);
}
