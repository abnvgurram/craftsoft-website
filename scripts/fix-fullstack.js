const fs = require('fs');

const indexPath = 'e:/Craft soft/Website/courses/full-stack/index.html';
let content = fs.readFileSync(indexPath, 'utf8');

// Replace with CRLF and LF patterns
content = content.replace(/      <\/div>\r?\n      <!-- Curriculum -->/g, '      <!-- Curriculum -->');

fs.writeFileSync(indexPath, content, 'utf8');
console.log('Done!');
