import { describe, expect, it } from "vitest"
import { ancestorsOf, isFileTabKey, normalizePath } from "../src/paths"

describe("normalizePath", () => {
  it("strips leading and trailing slashes", () => {
    expect(normalizePath("/src/app.tsx/")).toBe("src/app.tsx")
  })

  it("collapses duplicate slashes and converts backslashes", () => {
    expect(normalizePath("src\\\\ui//app.tsx")).toBe("src/ui/app.tsx")
  })
})

describe("isFileTabKey", () => {
  it("accepts a file tab key", () => {
    expect(isFileTabKey("file:///Users/me/project/src/app.tsx")).toBe(true)
  })

  it("rejects the open-file launcher", () => {
    expect(isFileTabKey("file:open")).toBe(false)
  })

  it("rejects the review panel", () => {
    expect(isFileTabKey("review:changes")).toBe(false)
  })

  it("rejects missing keys", () => {
    expect(isFileTabKey(undefined)).toBe(false)
    expect(isFileTabKey("")).toBe(false)
  })
})

describe("ancestorsOf", () => {
  it("returns no ancestors for a file at the root", () => {
    expect(ancestorsOf("README.md")).toEqual([])
  })

  it("returns each directory, outermost first", () => {
    expect(ancestorsOf("src/components/button.tsx")).toEqual(["src", "src/components"])
  })

  it("returns each directory for a nested path", () => {
    expect(ancestorsOf("src/app.tsx")).toEqual(["src"])
  })

  it("returns nothing for an empty path", () => {
    expect(ancestorsOf("")).toEqual([])
  })

  it("returns nothing for paths that climb out of the workspace", () => {
    expect(ancestorsOf("../outside/file.ts")).toEqual([])
  })

  it("returns nothing for an absolute path, which is not a tree row", () => {
    expect(ancestorsOf("/Users/someone/elsewhere/file.ts")).toEqual([])
  })

  it("returns nothing for a Windows absolute path", () => {
    expect(ancestorsOf("C:\\Users\\someone\\file.ts")).toEqual([])
  })

  it("returns nothing for a bare filename with no directory", () => {
    expect(ancestorsOf("package.json")).toEqual([])
  })
})
