import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const templatePath = path.join(
  process.cwd(),
  'templates',
  'formulieren',
  'Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx'
);

console.log('Opening template:', templatePath);

const zip = new AdmZip(templatePath);
const documentXml = zip.getEntry('word/document.xml');

if (!documentXml) {
  console.error('Could not find word/document.xml');
  process.exit(1);
}

let xmlContent = documentXml.getData().toString('utf8');

// Mapping of headings to their bookmark names
const headingBookmarks = [
  { heading: 'Samenvatting', bookmark: '_Toc_Samenvatting' },
  { heading: 'Over dit onderzoek', bookmark: '_Toc_OverDitOnderzoek' },
  { heading: 'Overzicht resultaten', bookmark: '_Toc_OverzichtResultaten' },
  { heading: 'Bevindingen', bookmark: '_Toc_Bevindingen' },
  { heading: 'Opmerkingen', bookmark: '_Toc_Opmerkingen' },
  { heading: 'Borging en vervolg', bookmark: '_Toc_BorgingEnVervolg' },
  { heading: 'Onderzoeksdetails', bookmark: '_Toc_Onderzoeksdetails' }
];

console.log('\n=== Fixing TOC bookmarks ===\n');

let bookmarkIdCounter = 0;

headingBookmarks.forEach(({ heading, bookmark }) => {
  const headingPattern = `>${heading}<`;
  let searchPos = 0;

  while ((searchPos = xmlContent.indexOf(headingPattern, searchPos)) !== -1) {
    // Find the paragraph start
    const paragraphStart = xmlContent.lastIndexOf('<w:p ', searchPos);
    const paragraphStart2 = xmlContent.lastIndexOf('<w:p>', searchPos);
    const actualParagraphStart = Math.max(paragraphStart, paragraphStart2);

    if (actualParagraphStart === -1) {
      searchPos++;
      continue;
    }

    const paragraphEnd = xmlContent.indexOf('</w:p>', searchPos) + '</w:p>'.length;
    const paragraph = xmlContent.substring(actualParagraphStart, paragraphEnd);

    // Check if it's the actual heading (has Kop2 style)
    const isActualHeading = paragraph.includes('w:val="Kop2"');

    if (!isActualHeading) {
      searchPos++;
      continue;
    }

    // Check for existing bookmarks in and around the paragraph
    const beforeHeading = xmlContent.substring(Math.max(0, actualParagraphStart - 500), actualParagraphStart);
    const afterHeading = xmlContent.substring(paragraphEnd, Math.min(xmlContent.length, paragraphEnd + 500));
    const surroundingContent = beforeHeading + paragraph + afterHeading;

    // Find existing bookmark start/end
    const existingBookmarkStart = surroundingContent.match(/<w:bookmarkStart[^>]*w:id="(\d+)"[^>]*w:name="([^"]+)"[^>]*\/>/);
    const existingBookmarkEnd = surroundingContent.match(/<w:bookmarkEnd[^>]*w:id="(\d+)"[^>]*\/>/);

    if (existingBookmarkStart) {
      // Replace existing bookmark name
      const oldBookmarkId = existingBookmarkStart[1];
      const oldBookmarkName = existingBookmarkStart[2];
      const newBookmarkId = bookmarkIdCounter++;

      // Find the exact position of bookmark start
      const bookmarkStartPos = xmlContent.indexOf(existingBookmarkStart[0], actualParagraphStart - 500);

      if (bookmarkStartPos !== -1) {
        // Replace bookmark start with new name and ID
        const oldBookmarkStartXml = existingBookmarkStart[0];
        const newBookmarkStartXml = `<w:bookmarkStart w:id="${newBookmarkId}" w:name="${bookmark}"/>`;

        xmlContent = xmlContent.substring(0, bookmarkStartPos) +
          newBookmarkStartXml +
          xmlContent.substring(bookmarkStartPos + oldBookmarkStartXml.length);

        console.log(`✏️  Updated bookmark for "${heading}": "${oldBookmarkName}" → "${bookmark}" (id: ${newBookmarkId})`);

        // Also update the corresponding bookmarkEnd if it exists
        if (existingBookmarkEnd && existingBookmarkEnd[1] === oldBookmarkId) {
          const bookmarkEndPos = xmlContent.indexOf(`<w:bookmarkEnd w:id="${oldBookmarkId}"/>`, bookmarkStartPos);
          if (bookmarkEndPos !== -1) {
            xmlContent = xmlContent.substring(0, bookmarkEndPos) +
              `<w:bookmarkEnd w:id="${newBookmarkId}"/>` +
              xmlContent.substring(bookmarkEndPos + `<w:bookmarkEnd w:id="${oldBookmarkId}"/>`.length);
          }
        }
      }
    } else {
      // Add new bookmark around the heading paragraph
      const newBookmarkId = bookmarkIdCounter++;

      // Insert bookmark start right after the <w:p> or <w:p ...> opening tag
      const pTagEnd = paragraph.indexOf('<w:p>') !== -1 ?
        actualParagraphStart + '<w:p>'.length :
        actualParagraphStart + paragraph.substring(0, paragraph.indexOf('>')).length + 1;

      const bookmarkStartXml = `<w:bookmarkStart w:id="${newBookmarkId}" w:name="${bookmark}"/>`;
      const bookmarkEndXml = `<w:bookmarkEnd w:id="${newBookmarkId}"/>`;

      // Insert bookmark start after opening tag
      xmlContent = xmlContent.substring(0, pTagEnd) +
        bookmarkStartXml +
        xmlContent.substring(pTagEnd);

      // Insert bookmark end before closing </w:p>
      const updatedParagraphEnd = paragraphEnd + bookmarkStartXml.length;
      const closingTagPos = xmlContent.lastIndexOf('</w:p>', updatedParagraphEnd);

      xmlContent = xmlContent.substring(0, closingTagPos) +
        bookmarkEndXml +
        xmlContent.substring(closingTagPos);

      console.log(`✏️  Added bookmark for "${heading}": "${bookmark}" (id: ${newBookmarkId})`);
    }

    break; // Only process the first (actual) occurrence
  }
});

// Update the document.xml in the ZIP
zip.updateFile('word/document.xml', Buffer.from(xmlContent, 'utf8'));

// Create backup
const backupPath = templatePath.replace('.docx', `-BACKUP-${Date.now()}.docx`);
fs.copyFileSync(templatePath, backupPath);
console.log(`\n💾 Created backup: ${path.basename(backupPath)}`);

// Save the modified template
zip.writeZip(templatePath);

console.log(`✅ Updated template: ${path.basename(templatePath)}`);
console.log('\n✨ Done! All TOC bookmarks are now correctly linked.');