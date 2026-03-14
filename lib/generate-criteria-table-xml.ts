/**
 * Generates Word XML for the criteria assessment table
 */

interface CriterionRow {
  code: string;
  name: string;
  status: string;
  isFailed: boolean;
}

export function generateCriteriaTableXml(criteria: CriterionRow[]): string {
  // Table start with grid definition (3 columns)
  let xml = `<w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">`;
  xml += `<w:tblPr><w:tblW w:w="9067" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0"/><w:left w:val="single" w:sz="4" w:space="0"/><w:bottom w:val="single" w:sz="4" w:space="0"/><w:right w:val="single" w:sz="4" w:space="0"/><w:insideH w:val="single" w:sz="4" w:space="0"/><w:insideV w:val="single" w:sz="4" w:space="0"/></w:tblBorders></w:tblPr>`;
  xml += `<w:tblGrid><w:gridCol w:w="5807"/><w:gridCol w:w="1418"/><w:gridCol w:w="1842"/></w:tblGrid>`;

  // Header row
  xml += `<w:tr>`;
  xml += createHeaderCell('Succescriterium');
  xml += createHeaderCell('Niveau');
  xml += createHeaderCell('Resultaat');
  xml += `</w:tr>`;

  // Data rows
  for (const criterion of criteria) {
    xml += `<w:tr>`;
    xml += createDataCell(`${criterion.code} ${criterion.name}`, criterion.isFailed);
    xml += createDataCell('A', criterion.isFailed);
    xml += createDataCell(criterion.status, criterion.isFailed);
    xml += `</w:tr>`;
  }

  xml += `</w:tbl>`;

  return xml;
}

function createHeaderCell(text: string): string {
  return `<w:tc>
    <w:tcPr>
      <w:shd w:val="clear" w:color="auto" w:fill="7030A0"/>
      <w:vAlign w:val="center"/>
    </w:tcPr>
    <w:p>
      <w:pPr>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/><w:bCs/>
          <w:color w:val="FFFFFF"/>
        </w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  </w:tc>`;
}

function createDataCell(text: string, isBold: boolean): string {
  const boldTags = isBold ? '<w:b/><w:bCs/>' : '';

  return `<w:tc>
    <w:tcPr>
      <w:vAlign w:val="center"/>
    </w:tcPr>
    <w:p>
      <w:pPr>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>${boldTags}</w:rPr>
        <w:t>${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  </w:tc>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}