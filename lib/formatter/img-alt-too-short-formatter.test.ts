/**
 * Test file for img-alt-too-short-formatter
 * Run with: npx tsx lib/formatter/img-alt-too-short-formatter.test.ts
 */

import { formatImgAltTooShortTestResult, formatSingleImage, formatImgAltTooShortReport } from './img-alt-too-short-formatter';

// Example 1: Single image with 1 character alt
const example1 = {
  "images": [
    {
      "src": "/images/logo.png",
      "class": "header-logo",
      "altLength": 1,
      "alt": "x"
    }
  ],
  "totalCount": 1,
  "wcagLevel": "A",
  "wcagCriteria": ["1.1.1"],
  "classification": "toegankelijkheid/serieus"
};

// Example 2: Multiple images with short alt texts
const example2 = {
  "images": [
    {
      "src": "/images/icon-home.svg",
      "class": "nav-icon",
      "altLength": 1,
      "alt": "🏠"
    },
    {
      "src": "/assets/img.jpg",
      "altLength": 3,
      "alt": "img"
    },
    {
      "src": "https://example.com/photo.png",
      "class": "product-image",
      "altLength": 2,
      "alt": "ok"
    }
  ],
  "totalCount": 3,
  "wcagLevel": "A",
  "wcagCriteria": ["1.1.1"],
  "classification": "toegankelijkheid/serieus"
};

// Example 3: Many images (more than 5)
const example3 = {
  "images": [
    {
      "src": "/images/icon1.png",
      "altLength": 1,
      "alt": "1"
    },
    {
      "src": "/images/icon2.png",
      "altLength": 1,
      "alt": "2"
    },
    {
      "src": "/images/icon3.png",
      "altLength": 1,
      "alt": "3"
    },
    {
      "src": "/images/icon4.png",
      "altLength": 1,
      "alt": "4"
    },
    {
      "src": "/images/icon5.png",
      "altLength": 1,
      "alt": "5"
    },
    {
      "src": "/images/icon6.png",
      "altLength": 1,
      "alt": "6"
    },
    {
      "src": "/images/icon7.png",
      "altLength": 1,
      "alt": "7"
    }
  ],
  "totalCount": 7,
  "wcagLevel": "A",
  "wcagCriteria": ["1.1.1"],
  "classification": "toegankelijkheid/serieus"
};

// Example 4: Image with 3 character alt
const example4 = {
  "images": [
    {
      "src": "/graphics/btn.gif",
      "class": "button-image",
      "altLength": 3,
      "alt": "btn"
    }
  ],
  "totalCount": 1,
  "wcagLevel": "A",
  "wcagCriteria": ["1.1.1"],
  "classification": "toegankelijkheid/serieus"
};

console.log('='.repeat(80));
console.log('VOORBEELD 1: Afbeelding met 1 karakter alt-tekst');
console.log('='.repeat(80));
console.log(formatImgAltTooShortTestResult(JSON.stringify(example1)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 2: Meerdere afbeeldingen met korte alt-teksten');
console.log('='.repeat(80));
console.log(formatImgAltTooShortTestResult(JSON.stringify(example2)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 3: Meer dan 5 afbeeldingen (toont eerste 5 + samenvatting)');
console.log('='.repeat(80));
console.log(formatImgAltTooShortTestResult(JSON.stringify(example3)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 4: Afbeelding met 3 karakters alt-tekst');
console.log('='.repeat(80));
console.log(formatImgAltTooShortTestResult(JSON.stringify(example4)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('TEST: Single image formatting');
console.log('='.repeat(80));
const singleReport = formatSingleImage(example1.images[0], 0, 1);
console.log('Bevinding:', singleReport.bevinding);
console.log('Details:', singleReport.details);
console.log('Advies:', singleReport.advies);