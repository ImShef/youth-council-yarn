import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixBuild() {
  const buildDir = path.join(__dirname, 'build');
  
  // Проверяем существование папки build
  if (!fs.existsSync(buildDir)) {
    console.log('❌ Папка build не найдена. Сначала выполните: yarn build');
    return;
  }

  const indexHtmlPath = path.join(buildDir, 'index.html');
  
  // Проверяем index.html
  if (fs.existsSync(indexHtmlPath)) {
    let content = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Проверяем наличие div#root
    if (!content.includes('<div id="root"></div>')) {
      console.log('⚠️  Добавляем div#root в index.html');
      content = content.replace('<div id="root">', '<div id="root"></div>');
    }
    
    // Проверяем наличие скриптов
    if (!content.includes('/static/js/') && !content.includes('./static/js/')) {
      console.log('⚠️  Добавляем базовый скрипт в index.html');
      content = content.replace(
        '</body>',
        '<script src="/static/js/main.js"></script></body>'
      );
    }
    
    fs.writeFileSync(indexHtmlPath, content);
    console.log('✅ index.html проверен и исправлен');
  }

  // Проверяем папку static
  const staticDir = path.join(buildDir, 'static');
  if (!fs.existsSync(staticDir)) {
    console.log('📁 Создаем папки static');
    fs.mkdirSync(path.join(staticDir, 'js'), { recursive: true });
    fs.mkdirSync(path.join(staticDir, 'css'), { recursive: true });
  }

  console.log('✅ Проверка сборки завершена');
}

fixBuild();