import * as path from 'path';

export function sanitizeEvidenceSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function isHomepageUrl(value: string): boolean {
  const url = new URL(value);
  return (url.pathname === '/' || url.pathname === '') && !url.search && !url.hash;
}

export function getAuditEvidencePaths(input: {
  cwd: string;
  projectId: string;
  sampleId: string;
  timestamp: string;
}) {
  const projectId = sanitizeEvidenceSegment(input.projectId);
  const sampleId = sanitizeEvidenceSegment(input.sampleId);
  const stamp = sanitizeEvidenceSegment(input.timestamp);
  const relativeDir = path.posix.join('uploads', 'audit-evidence', projectId, sampleId);

  return {
    diskDir: path.join(input.cwd, 'public', ...relativeDir.split('/')),
    htmlDiskPath: path.join(input.cwd, 'public', ...relativeDir.split('/'), `${stamp}.html`),
    screenshotDiskPath: path.join(input.cwd, 'public', ...relativeDir.split('/'), `${stamp}.png`),
    htmlPublicPath: `/${relativeDir}/${stamp}.html`,
    screenshotPublicPath: `/${relativeDir}/${stamp}.png`,
  };
}
