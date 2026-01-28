import * as fs from 'fs';
import * as path from 'path';

// Read the seed file
const seedFilePath = path.join(__dirname, 'seed-quick-findings.ts');
let content = fs.readFileSync(seedFilePath, 'utf-8');

// Add status: 'open' after responsibility for each entry
// This regex finds the pattern: responsibility: 'something'\n  }
content = content.replace(
  /(responsibility: '[^']*')\n(  \})/g,
  "$1,\n    status: 'open'\n$2"
);

// Also handle entries without responsibility (they end with impact)
content = content.replace(
  /(impact: '[^']*')\n(  \})/g,
  "$1,\n    status: 'open'\n$2"
);

// Also handle entries that end with criterionCode
content = content.replace(
  /(criterionCode: '[^']*')\n(  \})/g,
  "$1,\n    status: 'open'\n$2"
);

// Write back
fs.writeFileSync(seedFilePath, content, 'utf-8');

console.log('✅ Successfully added status to all quick findings in seed script!');