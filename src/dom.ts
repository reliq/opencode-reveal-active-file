/**
 * Reads the selected side-panel tab from the DOM.
 *
 * The app does not expose the active side tab to plugins: `layout.stored()` is filtered to the
 * calling plugin's own keys, and `screen.file` has no `active()`. The one observable signal is the
 * tab strip itself. Kobalte's tab trigger renders `aria-selected` on the selected tab, and the host
 * puts the tab key on `data-pane-tab`.
 *
 * This is the fragile part of the plugin. If the app renames either attribute the plugin stops
 * revealing, so `onUnsupported` reports it once instead of failing silently.
 */

const TRIGGER = "[data-pane-tab]"
const SELECTED = '[aria-selected="true"]'

/**
 * The selected side tab's key, or undefined when the strip is absent or shows no selection.
 *
 * The two attributes live on different elements: the host puts `data-pane-tab` on the row wrapper,
 * and Kobalte puts `aria-selected` on the tab trigger nested inside it. So find the selected trigger
 * first, then read the key from the nearest ancestor that carries it.
 */
export function selectedTabKey(root: ParentNode = document): string | undefined {
  const trigger = root.querySelector(SELECTED)

  if (!trigger) return undefined

  const host = trigger.closest<HTMLElement>(TRIGGER)
  const key = host?.dataset.paneTab

  return key || undefined
}

/** Whether the tab strip is present at all, so a missing selection can be told from a missing strip. */
export function hasTabStrip(root: ParentNode = document): boolean {
  return root.querySelector(TRIGGER) !== null
}

/**
 * What the strip actually looks like, for diagnosing a mismatch with the assumptions above.
 *
 * Returns the tab keys the strip holds and whether any of them reports a selection, so a caller can
 * tell "no strip", "strip but nothing selected", and "selected but unreadable" apart.
 */
export function describeStrip(root: ParentNode = document): {
  rows: number
  selected: number
  keys: string[]
} {
  const rows = Array.from(root.querySelectorAll<HTMLElement>(TRIGGER))
  const keys = rows.map((row) => row.dataset.paneTab ?? "").filter(Boolean)

  return {
    rows: rows.length,
    selected: root.querySelectorAll(SELECTED).length,
    keys,
  }
}

/**
 * Calls `onChange` with the selected tab key whenever it changes, and once immediately.
 *
 * Returns a function that stops observing. `onUnsupported` runs once if a tab strip exists but never
 * reports a selection, which is what a renamed attribute looks like.
 */
export function watchSelectedTab(
  onChange: (key: string | undefined) => void,
  options?: { root?: Document; onUnsupported?: () => void },
): () => void {
  const root = options?.root ?? document
  let last: string | undefined
  let sawSelection = false
  let reported = false

  const read = () => {
    const key = selectedTabKey(root)

    if (key) sawSelection = true

    if (key === last) return
    last = key
    onChange(key)
  }

  read()

  const observer = new MutationObserver(read)

  observer.observe(root.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["aria-selected", "data-pane-tab"],
  })

  // A tab strip that renders without a selection is normal for a moment; one that never reports a
  // selection while the strip exists means the attributes moved.
  const timer = setTimeout(() => {
    if (sawSelection || reported) return
    if (!hasTabStrip(root)) return
    reported = true
    options?.onUnsupported?.()
  }, 5000)

  return () => {
    observer.disconnect()
    clearTimeout(timer)
  }
}
