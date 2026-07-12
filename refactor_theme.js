const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { search: /(?<!dark:)bg-gray-950\/70/g, replace: 'dark:bg-gray-950/70 bg-white' },
  { search: /(?<!dark:)bg-gray-950\/80/g, replace: 'dark:bg-gray-950/80 bg-gray-50' },
  { search: /(?<!dark:)bg-gray-950\/95/g, replace: 'dark:bg-gray-950/95 bg-white' },
  { search: /(?<!dark:)bg-gray-900\/95/g, replace: 'dark:bg-gray-900/95 bg-gray-100/95' },
  { search: /(?<!dark:)bg-gray-900\/90/g, replace: 'dark:bg-gray-900/90 bg-gray-50' },
  { search: /(?<!dark:)bg-gray-900\/80/g, replace: 'dark:bg-gray-900/80 bg-gray-100' },
  { search: /(?<!dark:)bg-gray-900\/30/g, replace: 'dark:bg-gray-900/30 bg-gray-100' },
  { search: /(?<!dark:)bg-gray-900(?!\/)/g, replace: 'dark:bg-gray-900 bg-gray-100' },
  
  { search: /(?<!dark:)bg-gray-800\/80/g, replace: 'dark:bg-gray-800/80 bg-gray-200/80' },
  { search: /(?<!dark:)bg-gray-800\/50/g, replace: 'dark:bg-gray-800/50 bg-gray-200' },
  { search: /(?<!dark:)bg-gray-800\/30/g, replace: 'dark:bg-gray-800/30 bg-gray-100' },
  { search: /(?<!dark:)bg-gray-800(?!\/)/g, replace: 'dark:bg-gray-800 bg-gray-200' },

  { search: /(?<!dark:)bg-slate-950\/70/g, replace: 'dark:bg-slate-950/70 bg-white' },
  { search: /(?<!dark:)bg-slate-950\/95/g, replace: 'dark:bg-slate-950/95 bg-white' },
  { search: /(?<!dark:)bg-slate-900\/70/g, replace: 'dark:bg-slate-900/70 bg-gray-100' },
  { search: /(?<!dark:)bg-slate-900(?!\/)/g, replace: 'dark:bg-slate-900 bg-gray-100' },
  
  { search: /(?<!dark:)bg-slate-800\/80/g, replace: 'dark:bg-slate-800/80 bg-gray-200/80' },
  { search: /(?<!dark:)bg-slate-800\/50/g, replace: 'dark:bg-slate-800/50 bg-gray-200' },
  { search: /(?<!dark:)bg-slate-800\/30/g, replace: 'dark:bg-slate-800/30 bg-gray-100' },
  { search: /(?<!dark:)bg-slate-800(?!\/)/g, replace: 'dark:bg-slate-800 bg-gray-200' },

  { search: /(?<!dark:)bg-slate-50(?!\/)/g, replace: 'dark:bg-slate-900 bg-slate-50' },
  { search: /(?<!dark:)bg-slate-100(?!\/)/g, replace: 'dark:bg-slate-800 bg-slate-100' },

  { search: /(?<!dark:)bg-gray-700\/50/g, replace: 'dark:bg-gray-700/50 bg-gray-300' },

  // Text colors
  { search: /(?<!dark:)text-white/g, replace: 'dark:text-white text-gray-900' },
  { search: /(?<!dark:)text-gray-400/g, replace: 'dark:text-gray-400 text-gray-600' },
  { search: /(?<!dark:)text-gray-300/g, replace: 'dark:text-gray-300 text-gray-700' },
  { search: /(?<!dark:)text-gray-200/g, replace: 'dark:text-gray-200 text-gray-800' },
  
  { search: /(?<!dark:)text-slate-400/g, replace: 'dark:text-slate-400 text-slate-600' },
  { search: /(?<!dark:)text-slate-300/g, replace: 'dark:text-slate-300 text-slate-700' },
  { search: /(?<!dark:)text-slate-200/g, replace: 'dark:text-slate-200 text-slate-800' },

  { search: /(?<!dark:)text-slate-900/g, replace: 'dark:text-slate-100 text-slate-900' },
  { search: /(?<!dark:)text-slate-800/g, replace: 'dark:text-slate-200 text-slate-800' },
  { search: /(?<!dark:)text-slate-700/g, replace: 'dark:text-slate-300 text-slate-700' },
  { search: /(?<!dark:)text-slate-600/g, replace: 'dark:text-slate-400 text-slate-600' },
  { search: /(?<!dark:)text-slate-500/g, replace: 'dark:text-slate-400 text-slate-500' },

  // Borders
  { search: /(?<!dark:)border-white\/10/g, replace: 'dark:border-white/10 border-gray-300/50' },
  { search: /(?<!dark:)border-gray-800/g, replace: 'dark:border-gray-800 border-gray-200' },
  { search: /(?<!dark:)border-gray-700\/50/g, replace: 'dark:border-gray-700/50 border-gray-300' },
  { search: /(?<!dark:)border-gray-700(?!\/)/g, replace: 'dark:border-gray-700 border-gray-300' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { search, replace } of replacements) {
        if (search.test(content)) {
          content = content.replace(search, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
console.log('Refactor complete.');
