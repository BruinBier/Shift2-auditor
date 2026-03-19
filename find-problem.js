const fs = require('fs');
const content = fs.readFileSync('app/onderzoeken/OnderzoekenTable.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let lastBalance = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const withoutStrings = line
    .replace(/'[^']*'/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/\/\/.*/g, '');

  const openCount = (withoutStrings.match(/{/g) || []).length;
  const closeCount = (withoutStrings.match(/}/g) || []).length;
  braceCount += openCount - closeCount;

  // Look for suspicious jumps
  if (braceCount - lastBalance > 1) {
    console.log(`SUSPICIOUS: Line ${i + 1}: balance jumped from ${lastBalance} to ${braceCount}`);
    console.log(`  ${lines[i]}`);
  }

  // Show lines with unusual patterns near the component function
  if (i >= 40 && i <= 50 && (openCount > 0 || closeCount > 0)) {
    console.log(`Line ${i + 1}: balance=${braceCount} (was ${lastBalance}), open=${openCount}, close=${closeCount}`);
    console.log(`  ${line}`);
  }

  lastBalance = braceCount;
}

console.log(`\nFinal balance: ${braceCount}`);