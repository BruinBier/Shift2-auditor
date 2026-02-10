/**
 * Test file for link-missing-href-formatter
 * Run with: npx tsx lib/formatter/link-missing-href-formatter.test.ts
 */

import { formatLinkMissingHrefTestResult, formatSingleIssue, formatLinkMissingHrefReport } from './link-missing-href-formatter';

// Example 1: Missing href in navigation
const example1 = {
  "issues": [
    {
      "element": "Contact",
      "hrefValue": "<geen href>",
      "reason": "De link heeft geen href attribuut en functioneert daardoor niet als een werkende link.",
      "context": "navigation"
    }
  ],
  "totalCount": 1,
  "classification": "toegankelijkheid/kritiek",
  "wcagLevel": "A",
  "wcagCriteria": ["2.1.1", "2.4.4"]
};

// Example 2: Multiple issues - empty and placeholder hrefs
const example2 = {
  "issues": [
    {
      "element": "Home",
      "hrefValue": '""',
      "reason": "De link heeft een leeg href attribuut en functioneert daardoor niet als een werkende link.",
      "context": "header"
    },
    {
      "element": "Klik hier",
      "hrefValue": "#",
      "reason": "De link bevat een placeholder href die niet naar een functionele bestemming leidt.",
      "context": "main"
    },
    {
      "element": "<geen tekst>",
      "hrefValue": "javascript:void(0)",
      "reason": "De link bevat een placeholder href die niet naar een functionele bestemming leidt.",
      "context": "footer"
    }
  ],
  "totalCount": 3,
  "classification": "toegankelijkheid/kritiek",
  "wcagLevel": "A",
  "wcagCriteria": ["2.1.1", "2.4.4"]
};

// Example 3: Link in sidebar
const example3 = {
  "issues": [
    {
      "element": "Meer informatie",
      "hrefValue": "/#",
      "reason": "De link bevat een placeholder href die niet naar een functionele bestemming leidt.",
      "context": "sidebar"
    }
  ],
  "totalCount": 1,
  "classification": "toegankelijkheid/kritiek",
  "wcagLevel": "A",
  "wcagCriteria": ["2.1.1", "2.4.4"]
};

console.log('='.repeat(80));
console.log('VOORBEELD 1: Ontbrekend href attribuut in navigatie');
console.log('='.repeat(80));
console.log(formatLinkMissingHrefTestResult(JSON.stringify(example1)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 2: Meerdere issues - leeg en placeholder hrefs');
console.log('='.repeat(80));
console.log(formatLinkMissingHrefTestResult(JSON.stringify(example2)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 3: Placeholder href in sidebar');
console.log('='.repeat(80));
console.log(formatLinkMissingHrefTestResult(JSON.stringify(example3)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('TEST: Single issue formatting');
console.log('='.repeat(80));
const singleReport = formatSingleIssue(example1.issues[0]);
console.log('Bevinding:', singleReport.bevinding);
console.log('Details:', singleReport.details);
console.log('Advies:', singleReport.advies);