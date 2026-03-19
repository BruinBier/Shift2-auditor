const fs = require('fs');
const content = fs.readFileSync('app/onderzoeken/OnderzoekenTable.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
for (let i = 0; i < 100; i++) {
  const line = lines[i];
  const withoutStrings = line
    .replace(/'[^']*'/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/\/\/.*/g, '');

  const openCount = (withoutStrings.match(/{/g) || []).length;
  const closeCount = (withoutStrings.match(/}/g) || []).length;
  braceCount += openCount - closeCount;

  if (i >= 40 && i <= 60 && (openCount > 0 || closeCount > 0 || line.includes('function') || line.includes('export'))) {
    console.log(`Line ${i + 1}: balance=${braceCount}, open=${openCount}, close=${closeCount} - ${line}`);
  }
}