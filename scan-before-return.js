const fs = require('fs');
const content = fs.readFileSync('app/onderzoeken/OnderzoekenTable.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;

console.log('Balance from start to line 828:\n');

for (let i = 0; i < 828; i++) {
  const line = lines[i];
  const withoutStrings = line
    .replace(/'[^']*'/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/\/\/.*/g, '');

  const openCount = (withoutStrings.match(/{/g) || []).length;
  const closeCount = (withoutStrings.match(/}/g) || []).length;
  braceCount += openCount - closeCount;

  // Show all lines from 400-430 for detailed inspection
  if (i >= 395 && i <= 435) {
    console.log(`${(i + 1).toString().padStart(4)}: balance=${braceCount.toString().padStart(2)} | ${line}`);
  }
}

console.log(`\nBalance at line 828: ${braceCount}`);