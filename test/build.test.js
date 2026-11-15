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

test("grouped employer, grouped skills and earlier roles render", () => {
  const grouped = data.history.employment.filter((e) => e.positions);
  assert.ok(grouped.length > 0);
  for (const e of grouped) {
    assert.ok(html.includes(`>${e.employer}</h3>`), e.employer);
    for (const p of e.positions) assert.ok(html.includes(`>${p.title}</h4>`), p.title);
  }
  const groups = data.skills.filter((s) => s.label);
  assert.ok(groups.length > 0);
  for (const g of groups) assert.ok(html.includes(`<strong>${g.label}:</strong>`), g.label);
  assert.ok(data.history.earlier.length > 0);
  for (const r of data.history.earlier) {
    assert.ok(html.includes(r.employer || r.note), r.employer || r.note);
  }
});

test("projects render with their links", () => {
  assert.ok(data.projects.length > 0);
  for (const p of data.projects) {
    assert.ok(html.includes(`>${p.title}</h3>`), p.title);
    assert.ok(html.includes(`href="${p.url}"`), p.url);
  }
});

test("education graduation years render", () => {
  const withYear = data.history.education.filter((e) => e.endDate);
  assert.ok(withYear.length > 0);
  for (const e of withYear) {
    assert.ok(html.includes(`${e.degree} in ${e.field}, ${e.endDate}`), `${e.degree} ${e.endDate}`);
  }
});

test("every position bullet in cv.json is rendered", () => {
  const he = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let count = 0;
  for (const e of data.history.employment) {
    for (const p of e.positions || [e]) {
      for (const b of p.description || []) {
        count++;
        assert.ok(html.includes(he(b)), b.slice(0, 40));
      }
    }
  }
  assert.ok(count > 10);
});

test("an employer spans all of its positions", () => {
  const months = ["jan","feb","mar","apr","may","jun","june","jul","aug","sep","oct","nov","dec"];
  const key = (s) => { const [m, y] = s.toLowerCase().split(" "); return Number(y) * 12 + (months.indexOf(m) % 13); };
  let checked = 0;
  for (const e of data.history.employment) {
    if (!e.positions || !e.endDate) continue;
    checked++;
    const last = Math.max(...e.positions.map((p) => key(p.endDate || e.endDate)));
    assert.ok(key(e.endDate) >= last, `${e.employer} ends before its last position`);
  }
  assert.ok(checked >= 1);
});
