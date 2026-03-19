const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../templates/formulieren/Toegankelijkheidsonderzoek formulieren Template - with placeholders.docx');

console.log('Opening Word template...');
const zip = new AdmZip(templatePath);

// Get document.xml
const documentXml = zip.readAsText('word/document.xml');

console.log('Replacing text...');
const updatedXml = documentXml.replace(/inhoud van formulieren/g, 'content van formulieren');

// Check if replacement was made
if (documentXml !== updatedXml) {
  console.log('✓ Text found and replaced');

  // Update the zip
  zip.updateFile('word/document.xml', Buffer.from(updatedXml, 'utf8'));

  // Write back to file
  zip.writeZip(templatePath);
  console.log('✓ Word template updated successfully');
} else {
  console.log('✗ Text not found in document');
}