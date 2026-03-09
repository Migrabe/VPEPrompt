const fs = require('fs');

let file = 'c:/Users/TOT/Documents/MOVEVPE/public/js/client_logic_full.js';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/notify\("AI-улучшение не настроено: задайте GROQ_API_KEY в \.env", "warn"\);/g, 'notify("Не удалось улучшить промпт (возможно, ошибка проксирования VEO)", "warn");');
data = data.replace(/aiProvider:\s*"groq",\s*apiKey:\s*"",?\n?/g, '');
data = data.replace(/async\s+function\s+callGroq[\s\S]*?return\s+data\.choices\?\.\[0\]\?\.message\?\.content\s*\|\|\s*"";\s*\n\}/g, '');

fs.writeFileSync(file, data);

let file2 = 'c:/Users/TOT/Documents/MOVEVPE/public/js/client_logic.js';
let data2 = fs.readFileSync(file2, 'utf8');
data2 = data2.replace(/notify\("AI-улучшение не настроено: задайте GROQ_API_KEY в \.env", "warn"\);/g, 'notify("Не удалось улучшить промпт (возможно, ошибка проксирования VEO)", "warn");');
data2 = data2.replace(/aiProvider:\s*"groq",\s*apiKey:\s*"",?\n?/g, '');
data2 = data2.replace(/async\s+function\s+callGroq[\s\S]*?return\s+data\.choices\?\.\[0\]\?\.message\?\.content\s*\|\|\s*"";\s*\n\}/g, '');
fs.writeFileSync(file2, data2);

let file3 = 'c:/Users/TOT/Documents/MOVEVPE/server.js';
let data3 = fs.readFileSync(file3, 'utf8');
data3 = data3.replace(/GROQ_API_KEY/g, 'VEO_PROXY');
fs.writeFileSync(file3, data3);

console.log("Done replacing.");
