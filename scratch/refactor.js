const fs = require('fs');
const path = require('path');

const clientAppDir = path.join(__dirname, '../client/app');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('/api') && !file.includes('\\api')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(clientAppDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let original = content;

  // Check if it uses fetch to /api/
  if (content.includes('fetch("/api/') || content.includes("fetch(`/api/")) {
    
    // Add import if not present
    if (!content.includes('import { apiClient }')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import .* from .*$/gm)];
      if (importMatches.length > 0) {
        const lastMatch = importMatches[importMatches.length - 1];
        const insertIndex = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, insertIndex) + '\nimport { apiClient } from "@/lib/apiClient";' + content.slice(insertIndex);
      } else {
        // Just put it at the top
        content = 'import { apiClient } from "@/lib/apiClient";\n' + content;
      }
    }

    // Replace fetch( with apiClient(
    // We want to be careful not to replace fetch if it's fetching from external URLs
    // But since we checked for fetch("/api/" or fetch(`/api/, we can target those specifically
    content = content.replace(/fetch\(\s*["']\/api\//g, 'apiClient("/api/');
    content = content.replace(/fetch\(\s*`\/api\//g, 'apiClient(`/api/');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf-8');
      changedCount++;
      console.log(`Updated ${file}`);
    }
  }
});

console.log(`Refactored ${changedCount} files.`);
