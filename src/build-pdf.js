const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { samePdf } = require("./pdf-compare");

(async function () {
  const content = fs.readFileSync("dist/index.html", "utf8");
  const data = JSON.parse(fs.readFileSync("src/cv.json", "utf8"));

  // CI runners (Ubuntu 24.04) block Chrome's user-namespace sandbox. The page is
  // our own HTML and, below, is forbidden from making network requests.
  const browser = await puppeteer.launch({
    headless: true,
    args: process.env.CI ? ["--no-sandbox"] : [],
  });
  try {
    const page = await browser.newPage();
    // The page must be self-contained: a CDN outage or slow font must never be
    // able to produce a broken PDF that then gets committed.
    const external = [];
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = request.url();
      if (url.startsWith("data:") || url === "about:blank") return request.continue();
      external.push(url);
      return request.abort();
    });
    await page.setContent(content);
    await page.evaluateHandle("document.fonts.ready");
    if (external.length) {
      throw new Error(`CV HTML requested external resources:\n${external.join("\n")}`);
    }

    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      tagged: true,
      outline: true,
    });

    const target = path.join("latest", data.output.fileName);
    fs.mkdirSync("latest", { recursive: true });
    // Chrome stamps creation time and a random ID into every PDF, so identical
    // content still produced a new binary commit each run.
    if (fs.existsSync(target) && samePdf(fs.readFileSync(target), pdf)) {
      console.log(`${target} unchanged; keeping existing file`);
    } else {
      fs.writeFileSync(target, pdf);
      console.log(`${target} written`);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
