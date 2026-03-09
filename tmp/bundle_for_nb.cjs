const fs = require('fs');
const path = require('path');

const filesToInclude = [
  'server.js',
  'public/index.html',
  'public/js/client_logic_full.js',
  'public/css/style.css',
  'public/config/ui-buttons.json'
];

let outputTxt = "VPE Prompt Builder 2026 - Source Code Dump for NotebookLM\n\n";

for (const file of filesToInclude) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    outputTxt += `\n\n=======================================================\n`;
    outputTxt += `FILE: ${file}\n`;
    outputTxt += `=======================================================\n\n`;
    outputTxt += content;
  }
}

const outPath = path.join(process.env.USERPROFILE || 'C:\\Users\\TOT', 'Desktop', 'VPE_Site_Code_For_NotebookLM.txt');
fs.writeFileSync(outPath, outputTxt);
console.log("Saved bundle to:", outPath);
