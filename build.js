const fs = require('fs')
const nunjucks = require('nunjucks')

const env = nunjucks.configure({ autoescape: true })
const content = fs.readFileSync('src/cv.njk', 'utf8')
const data = JSON.parse(fs.readFileSync('src/cv.json', 'utf8'))
const rendered = env.renderString(content, data)

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true })
}
fs.writeFileSync('dist/index.html', rendered)
