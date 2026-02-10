/**
 * Test file for multiple-same-links-formatter
 * Run with: npx tsx lib/formatter/multiple-same-links-formatter.test.ts
 */

import { formatMultipleSameLinksTestResult, formatSingleIssue, formatMultipleSameLinksReport } from './multiple-same-links-formatter';

// Example 1: Simple case with 2 contexts
const example1 = {
  "issues": [
    {
      "url": "/authenticate",
      "linkCount": 3,
      "uniqueTexts": ["Inloggen", "Log in"],
      "contexts": {
        "header": [
          { "text": "Inloggen", "count": 1 }
        ],
        "navigation": [
          { "text": "Log in", "count": 2 }
        ]
      }
    }
  ],
  "totalLinksAnalyzed": 45,
  "classification": "kwaliteit/opmerking"
};

// Example 2: Multiple issues
const example2 = {
  "issues": [
    {
      "url": "/contact",
      "linkCount": 4,
      "uniqueTexts": ["Contact", "Contacteer ons", "Neem contact op"],
      "contexts": {
        "header": [
          { "text": "Contact", "count": 1 }
        ],
        "footer": [
          { "text": "Contacteer ons", "count": 2 }
        ],
        "main": [
          { "text": "Neem contact op", "count": 1 }
        ]
      }
    },
    {
      "url": "/about",
      "linkCount": 2,
      "uniqueTexts": ["Over ons", "About"],
      "contexts": {
        "navigation": [
          { "text": "Over ons", "count": 1 }
        ],
        "footer": [
          { "text": "About", "count": 1 }
        ]
      }
    }
  ],
  "totalLinksAnalyzed": 67,
  "classification": "kwaliteit/opmerking"
};

// Example 3: Home page
const example3 = {
  "issues": [
    {
      "url": "/",
      "linkCount": 3,
      "uniqueTexts": ["Home", "Homepage", "Startpagina"],
      "contexts": {
        "header": [
          { "text": "Home", "count": 1 }
        ],
        "navigation": [
          { "text": "Homepage", "count": 1 }
        ],
        "footer": [
          { "text": "Startpagina", "count": 1 }
        ]
      }
    }
  ],
  "totalLinksAnalyzed": 30,
  "classification": "kwaliteit/opmerking"
};

console.log('='.repeat(80));
console.log('VOORBEELD 1: Simpele case met 2 contexten');
console.log('='.repeat(80));
console.log(formatMultipleSameLinksTestResult(JSON.stringify(example1)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 2: Multiple issues');
console.log('='.repeat(80));
console.log(formatMultipleSameLinksTestResult(JSON.stringify(example2)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 3: Homepage');
console.log('='.repeat(80));
console.log(formatMultipleSameLinksTestResult(JSON.stringify(example3)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('TEST: Single issue formatting');
console.log('='.repeat(80));
const singleReport = formatSingleIssue(example1.issues[0]);
console.log('Bevinding:', singleReport.bevinding);
console.log('Details:', singleReport.details);
console.log('Advies:', singleReport.advies);