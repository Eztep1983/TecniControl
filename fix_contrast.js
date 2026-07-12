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

      // Fix un-prefixed text-white (we'll replace with dark:text-white text-gray-900)
      // but we have to be careful with primary buttons that already have text-white
      // Wait, primary buttons are fine if they just have text-white. 
      // If we replace text-white with dark:text-white text-gray-900 globally, it might break primary buttons again.
      // So let's NOT blindly replace text-white. I will manually fix it in formulario.tsx instead.

      if (c !== original) {
        fs.writeFileSync(full, c, 'utf8');
        console.log('Fixed contrast in', full);
      }
    }
  }
}

processDir('src/app');
