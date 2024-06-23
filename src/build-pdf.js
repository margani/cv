const fs = require("fs");
const puppeteer = require("puppeteer");

(async function () {
  const content = fs.readFileSync("dist/index.html", "utf8");
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(content);
  await page.evaluateHandle("document.fonts.ready");

  const pdfContents = await page.pdf({ format: "A4" });
  await browser.close();

  fs.mkdirSync('latest')
  fs.writeFileSync("latest/Hossein-Margani-CV.pdf", pdfContents);
})();
