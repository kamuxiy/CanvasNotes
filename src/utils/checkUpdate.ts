import { APP_META } from '../appMeta'

export type UpdateCheckResult =
  | { status: 'latest'; latest: string; current: string }
  | { status: 'ahead'; latest: string; current: string }
  | { status: 'outdated'; latest: string; htmlUrl: string; current: string }
  | { status: 'offline' }
  | { status: 'error'; message: string }

function normalizeVersion(tag: string): string {
  return tag.trim().replace(/^v/i, '')
}

/** Compare semver-ish strings. Positive => a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = normalizeVersion(a).split('.').map((p) => Number.parseInt(p, 10) || 0)
  const pb = normalizeVersion(b).split('.').map((p) => Number.parseInt(p, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0
    const db = pb[i] ?? 0
    if (da !== db) return da - db
  }
  return 0
}

type GithubRelease = {
  tag_name?: string
  html_url?: string
  draft?: boolean
  prerelease?: boolean
}

/**
 * Compare the running app version with the latest GitHub Release.
 * Shows「无网络」when offline or the request cannot reach GitHub.
 */
export async function checkForUpdates(
  currentVersion: string = APP_META.version,
): Promise<UpdateCheckResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 'offline' }
  }

  const url = `https://api.github.com/repos/${APP_META.githubRepo}/releases/latest`

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    })

    const current = normalizeVersion(currentVersion)

    if (!res.ok) {
      // 404 = no releases yet → treat as up to date with current
      if (res.status === 404) {
        return { status: 'latest', latest: current, current }
      }
      return { status: 'error', message: `GitHub 返回 ${res.status}` }
    }

    const data = (await res.json()) as GithubRelease
    const latest = normalizeVersion(data.tag_name ?? '')
    if (!latest) {
      return { status: 'error', message: '无法解析 Release 版本' }
    }

    const cmp = compareVersions(current, latest)
    if (cmp > 0) {
      return { status: 'ahead', latest, current }
    }
    if (cmp === 0) {
      return { status: 'latest', latest, current }
    }
    return {
      status: 'outdated',
      latest,
      current,
      htmlUrl: data.html_url ?? APP_META.releasesUrl,
    }
  } catch {
    return { status: 'offline' }
  }
}
