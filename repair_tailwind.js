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
      
      // Fix broken modifiers: hover:dark:X Y -> hover:dark:X hover:Y
      const regex = /(hover|active|focus|group-hover):dark:([a-zA-Z0-9-\/]+)\s+((?:bg|text|border|ring)-[a-zA-Z0-9-\/]+)/g;
      
      c = c.replace(regex, (match, modifier, darkClass, lightClass) => {
        return `${modifier}:dark:${darkClass} ${modifier}:${lightClass}`;
      });
      
      if (c !== original) {
        fs.writeFileSync(full, c, 'utf8');
        console.log('Repaired modifiers in', full);
      }
    }
  }
}
processDir('src');
