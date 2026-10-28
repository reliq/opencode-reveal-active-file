# opencode-reveal-active-file

An OpenCode Desktop GUI plugin that expands collapsed folders so the file open in the side panel is
visible in the panel's tree.

## The problem

The side panel already selects and scrolls its tree to the active file, but only when that file's row
exists in the tree. A file inside a collapsed folder has no row, so nothing is revealed and the tree
stays where it was. Opening a file with Cmd+P into a collapsed project hits this every time.

This plugin performs the one missing step: it expands the ancestors of the open file.

## What it does

- Watches the selected side-panel tab and expands every collapsed folder above the open file.
- Leaves already-expanded folders alone, since expanding one refetches its children.
- Adds a **Reveal active file in tree** command, default keybind `mod+alt+shift+r`, which still works
  after you switch to the Review tab by falling back to the last file tab seen.

Both the Files and the Review panel read folder expansion from the same per-screen file model, so
expanding here serves both.

## Install

```bash
npm install
npm run build
```

```jsonc
// ~/.config/opencode/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-reveal-active-file"]
}
```

OpenCode Desktop reads plugins from `opencode.json`, not `cli.json`. For development, run
`npm run watch` and use **Settings > Extensions > Plugins > Reload** after a rebuild.

## How it reads the active file, and why that is fragile

The app does not expose the active side-panel tab to plugins:

- `layout.stored(session)` is filtered to the calling plugin's own tab keys.
- `screen.file` has no `active()`; it exposes `tree`, `selection`, `scroll`, `get`, and `sync`.
- `Changes.active()` is the Review panel's own selection, and only covers changed files.

So this plugin reads the tab strip from the DOM. Kobalte's tab trigger renders `aria-selected` on the
selected tab, and the host puts the tab key on `data-pane-tab`, in the form `file://<encoded path>`.
The key is passed to the public `screen.file.resolve()`, which strips the protocol, decodes, and makes
the path workspace-relative.

If the app renames either attribute, the plugin stops revealing. When a tab strip exists but no
selection is ever reported, it shows a one-time toast instead of failing silently. This is why the
plugin is a stopgap: the proper fix belongs upstream.

## Known limits

- Depends on two undocumented DOM attributes, as above.
- Narrow windows use a different file view, which this plugin does not drive.
- The GUI plugin API is experimental. `@opencode/plugin` is pinned to the tested app version.

## Development

```bash
npm run typecheck
npm test
npm run build
```

The bundle must stay a single CommonJS file that default-exports `Plugin.define`. Only `effect`,
`solid-js`, `@opencode/*`, Electron, and Node built-ins may remain external; the `gui()` Vite preset
enforces this.

## License

MIT
