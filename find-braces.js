const fs = require('fs');
const content = fs.readFileSync('C:/Users/ellen/IdeaProjects/Shift2-auditor/app/onderzoeken/OnderzoekenTable.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let linesBefore828 = [];

for (let i = 0; i < Math.min(lines.length, 828); i++) {
  const line = lines[i];

  // Very simple: just count braces, ignoring strings
  const withoutStrings = line
    .replace(/'[^']*'/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/\/\/.*/g, '');

  const openCount = (withoutStrings.match(/{/g) || []).length;
  const closeCount = (withoutStrings.match(/}/g) || []).length;

  braceCount += openCount - closeCount;

  // Save lines with interesting brace activity
  if (openCount > 0 || closeCount > 0) {
    linesBefore828.push({ line: i + 1, braces: braceCount, text: line.trim().substring(0, 80) });
  }
}

console.log(`Total brace balance at line 828: ${braceCount}`);
console.log('\nLast 20 lines with brace activity:');
linesBefore828.slice(-20).forEach(item => {
  console.log(`Line ${item.line}: balance=${item.braces} - ${item.text}`);
});