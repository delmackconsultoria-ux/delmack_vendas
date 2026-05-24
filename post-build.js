const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist/public/index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

// Remover CSS inline (tudo entre <style>...</style>)
html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');

// Adicionar link para CSS externo se não existir
if (!html.includes('index-C3MkddfX.css')) {
  html = html.replace(
    '</head>',
    '<link rel="stylesheet" href="/assets/index-C3MkddfX.css" /></head>'
  );
}

fs.writeFileSync(indexPath, html);
console.log('✅ CSS inline removido do index.html');
