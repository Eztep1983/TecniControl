const fs = require('fs');
['src/components/clientes/ClienteSimpleFormModal.tsx', 'src/components/clientes/DispositivoFormModal.tsx'].forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Fix reversed borders
  c = c.replace(/dark:border-white border-gray-200\/\[0\.0[68]\]/g, match => {
    const num = match.slice(-3, -1);
    return 'dark:border-white/[0.' + num + '] border-gray-300';
  });

  // Fix inputs with bg-white/[0.04] (transparent white) without dark mode prefix
  c = c.replace(/"bg-white\/\[0\.04\]/g, '"dark:bg-white/[0.04] bg-white');
  
  // Fix button backgrounds with bg-white without dark prefix
  c = c.replace(/"bg-white\/\[0\.06\]/g, '"dark:bg-white/[0.06] bg-gray-200');
  c = c.replace(/"bg-white\/\[0\.03\]/g, '"dark:bg-white/[0.03] bg-gray-100');
  c = c.replace(/bg-white\/\[0\.02\]/g, 'dark:bg-white/[0.02] bg-gray-100');

  // Fix focus borders
  c = c.replace(/focus:dark:border-white\/20 focus:border-gray-200 focus:bg-white\/\[0\.06\]/g, 'focus:dark:border-white/20 focus:border-blue-500 focus:dark:bg-white/[0.06] focus:bg-white');

  // Fix active background without dark prefix
  c = c.replace(/active:bg-white\/\[0\.15\]/g, 'active:dark:bg-white/[0.15] active:bg-gray-300');

  // Fix hover background
  c = c.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:dark:bg-white/[0.04] hover:bg-gray-200');
  c = c.replace(/hover:bg-white\/\[0\.06\]/g, 'hover:dark:bg-white/[0.06] hover:bg-gray-300');
  c = c.replace(/hover:bg-white\/\[0\.07\]/g, 'hover:dark:bg-white/[0.07] hover:bg-gray-300');

  // Fix border-t missing opacity in dark mode
  c = c.replace(/border-t dark:border-white border-gray-200\/\[0\.06\]/g, 'border-t dark:border-white/[0.06] border-gray-300');

  fs.writeFileSync(file, c, 'utf8');
  console.log('Fixed', file);
});
