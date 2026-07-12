const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      processDir(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let c = fs.readFileSync(full, 'utf8');
      const original = c;
      
      // Fix primary button text color corruption (it shouldn't have text-gray-900 if bg is blue)
      c = c.replace(/bg-blue-600(.*?)dark:text-white text-gray-900/g, 'bg-blue-600$1text-white');
      c = c.replace(/bg-blue-500(.*?)dark:text-white text-gray-900/g, 'bg-blue-500$1text-white');
      
      // Fix translucent white backgrounds
      c = c.replace(/(?<!dark:)\bbg-white\/5\b/g, 'dark:bg-white/5 bg-gray-100');
      c = c.replace(/(?<!dark:)\bbg-white\/10\b/g, 'dark:bg-white/10 bg-gray-200');
      c = c.replace(/(?<!dark:)\bbg-white\/15\b/g, 'dark:bg-white/15 bg-gray-300');
      c = c.replace(/(?<!dark:)\bbg-white\/20\b/g, 'dark:bg-white/20 bg-gray-300');
      
      // Fix hover translucent white
      c = c.replace(/(?<!dark:)\bhover:bg-white\/5\b/g, 'hover:dark:bg-white/5 hover:bg-gray-100');
      c = c.replace(/(?<!dark:)\bhover:bg-white\/10\b/g, 'hover:dark:bg-white/10 hover:bg-gray-200');
      c = c.replace(/(?<!dark:)\bhover:bg-white\/15\b/g, 'hover:dark:bg-white/15 hover:bg-gray-300');
      c = c.replace(/(?<!dark:)\bhover:bg-white\/20\b/g, 'hover:dark:bg-white/20 hover:bg-gray-300');
      
      // Fix active translucent white
      c = c.replace(/(?<!dark:)\bactive:bg-white\/5\b/g, 'active:dark:bg-white/5 active:bg-gray-100');
      c = c.replace(/(?<!dark:)\bactive:bg-white\/10\b/g, 'active:dark:bg-white/10 active:bg-gray-200');
      c = c.replace(/(?<!dark:)\bactive:bg-white\/15\b/g, 'active:dark:bg-white/15 active:bg-gray-300');
      c = c.replace(/(?<!dark:)\bactive:bg-white\/20\b/g, 'active:dark:bg-white/20 active:bg-gray-300');

      if (c !== original) {
        fs.writeFileSync(full, c, 'utf8');
        console.log('Fixed buttons in', full);
      }
    }
  }
}
processDir('src');
