const test = require("node:test");
const assert = require("node:assert/strict");
const { dateDiff, shortUrl, resolveLastUpdated, icon } = require("../src/lib");
const { samePdf } = require("../src/pdf-compare");

test("dateDiff counts whole calendar months", () => {
  assert.equal(dateDiff("June 2024", "Aug 2022", " (", ")"), " (1 yr 10 mos)");
  assert.equal(dateDiff("Oct 2018", "Oct 2017"), "1 yr");
  assert.equal(dateDiff("Sep 2017", "Mar 2016"), "1 yr 6 mos");
  assert.equal(dateDiff("Mar 2024", "Feb 2024"), "1 mo");
  assert.equal(dateDiff("May 2010", "May 2006"), "4 yrs");
});

test("dateDiff is not skewed by 30/365-day approximation", () => {
  // The old day-based maths (verified against the previous build.js) returned
  // "" for Feb->Mar 2016 and "1 yr" for Feb 2016->Mar 2017.
  assert.equal(dateDiff("Mar 2016", "Feb 2016"), "1 mo");
  assert.equal(dateDiff("Mar 2017", "Feb 2016"), "1 yr 1 mo");
  assert.equal(dateDiff("May 2016", "Feb 2016"), "3 mos");
});

test("dateDiff returns empty for zero or negative spans and throws on bad input", () => {
  assert.equal(dateDiff("Jan 2024", "Jan 2024", "(", ")"), "");
  assert.equal(dateDiff("Jan 2023", "Jan 2024"), "");
  assert.throws(() => dateDiff("2024", "Jan 2023"), /Unparseable/);
});

test("shortUrl strips scheme, www, slashes and linkedin host", () => {
  assert.equal(shortUrl("https://www.example.com/"), "example.com");
  assert.equal(shortUrl("https://www.linkedin.com/in/me/"), "/in/me");
});

test("resolveLastUpdated prefers explicit value and rejects invalid ones", () => {
  assert.equal(resolveLastUpdated({ lastUpdated: "2025-01-02" }, "x").toISOString().slice(0, 10), "2025-01-02");
  assert.throws(() => resolveLastUpdated({ lastUpdated: "nope" }, "x"), /Invalid lastUpdated/);
});

test("resolveLastUpdated falls back to build time outside a git checkout", () => {
  const before = Date.now();
  const date = resolveLastUpdated({}, "missing.json", require("os").tmpdir());
  assert.ok(date.getTime() >= before - 1000);
});

test("icon inlines an SVG and rejects path traversal", () => {
  assert.match(icon("earth"), /^<svg[^>]*class="icon"/);
  assert.doesNotMatch(icon("earth"), /<title>/);
  assert.throws(() => icon("../package"), /Bad icon name/);
});

test("samePdf ignores timestamps and IDs but not content", () => {
  const pdf = (date, id, body) =>
    Buffer.from(`/CreationDate (D:${date})\n/ModDate (D:${date})\n${body}\n/ID [<${id}> <${id}>]`);
  assert.ok(samePdf(pdf("2026", "AA", "x"), pdf("2027", "BB", "x")));
  assert.ok(!samePdf(pdf("2026", "AA", "x"), pdf("2026", "AA", "y")));
  assert.ok(samePdf(new Uint8Array(pdf("2026", "AA", "x")), pdf("2027", "BB", "x")));
});
