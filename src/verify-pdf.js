// Exit 0 only if every check ran and passed; exit 2 if poppler is missing.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync("src/cv.json", "utf8"));
const file = path.join("latest", data.output.fileName);
const MAX_PAGES = 2;

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8" });
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(`${cmd} not found (install poppler-utils); cannot verify ${file}`);
      process.exit(2);
    }
    throw error;
  }
}

let ran = 0;
const failures = [];
function check(name, ok, detail) {
  ran++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : ` (${detail})`}`);
  if (!ok) failures.push(name);
}

const info = run("pdfinfo", [file]);
const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
check(`at most ${MAX_PAGES} pages`, pages >= 1 && pages <= MAX_PAGES, `got ${pages}`);
check("tagged", /^Tagged:\s+yes/m.test(info), "Tagged is not yes");

const fonts = run("pdffonts", [file]).split("\n").slice(2).filter(Boolean);
check("has embedded fonts", fonts.length > 0, "none found");
check("no Type 3 fonts", fonts.length > 0 && fonts.every((l) => !/\sType 3\s/.test(l)), "Type 3 font present");
check("fonts are embedded", fonts.length > 0 && fonts.every((l) => /\syes\s+yes\s/.test(l)), "unembedded font");

const text = run("pdftotext", [file, "-"]);
check("contains name", text.includes(data.name), "name missing from text layer");
check("contains email", text.includes(data.details.email), "email missing from text layer");

if (failures.length || ran < 6) {
  console.error(`${failures.length} failed, ${ran} ran`);
  process.exit(1);
}
console.log(`${ran} checks passed`);
