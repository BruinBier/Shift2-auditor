const fs = require('fs');
const content = fs.readFileSync('app/onderzoeken/OnderzoekenTable.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let sections = [];
let currentSection = null;

for (let i = 0; i < 828; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  const withoutStrings = line
    .replace(/'[^']*'/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/\/\/.*/g, '');

  const openCount = (withoutStrings.match(/{/g) || []).length;
  const closeCount = (withoutStrings.match(/}/g) || []).length;
  const prevBalance = braceCount;
  braceCount += openCount - closeCount;

  // Track when we go from 1 to 2 (start of a function) or from 2 back to 1 (end of function)
  if (prevBalance === 1 && braceCount === 2 && trimmed.includes('const')) {
    currentSection = { start: i + 1, name: trimmed.substring(0, 60) };
  } else if (prevBalance === 2 && braceCount === 1 && currentSection) {
    currentSection.end = i + 1;
    sections.push(currentSection);
    currentSection = null;
  } else if (prevBalance > 1 && braceCount === 1 && currentSection) {
    currentSection.end = i + 1;
    sections.push(currentSection);
    currentSection = null;
  }
}

console.log('Top-level functions and their closing:');
sections.forEach(section => {
  console.log(`Lines ${section.start.toString().padStart(4)}-${section.end.toString().padStart(4)}: ${section.name}`);
});

if (currentSection) {
  console.log(`\nUNCLOSED SECTION starting at line ${currentSection.start}: ${currentSection.name}`);
}

console.log(`\nFinal balance at line 828: ${braceCount}`);