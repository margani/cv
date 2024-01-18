const { exec } = require('child_process');
const fs = require('fs')
const nunjucks = require('nunjucks')
var nunjucksDate = require('nunjucks-date')

function getLastCommitDate(filePath) {
  return new Promise((resolve, reject) => {
    const command = `git log -1 --format=%ad -- ${filePath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      const lastCommitDate = stdout.trim();
      resolve(lastCommitDate);
    });
  });
}

const env = nunjucks.configure({ autoescape: true })

nunjucksDate.setDefaultFormat('MMMM Do YYYY, h:mm:ss a')
env.addFilter('dateFormat', nunjucksDate)
env.addFilter('dateDiff', function (from, to) {
  const msInDay = 24 * 60 * 60 * 1000
  const fromTime = from
    ? new Date(Date.parse(from)).getTime()
    : new Date().getTime()
  const toTime = new Date(Date.parse(to)).getTime()
  const dateDiff = fromTime - toTime
  const days = dateDiff / msInDay
  const years = Math.floor(days / 365)
  const remainingDays = days % 365
  const months = remainingDays > 0 ? Math.floor(remainingDays / 30) : 0
  let yrs = ''
  let mos = ''
  let space = ''
  if (years > 0) {
    yrs = `${years} yr`
    if (years > 1) yrs += 's'
    if (months > 0) space = ' '
  }
  if (months > 0) {
    mos = `${months} mo`
    if (months > 1) mos += 's'
  }
  return `${yrs}${space}${mos}`
})

env.addFilter('shortUrl', function (url) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^\/|\/$/g, '')
    .replace(/^linkedin\.com/, '')
})

env.addGlobal('isArray', function (obj) {
  return Array.isArray(obj)
})

env.addFilter('top', function (array, n = 1) {
  return array.slice(0, n)
});

(async () => {
  const content = fs.readFileSync('src/cv.njk', 'utf8')
  const data = JSON.parse(fs.readFileSync('src/cv.json', 'utf8'))
  const rendered = env.renderString(content, {
    ...data,
    lastUpdated: await getLastCommitDate('src/cv.json')
  })

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true })
  }
  fs.writeFileSync('dist/index.html', rendered)
})()
