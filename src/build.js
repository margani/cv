const fs = require("fs");
const nunjucks = require("nunjucks");
const nunjucksDate = require("nunjucks-date");
const { dateDiff, shortUrl, resolveLastUpdated, icon, fontFaces } = require("./lib");

function build({ out = "dist/index.html" } = {}) {
  const env = nunjucks.configure({ autoescape: true });
  nunjucksDate.setDefaultFormat("MMMM Do YYYY, h:mm:ss a");
  env.addFilter("dateFormat", nunjucksDate);
  env.addFilter("dateDiff", dateDiff);
  env.addFilter("shortUrl", shortUrl);
  env.addFilter("top", (array, n = 1) => array.slice(0, n));
  env.addGlobal("isArray", Array.isArray);
  env.addGlobal("icon", (name) => new nunjucks.runtime.SafeString(icon(name)));

  const data = JSON.parse(fs.readFileSync("src/cv.json", "utf8"));
  const rendered = env.renderString(fs.readFileSync("src/cv.njk", "utf8"), {
    ...data,
    fontFaces: new nunjucks.runtime.SafeString(fontFaces()),
    lastUpdated: resolveLastUpdated(data, "src/cv.json"),
  });

  fs.mkdirSync(require("path").dirname(out), { recursive: true });
  fs.writeFileSync(out, rendered);
  return rendered;
}

if (require.main === module) build();

module.exports = { build };
