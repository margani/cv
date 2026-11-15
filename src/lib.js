const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// "June 2024" / "Aug 2022" -> months since year 0. Date.parse on these strings
// is implementation-defined, so parse them explicitly and fail loudly.
function monthIndex(value) {
  if (value instanceof Date) return value.getFullYear() * 12 + value.getMonth();
  const match = /^([A-Za-z]{3})[A-Za-z]*\.? (\d{4})$/.exec(String(value).trim());
  const month = match ? MONTHS[match[1].toLowerCase()] : undefined;
  if (month === undefined) throw new Error(`Unparseable CV date: "${value}"`);
  return Number(match[2]) * 12 + month;
}

// Whole calendar months between two dates, so 30/365-day approximations
// cannot shift the result by a month.
function dateDiff(from, to, prefix = "", suffix = "") {
  const total = monthIndex(from || new Date()) - monthIndex(to);
  if (total <= 0) return "";
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months) parts.push(`${months} mo${months > 1 ? "s" : ""}`);
  return `${prefix}${parts.join(" ")}${suffix}`;
}

function shortUrl(url) {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/^\/|\/$/g, "")
    .replace(/^linkedin\.com/, "");
}

// An explicit `lastUpdated` in cv.json wins. Otherwise use the last commit that
// touched the file; a shallow clone has no usable history, so fall back to the
// build time instead of printing a wrong date.
function resolveLastUpdated(data, filePath, cwd = process.cwd()) {
  if (data.lastUpdated) {
    const date = new Date(data.lastUpdated);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Invalid lastUpdated in cv.json: "${data.lastUpdated}"`);
    }
    return date;
  }
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%aI", "--", filePath], {
      cwd,
      encoding: "utf8",
    }).trim();
    const date = new Date(out);
    if (out && !Number.isNaN(date.getTime())) return date;
  } catch {
    // not a git checkout
  }
  return new Date();
}

const ICON_DIR = path.join(path.dirname(require.resolve("ionicons/package.json")), "dist", "svg");

// Inline the SVG so the PDF does not depend on a CDN script rendering web components.
function icon(name) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`Bad icon name: ${name}`);
  const svg = fs.readFileSync(path.join(ICON_DIR, `${name}.svg`), "utf8");
  return svg
    .replace(/<title>.*?<\/title>/, "")
    .replace('class="ionicon"', 'class="icon" aria-hidden="true" focusable="false"');
}

const FONT_DIR = path.join(
  path.dirname(require.resolve("@fontsource/open-sans/package.json")),
  "files",
);

function fontFaces(weights = [400, 500, 700]) {
  return weights
    .map((weight) => {
      const file = path.join(FONT_DIR, `open-sans-latin-${weight}-normal.woff2`);
      const b64 = fs.readFileSync(file).toString("base64");
      return `@font-face{font-family:"Open Sans";font-style:normal;font-weight:${weight};font-display:block;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
    })
    .join("\n");
}

module.exports = { dateDiff, shortUrl, resolveLastUpdated, icon, fontFaces, monthIndex };
