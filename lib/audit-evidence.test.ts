import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuditEvidencePaths, isHomepageUrl, sanitizeEvidenceSegment } from './audit-evidence';

test('herkent alleen een kale root-URL als homepage', () => {
  assert.equal(isHomepageUrl('https://example.nl/'), true);
  assert.equal(isHomepageUrl('https://example.nl'), true);
  assert.equal(isHomepageUrl('https://example.nl/?preview=1'), false);
  assert.equal(isHomepageUrl('https://example.nl/contact'), false);
});

test('maakt project- en steekproefgebonden publieke bewijsbestanden', () => {
  const paths = getAuditEvidencePaths({
    cwd: 'C:\\project',
    projectId: 'project/id',
    sampleId: 'sample id',
    timestamp: '2026-08-02T12:34:56.000Z',
  });
  assert.equal(sanitizeEvidenceSegment('a/b c'), 'a_b_c');
  assert.equal(paths.htmlPublicPath, '/uploads/audit-evidence/project_id/sample_id/2026-08-02T12_34_56_000Z.html');
  assert.equal(paths.screenshotPublicPath, '/uploads/audit-evidence/project_id/sample_id/2026-08-02T12_34_56_000Z.png');
  assert.match(paths.diskDir, /public[\\/]uploads[\\/]audit-evidence/);
});
