const fs = require('fs');
const path = require('path');

const coursesDir = 'e:/Craft soft/Website/courses';

// Get all course subdirectories
const courseFolders = fs.readdirSync(coursesDir).filter(f => {
    const fullPath = path.join(coursesDir, f);
    return fs.statSync(fullPath).isDirectory();
});

courseFolders.forEach(folder => {
    const indexPath = path.join(coursesDir, folder, 'index.html');
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');

        // Fix the curriculum div that starts at column 0 (outside container)
        // Replace unindented <div class="course-curriculum"> with properly indented version
        content = content.replace(/\n<div class="course-curriculum">/g, '\n      <div class="course-curriculum">');

        fs.writeFileSync(indexPath, content, 'utf8');
        console.log(`Fixed: ${folder}/index.html`);
    }
});

console.log('Structure fix complete!');
