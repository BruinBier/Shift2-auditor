/**
 * Test file for img-missing-alt-formatter
 * Run with: npx tsx lib/formatter/img-missing-alt-formatter.test.ts
 */

import { formatImgMissingAltTestResult, formatSingleImage, formatImgMissingAltReport } from './img-missing-alt-formatter';

// Example 1: Single image without alt
const example1 = {
  "images": [
    {
      "src": "/images/logo.png",
      "class": "header-logo"
    }
  ],
  "totalCount": 1,
  "wcagLevel": "A",
  "critical": true
};

// Example 2: Multiple images without alt
const example2 = {
  "images": [
    {
      "src": "/images/hero-banner.jpg",
      "class": "hero-image"
    },
    {
      "src": "/assets/icons/user.svg"
    },
    {
      "src": "https://example.com/very-long-image-name-that-should-be-truncated-because-it-is-too-long.png",
      "class": "product-image"
    }
  ],
  "totalCount": 3,
  "wcagLevel": "A",
  "critical": true
};

// Example 3: Many images (more than 5)
const example3 = {
  "images": [
    {
      "src": "/images/gallery-1.jpg",
      "class": "gallery-item"
    },
    {
      "src": "/images/gallery-2.jpg",
      "class": "gallery-item"
    },
    {
      "src": "/images/gallery-3.jpg",
      "class": "gallery-item"
    },
    {
      "src": "/images/gallery-4.jpg",
      "class": "gallery-item"
    },
    {
      "src": "/images/gallery-5.jpg",
      "class": "gallery-item"
    },
    {
      "src": "/images/gallery-6.jpg",
      "class": "gallery-item"
    },
    {
      "src": "/images/gallery-7.jpg",
      "class": "gallery-item"
    }
  ],
  "totalCount": 7,
  "wcagLevel": "A",
  "critical": true
};

// Example 4: Image without src
const example4 = {
  "images": [
    {
      "class": "placeholder"
    }
  ],
  "totalCount": 1,
  "wcagLevel": "A",
  "critical": true
};

console.log('='.repeat(80));
console.log('VOORBEELD 1: Enkele afbeelding zonder alt');
console.log('='.repeat(80));
console.log(formatImgMissingAltTestResult(JSON.stringify(example1)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 2: Meerdere afbeeldingen zonder alt');
console.log('='.repeat(80));
console.log(formatImgMissingAltTestResult(JSON.stringify(example2)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 3: Meer dan 5 afbeeldingen (toont eerste 5 + samenvatting)');
console.log('='.repeat(80));
console.log(formatImgMissingAltTestResult(JSON.stringify(example3)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('VOORBEELD 4: Afbeelding zonder src attribuut');
console.log('='.repeat(80));
console.log(formatImgMissingAltTestResult(JSON.stringify(example4)));

console.log('\n\n');

console.log('='.repeat(80));
console.log('TEST: Single image formatting');
console.log('='.repeat(80));
const singleReport = formatSingleImage(example1.images[0], 0, 1);
console.log('Bevinding:', singleReport.bevinding);
console.log('Details:', singleReport.details);
console.log('Advies:', singleReport.advies);