export function sourceUrl(sourcePath, commit) {
  if (!/^[a-f0-9]{40}$/i.test(commit ?? '')) return null;
  if (typeof sourcePath !== 'string' || !sourcePath.startsWith('plugins/')) return null;
  const parts = sourcePath.split('/');
  if (parts.some(part => !part || part === '.' || part === '..' || !/^[\w.-]+$/.test(part))) return null;
  return `https://github.com/Artyem-Y/ai-marketplace/blob/${commit}/${parts.map(encodeURIComponent).join('/')}`;
}
