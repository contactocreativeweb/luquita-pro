const fs = require('fs');
function validateHTML(filename) {
    const content = fs.readFileSync(filename, 'utf8');
    const tags = [];
    const regex = /<\/?([a-z0-9]+)[^>]*>/gi;
    let match;
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    
    let isError = false;
    while ((match = regex.exec(content)) !== null) {
        const tagName = match[1].toLowerCase();
        if (voidElements.includes(tagName)) continue;
        
        if (match[0].startsWith('</')) {
            if (tags.length === 0) {
                console.error(`Extra closing tag in ${filename}: </${tagName}> at index ${match.index}`);
                isError = true;
                break;
            }
            const last = tags.pop();
            if (last !== tagName) {
                console.error(`Mismatched tags in ${filename}: Expected </${last}> but found </${tagName}> at index ${match.index}`);
                isError = true;
                break;
            }
        } else {
            tags.push(tagName);
        }
    }
    if (!isError && tags.length > 0) {
        console.error(`Unclosed tags in ${filename}: ${tags.join(', ')}`);
        isError = true;
    }
    if (!isError) {
        console.log(`${filename} tags are properly closed.`);
    }
}
validateHTML('index.html');
validateHTML('app.html');
