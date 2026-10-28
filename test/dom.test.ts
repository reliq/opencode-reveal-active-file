import { describe, expect, it } from "vitest"
import { hasTabStrip, selectedTabKey } from "../src/dom"

/**
 * Stand-ins for the tab strip, mirroring the app's real structure: the host puts `data-pane-tab` on
 * the row wrapper, and Kobalte puts `aria-selected` on the trigger nested inside it. Modelling the
 * nesting is the point: a selector expecting both attributes on one element would pass a flat fake
 * and fail in the app.
 */
function tab(key: string, selected: boolean) {
  const host = { dataset: { paneTab: key } as { paneTab?: string } }
  const trigger = {
    closest: (selector: string) => (selector === "[data-pane-tab]" ? host : null),
  }

  return { host, trigger, selected }
}

function strip(tabs: ReturnType<typeof tab>[]) {
  return {
    querySelector(selector: string) {
      if (selector === '[aria-selected="true"]') {
        return tabs.find((entry) => entry.selected)?.trigger ?? null
      }

      // `hasTabStrip` asks for any row.
      return tabs[0]?.host ?? null
    },
  } as unknown as ParentNode
}

describe("selectedTabKey", () => {
  it("reads the key from the wrapper around the selected trigger", () => {
    const root = strip([tab("file:///a/b.tsx", true), tab("review:changes", false)])

    expect(selectedTabKey(root)).toBe("file:///a/b.tsx")
  })

  it("ignores unselected tabs", () => {
    const root = strip([tab("review:changes", false), tab("file:///a/b.tsx", false)])

    expect(selectedTabKey(root)).toBeUndefined()
  })

  it("returns undefined when the selected trigger has no keyed ancestor", () => {
    const orphan = { closest: () => null }
    const root = {
      querySelector: (selector: string) => (selector === '[aria-selected="true"]' ? orphan : null),
    } as unknown as ParentNode

    expect(selectedTabKey(root)).toBeUndefined()
  })

  it("returns undefined for an empty key", () => {
    const root = strip([tab("", true)])

    expect(selectedTabKey(root)).toBeUndefined()
  })
})

describe("hasTabStrip", () => {
  it("is true when a tab strip exists", () => {
    expect(hasTabStrip(strip([tab("review:changes", false)]))).toBe(true)
  })

  it("is false when no tab strip exists", () => {
    expect(hasTabStrip(strip([]))).toBe(false)
  })
})
