// Strip the fields Chrome varies between otherwise identical renders.
function normalize(buffer) {
  return Buffer.from(buffer)
    .toString("latin1")
    .replace(/\/(CreationDate|ModDate) \(.*?\)/g, "")
    .replace(/\/ID \[.*?\]/g, "");
}

function samePdf(a, b) {
  return normalize(a) === normalize(b);
}

module.exports = { samePdf, normalize };
