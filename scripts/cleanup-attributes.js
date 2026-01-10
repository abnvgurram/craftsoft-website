const fs = require('fs');
const path = require('path');

const rootDir = 'e:/Craft soft/Website';
const coursesDir = path.join(rootDir, 'courses');

function fixHtmlContent(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Remove incorrectly placed 'selected' attribute from common tags
    // Target tags: title, span, li, h1, h2, h3, div
    content = content.replace(/<(title|span|li|h1|h2|h3|div)([^>]*?)\sselected([^>]*?)>/gi, '<$1$2$3>');

    // 2. Fix specific casing issues
    // DEVOPS -> DevOps
    content = content.replace(/DEVOPS/g, 'DevOps');

    // RESUME -> Resume
    content = content.replace(/RESUME/g, 'Resume');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed attributes/casing in: ${filePath}`);
    }
}

// Traverse courses directory
if (fs.existsSync(coursesDir)) {
    const items = fs.readdirSync(coursesDir);
    items.forEach(item => {
        const fullPath = path.join(coursesDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            const indexPath = path.join(fullPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                fixHtmlContent(indexPath);
            }
        }
    });

    // Also check courses/index.html
    const mainCoursesIndex = path.join(coursesDir, 'index.html');
    if (fs.existsSync(mainCoursesIndex)) {
        fixHtmlContent(mainCoursesIndex);
    }
}

// Also check root index.html
const rootIndex = path.join(rootDir, 'index.html');
if (fs.existsSync(rootIndex)) {
    fixHtmlContent(rootIndex);
}

console.log('Cleanup script finished!');
