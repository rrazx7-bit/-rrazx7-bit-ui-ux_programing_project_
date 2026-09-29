const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: wait } = require('node:timers/promises');

const baseURL = 'https://rrazx7-bit.github.io/-rrazx7-bit-ui-ux_programing_project_/';
const files = ['index.html', 'style.css', 'script.js'];

async function waitForPublishedFiles() {
  for (let attempt = 1; attempt <= 18; attempt++) {
    const matches = await Promise.all(files.map(async name => {
      try {
        const url = new URL(name, baseURL);
        url.searchParams.set('revision', process.env.GITHUB_SHA || 'current');
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        return response.ok && await response.text() === fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
      } catch {
        return false;
      }
    }));
    if (matches.every(Boolean)) {
      console.log('Published HTML, CSS and JavaScript match this commit.');
      return;
    }
    console.log(`Waiting for Pages (${attempt}/18): ${files.filter((_, i) => !matches[i]).join(', ')}`);
    if (attempt < 18) await wait(10000);
  }
  throw new Error('Pages did not publish the current source files in time.');
}

waitForPublishedFiles().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
