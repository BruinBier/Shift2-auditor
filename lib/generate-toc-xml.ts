/**
 * Generate TOC entries XML for Word document
 * Creates hyperlinked table of contents entries with page number fields
 */

interface TocEntry {
  text: string;
  bookmarkId: string;
}

/**
 * Generate XML for a single TOC entry (Inhopg2 style for Heading 2)
 */
function generateTocEntry(entry: TocEntry): string {
  return `<w:p w14:paraId="${generateRandomId()}" w14:textId="${generateRandomId()}" w:rsidR="000617CE" w:rsidRDefault="000617CE">
  <w:pPr>
    <w:pStyle w:val="Inhopg2"/>
    <w:tabs>
      <w:tab w:val="right" w:leader="dot" w:pos="9062"/>
    </w:tabs>
    <w:rPr>
      <w:rFonts w:asciiTheme="minorHAnsi" w:eastAsiaTheme="minorEastAsia" w:hAnsiTheme="minorHAnsi" w:cstheme="minorBidi"/>
      <w:noProof/>
      <w:kern w:val="2"/>
      <w:lang w:eastAsia="nl-NL"/>
      <w14:ligatures w14:val="standardContextual"/>
    </w:rPr>
  </w:pPr>
  <w:hyperlink w:anchor="${entry.bookmarkId}" w:history="1">
    <w:r w:rsidRPr="00081F06">
      <w:rPr>
        <w:rStyle w:val="Hyperlink"/>
        <w:noProof/>
      </w:rPr>
      <w:t>${escapeXml(entry.text)}</w:t>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
      <w:tab/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
      <w:fldChar w:fldCharType="begin"/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
      <w:instrText xml:space="preserve"> PAGEREF ${entry.bookmarkId} \\h </w:instrText>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
      <w:fldChar w:fldCharType="separate"/>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
      <w:t>1</w:t>
    </w:r>
    <w:r>
      <w:rPr>
        <w:noProof/>
        <w:webHidden/>
      </w:rPr>
      <w:fldChar w:fldCharType="end"/>
    </w:r>
  </w:hyperlink>
</w:p>`;
}

/**
 * Generate random ID for Word elements
 */
function generateRandomId(): string {
  return Math.random().toString(16).substring(2, 10).toUpperCase();
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate complete TOC section XML
 */
export function generateTocXml(entries: TocEntry[]): string {
  return entries.map(entry => generateTocEntry(entry)).join('\n');
}

/**
 * Default TOC entries for formulieren report
 */
export const defaultFormulierenTocEntries: TocEntry[] = [
  { text: 'Samenvatting', bookmarkId: '_Toc_Samenvatting' },
  { text: 'Over dit onderzoek', bookmarkId: '_Toc_OverDitOnderzoek' },
  { text: 'Overzicht resultaten', bookmarkId: '_Toc_OverzichtResultaten' },
  { text: 'Bevindingen', bookmarkId: '_Toc_Bevindingen' },
  { text: 'Opmerkingen', bookmarkId: '_Toc_Opmerkingen' },
  { text: 'Borging en vervolg', bookmarkId: '_Toc_BorgingEnVervolg' },
  { text: 'Onderzoeksdetails', bookmarkId: '_Toc_Onderzoeksdetails' },
];

export type { TocEntry };