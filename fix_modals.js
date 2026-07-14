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
      
      // Fix background hover missing dark prefixes
      c = c.replace(/(?<!dark:)hover:bg-gray-700/g, 'hover:dark:bg-gray-700 hover:bg-gray-300');
      c = c.replace(/(?<!dark:)active:bg-gray-650/g, 'active:dark:bg-gray-600 active:bg-gray-300');
      c = c.replace(/(?<!dark:)active:bg-gray-600/g, 'active:dark:bg-gray-600 active:bg-gray-300');
      
      // Fix bg-gray-700/60
      c = c.replace(/\bbg-gray-700\/60 hover:dark:bg-gray-700 hover:bg-gray-300\b/g, 'dark:bg-gray-700/60 bg-gray-200 hover:dark:bg-gray-700 hover:bg-gray-300');
      c = c.replace(/\bbg-gray-700\/60 hover:bg-gray-700\b/g, 'dark:bg-gray-700/60 bg-gray-200 hover:dark:bg-gray-700 hover:bg-gray-300');

      const contrastMap = {
        '200': '800',
        '300': '700',
        '400': '700',
        '500': '600'
      };

      const regex = /(?<!dark:)\b((?:hover:|active:|focus:|group-hover:)?)text-(blue|purple|green|emerald|amber|orange|red)-(200|300|400|500)\b/g;
      
      c = c.replace(regex, (match, modifier, color, weight) => {
        const lightWeight = contrastMap[weight];
        const mod = modifier || '';
        return `${mod}dark:text-${color}-${weight} ${mod}text-${color}-${lightWeight}`;
      });
      
      if (c !== original) {
        fs.writeFileSync(full, c, 'utf8');
        console.log('Fixed contrast in', full);
      }
    }
  }
}

processDir('src/components');
