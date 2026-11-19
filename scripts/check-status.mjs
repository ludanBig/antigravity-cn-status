import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const statusPath = fileURLToPath(new URL("../site/status.json", import.meta.url));
const changelogUrl = "https://antigravity.google/docs/changelog";
const settingsUrl = "https://antigravity.google/docs/settings";
const previous = JSON.parse(await readFile(statusPath, "utf8"));

async function download(url) {
  const response = await fetch(url, {
    headers: { "User-Agent": "Antigravity-Chinese-Status-Checker/1.0" },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.text();
}

function plainText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function officialChineseInterfaceMentioned(text) {
  const a = "(?:Simplified Chinese|Chinese\\s+language|zh-CN|简体中文)";
  const b = "(?:interface|UI|display language|locali[sz]ation|界面|语言设置)";
  return new RegExp(`${a}.{0,100}${b}|${b}.{0,100}${a}`, "i").test(text);
}

const [changelog, settings] = await Promise.all([
  download(changelogUrl),
  download(settingsUrl),
]);

const releases = [...changelog.matchAll(
  /<article\b[^>]*\bid="rel-hub-(\d+\.\d+\.\d+)"[^>]*>([\s\S]*?)<\/article>/g,
)];
const latest = releases.find((match) => /class="rn-latest-tag\b/.test(match[2]));
if (!latest) throw new Error("Cannot identify the latest Antigravity App release.");

const version = latest[1];
const dateText = latest[2].match(/<time\b[^>]*class="rn-date-text[^"]*"[^>]*>([^<]+)<\/time>/)?.[1];
const date = dateText ? new Date(dateText) : null;
if (!date || Number.isNaN(date.getTime())) {
  throw new Error("Cannot verify the official release date.");
}
const release_date = date.toISOString().slice(0, 10);

const settingsMain = settings.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? settings;
const latestText = plainText(latest[2]);
const settingsText = plainText(settingsMain);
const hasOfficialChineseUI = officialChineseInterfaceMentioned(latestText) ||
  officialChineseInterfaceMentioned(settingsText);

let chinese_ui;
let summary;
let language_source = previous.language_source;
if (hasOfficialChineseUI) {
  chinese_ui = "supported";
  summary = "Google 官方更新日志或设置文档已出现简体中文界面支持说明；请通过来源核对适用版本及具体范围。";
  language_source = officialChineseInterfaceMentioned(settingsText) ? settingsUrl : changelogUrl;
} else if (previous.version !== version) {
  chinese_ui = "unknown";
  summary = "检测到新的 Antigravity App 版本，尚缺少足够的官方证据确认简体中文界面是否上线，等待进一步核实。";
  language_source = settingsUrl;
} else {
  chinese_ui = previous.chinese_ui;
  summary = chinese_ui === "unsupported"
    ? "本次自动检查未发现 Google 发布官方简体中文界面的证据；当前仍记录为暂不支持。中文对话、IDE 语言包和第三方汉化不计入。"
    : previous.summary;
}

const next = {
  version, release_date, chinese_ui,
  verified_at: new Date().toISOString(),
  summary, version_source: changelogUrl, language_source,
};
await writeFile(statusPath, JSON.stringify(next, null, 2) + "\n");
console.log(JSON.stringify({ version, release_date, chinese_ui, checked_at: next.verified_at }));
