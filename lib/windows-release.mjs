import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const windowsRelease = require('../release/windows.json');
export const requiredChecks = ['build','installedRuntime','uninstall','pairingAndRevocation','privateDataAudit','cleanWindows','licenseReview','authenticode','defender','independentSecurityReview'];
export const previewChecks = ['build','installedRuntime','uninstall','pairingAndRevocation','privateDataAudit','dependencyAudit','licenseInventory','defender'];
export function canDownload(release = windowsRelease) {
  const preview=release.channel==='unsigned-preview' && release.unsignedAcknowledged===true;
  const checks=preview?previewChecks:requiredChecks;
  if (release.enabled !== true || release.approvedForPublication !== true || checks.some(key => release.checks?.[key] !== true)) return false;
  if (!/^\d+\.\d+\.\d+(?:-dev\.\d+)?$/.test(release.version) || !/^[a-f0-9]{64}$/.test(release.sha256) || !Number.isSafeInteger(release.bytes) || release.bytes < 1000000) return false;
  try {
    const url = new URL(release.url);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash && !url.search && /\.exe$/i.test(url.pathname) && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname);
  } catch { return false; }
}
