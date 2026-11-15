import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

export interface AppUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  currentVersionCode: number;
  latestVersion: string;
  latestVersionCode: number;
  releaseDate?: string;
  releaseTitle?: string;
  releaseNotes: string[];
  downloadUrl: string;
  releasesUrl: string;
}

// Current App Version Constants
export const APP_VERSION = Constants.expoConfig?.version || '1.3.4';
export const APP_VERSION_CODE = Constants.expoConfig?.android?.versionCode || 8;

const REMOTE_VERSION_JSON_URL =
  'https://raw.githubusercontent.com/Aditya-Kumar-Sah-CSE/gate-tracker/main/version.json';

const GITHUB_RELEASES_API_URL =
  'https://api.github.com/repos/Aditya-Kumar-Sah-CSE/gate-tracker/releases/latest';

/**
 * Checks GitHub repository for new release versions.
 */
export async function checkForAppUpdate(): Promise<AppUpdateInfo | null> {
  try {
    // 1. Try checking raw version.json on main branch with timestamp cache buster
    const timestamp = Date.now();
    const versionRes = await fetch(`${REMOTE_VERSION_JSON_URL}?t=${timestamp}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (versionRes.ok) {
      const remote = await versionRes.json();
      const latestCode = Number(remote.versionCode) || 0;
      const latestVer = String(remote.version || '1.0.0');

      const isNewer =
        latestCode > APP_VERSION_CODE ||
        compareSemver(latestVer, APP_VERSION) > 0;

      return {
        updateAvailable: isNewer,
        currentVersion: APP_VERSION,
        currentVersionCode: APP_VERSION_CODE,
        latestVersion: latestVer,
        latestVersionCode: latestCode,
        releaseDate: remote.releaseDate,
        releaseTitle: remote.releaseTitle || `Update v${latestVer}`,
        releaseNotes: Array.isArray(remote.releaseNotes)
          ? remote.releaseNotes
          : ['Performance optimizations & stability improvements.'],
        downloadUrl:
          remote.downloadUrl ||
          'https://github.com/Aditya-Kumar-Sah-CSE/gate-tracker/raw/main/GATE_TRACK_90.apk',
        releasesUrl:
          remote.releasesUrl ||
          'https://github.com/Aditya-Kumar-Sah-CSE/gate-tracker/releases',
      };
    }
  } catch (err) {
    console.warn('version.json fetch failed, trying GitHub API fallback:', err);
  }

  // 2. Fallback to GitHub Releases API
  try {
    const res = await fetch(GITHUB_RELEASES_API_URL, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'GATE-TRACK-90-App',
      },
    });

    if (res.ok) {
      const release = await res.json();
      const tagName = String(release.tag_name || '').replace(/^v/, '');
      const isNewer = compareSemver(tagName, APP_VERSION) > 0;

      // Find APK asset
      const apkAsset = release.assets?.find(
        (a: any) => typeof a.name === 'string' && a.name.endsWith('.apk')
      );
      const downloadUrl =
        apkAsset?.browser_download_url ||
        'https://github.com/Aditya-Kumar-Sah-CSE/gate-tracker/raw/main/GATE_TRACK_90.apk';

      return {
        updateAvailable: isNewer,
        currentVersion: APP_VERSION,
        currentVersionCode: APP_VERSION_CODE,
        latestVersion: tagName || APP_VERSION,
        latestVersionCode: APP_VERSION_CODE + (isNewer ? 1 : 0),
        releaseDate: release.published_at,
        releaseTitle: release.name || `Update ${release.tag_name}`,
        releaseNotes: release.body
          ? release.body.split('\n').filter((l: string) => l.trim().length > 0)
          : ['New update available.'],
        downloadUrl,
        releasesUrl:
          release.html_url ||
          'https://github.com/Aditya-Kumar-Sah-CSE/gate-tracker/releases',
      };
    }
  } catch (err) {
    console.warn('GitHub Releases API check failed:', err);
  }

  return null;
}

/**
 * Directly downloads and opens the APK update in browser/system downloader.
 * Avoids native share target dialogs completely.
 */
export async function downloadAndInstallUpdate(
  downloadUrl: string,
  onProgress?: (progressPct: number) => void
): Promise<void> {
  if (onProgress) {
    onProgress(100);
  }
  await Linking.openURL(downloadUrl);
}

/**
 * Simple semver comparison: returns 1 if a > b, -1 if a < b, 0 if equal.
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

