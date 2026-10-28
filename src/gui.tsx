import { Command, Plugin } from "@opencode/plugin/gui"
import { describeStrip, watchSelectedTab } from "./dom"
import { ancestorsOf, isFileTabKey } from "./paths"

/**
 * Reveals the file open in the side panel by expanding collapsed folders above it.
 *
 * The panel already selects and scrolls to the active file, but only when that file's row exists in
 * the tree. A file inside a collapsed folder has no row, so nothing is revealed. Expanding the
 * ancestors is the missing step, and both the Files and Review panels read expansion from the same
 * per-screen file model.
 *
 * The active tab is read from the DOM because the app does not expose it to plugins. See `dom.ts`.
 */
export default Plugin.define({
  i18n: {
    en: {
      "command.reveal": "Reveal active file in tree",
      "command.reveal.description": "Expand collapsed folders so the open file shows in the side panel tree",
      "command.group": "View",
      "toast.unsupported": "Reveal active file cannot read the open file",
      "toast.unsupported.description": "Side panel tab strip: {{rows}} tabs, {{selected}} selected, keys: {{keys}}",
    },
  },

  setup(ctx) {
    // The selected tab key, kept current by the observer below. Reading it through a function keeps
    // the command and the observer in step without making it reactive state.
    let selectedKey: string | undefined

    // The last file tab seen. Selecting the Review tab must not disable the command, which is the
    // only way to reveal a file whose tab is not the one on screen.
    let lastFileKey: string | undefined

    /** Expands every collapsed folder above `path`, outermost first. */
    const reveal = (path: string) => {
      const file = ctx.screen.current()?.file

      if (!file) return

      for (const dir of ancestorsOf(path)) {
        if (file.tree.state(dir)?.expanded) continue

        file.tree.expand(dir)
      }
    }

    /** The workspace-relative path to reveal: the selected file tab, else the last one seen. */
    const activePath = () => {
      const key = isFileTabKey(selectedKey) ? selectedKey : lastFileKey

      if (!key) return undefined

      const file = ctx.screen.current()?.file

      if (!file) return undefined

      // `resolve` strips `file://`, decodes, and makes the path workspace-relative.
      return file.resolve(key) || undefined
    }

    const stop = watchSelectedTab(
      (key) => {
        selectedKey = key

        if (isFileTabKey(key)) lastFileKey = key

        const path = activePath()

        if (path) reveal(path)
      },
      {
        onUnsupported: () => {
          const strip = describeStrip()

          ctx.toast.show({
            variant: "error",
            title: ctx.t("toast.unsupported"),
            description: ctx.t("toast.unsupported.description", {
              rows: strip.rows,
              selected: strip.selected,
              keys: strip.keys.slice(0, 4).join(", ") || "none",
            }),
          })
        },
      },
    )

    ctx.add(
      Command,
      (): Command => ({
        id: "reveal",
        title: ctx.t("command.reveal"),
        description: ctx.t("command.reveal.description"),
        keywords: "tree folder expand collapse side panel files",
        group: ctx.t("command.group"),
        section: "navigation",
        bind: "mod+alt+shift+r",
        run: () => {
          const path = activePath()

          if (path) reveal(path)
        },
      }),
    )

    return () => stop()
  },
})
