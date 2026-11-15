const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { build } = require("../src/build");

const data = JSON.parse(fs.readFileSync("src/cv.json", "utf8"));
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cv-")), "index.html");
const html = build({ out });

test("build writes the file it returns", () => {
  assert.equal(fs.readFileSync(out, "utf8"), html);
  assert.ok(html.length > 1000);
});

test("HTML is self-contained: no external stylesheets, scripts, imports or fonts", () => {
  assert.doesNotMatch(html, /<link[^>]+href/i);
  assert.doesNotMatch(html, /<script/i);
  assert.doesNotMatch(html, /@import/i);
  assert.doesNotMatch(html, /ion-icon/i);
  assert.doesNotMatch(html, /url\((?!data:)/i);
});

test("every link in cv.json is rendered", () => {
  const links = Object.values(data.details).filter((v) => /^https?:/.test(v));
  assert.ok(links.length > 0);
  for (const link of links) assert.ok(html.includes(`href="${link}"`), link);
  assert.ok(html.includes(`href="mailto:${data.details.email}"`));
});

test("every employment and education entry is rendered", () => {
  const entries = [...data.history.employment, ...data.history.education];
  assert.ok(entries.length > 0);
  for (const e of data.history.employment) assert.ok(html.includes(e.employer), e.employer);
  for (const e of data.history.education) assert.ok(html.includes(e.school), e.school);
});

test("document structure: one h1, no empty meta description", () => {
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  assert.doesNotMatch(html, /name="description" content=""/);
  assert.doesNotMatch(html, /<page/);
});

test("the updated row uses a clock icon, not a second calendar", () => {
  const { icon } = require("../src/lib");
  assert.ok(html.includes(icon("time-outline")));
  assert.match(html, /updated \d/);
});
