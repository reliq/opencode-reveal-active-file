/**
 * Pure helpers, kept apart from the plugin setup so they can be tested without the app.
 */

/** Strips leading and trailing slashes and collapses duplicate slashes. */
export function normalizePath(value: string): string {
  return value
    .replaceAll("\\", "/")
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+|\/+$/g, "")
}

/** Whether a path is absolute, and so not a workspace-relative tree path. */
export function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\")
}

/**
 * The tab key the file panel gives a file tab: `file://` and the encoded absolute path.
 *
 * Other side tabs use their own keys, such as `file:open` for the launcher and `review:changes`
 * for the review panel, so only this prefix identifies an open file.
 */
export function isFileTabKey(key: string | null | undefined): key is string {
  return !!key && key.startsWith("file://")
}

/**
 * Every ancestor directory of a file path, outermost first.
 *
 * `src/components/button.tsx` gives `["src", "src/components"]`. A path with no directory, an
 * absolute path, or an empty path gives no ancestors: those are not rows the workspace tree holds,
 * and expanding them would list directories that do not exist.
 */
export function ancestorsOf(path: string): string[] {
  if (!path || isAbsolutePath(path)) return []

  const normalized = normalizePath(path)

  if (!normalized) return []

  const segments = normalized.split("/")

  // The last segment is the file itself, so only the ones before it are directories.
  segments.pop()

  const ancestors: string[] = []
  let current = ""

  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") return []
    current = current ? `${current}/${segment}` : segment
    ancestors.push(current)
  }

  return ancestors
}
