const fs = require('fs');
const path = require('path');

/**
 * This script runs during the Netlify build process.
 * It replaces placeholders in the JavaScript files with actual 
 * Environment Variables from the Netlify dashboard.
 */

const filesToProcess = [
    'assets/js/supabase-website-config.js',
    'assets/admin/js/supabase-config.js'
    // Add other files here if they use environment variables
];

console.log('--- Injecting Environment Variables ---');

filesToProcess.forEach(filePath => {
    const absolutePath = path.resolve(__dirname, '..', filePath);

    if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️ File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(absolutePath, 'utf8');

    // Replace placeholders with Netlify Env Variables
    const keys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

    let modified = false;
    keys.forEach(key => {
        const placeholder = `[[${key}]]`;
        if (content.includes(placeholder)) {
            const value = process.env[key];
            if (value) {
                content = content.split(placeholder).join(value);
                console.log(`✅ Injected ${key} into ${filePath}`);
                modified = true;
            } else {
                console.error(`❌ Missing Environment Variable: ${key}`);
            }
        }
    });

    if (modified) {
        fs.writeFileSync(absolutePath, content);
    }
});

console.log('--- Injection Complete ---');
