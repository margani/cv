const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

(async function () {
  const content = fs.readFileSync("dist/index.html", "utf8");
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(content);
  await page.evaluateHandle("document.fonts.ready");
  await page.waitForNetworkIdle();

  const pdfContents = await page.pdf({ format: "A4" });
  await browser.close();

  const cvFolderPath = 'latest';
  if (!fs.existsSync(cvFolderPath)) {
    fs.mkdirSync(cvFolderPath);
  }

  const cvFilePath = path.join(cvFolderPath, "Hossein-Margani-CV.pdf");
  fs.writeFileSync(cvFilePath, pdfContents);
})();
