const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

function checkFile(filename) {
  console.log('Checking', filename);
  const html = fs.readFileSync(filename, 'utf8');
  const dom = new JSDOM(html);
  const scripts = dom.window.document.querySelectorAll('script');
  scripts.forEach((script, idx) => {
    try {
      if (script.textContent) {
        new Function(script.textContent);
        console.log(`Script ${idx} in ${filename} is syntactically valid.`);
      }
    } catch (e) {
      console.error(`Syntax error in ${filename} script ${idx}:`, e.message);
    }
  });
}

try {
  checkFile('index.html');
  checkFile('app.html');
} catch(e) {
  console.log("Error loading jsdom", e);
}
