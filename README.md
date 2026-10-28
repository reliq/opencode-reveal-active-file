# opencode-reveal-active-file

An OpenCode Desktop GUI plugin that expands collapsed folders so the file open in the side panel is
visible in the panel's tree.

## Disclaimer

This is an unofficial plugin. It is not affiliated with, endorsed by, or supported by the OpenCode
project.

It works by reading the side panel's tab strip from the DOM, because the app does not expose the
active side tab to plugins. That means it depends on two undocumented details, and a future OpenCode
release can break it without warning. When that happens the plugin stops revealing files; it does not
damage anything. The toast described under [Troubleshooting](#troubleshooting) tells you when it has
stopped working.

Tested against OpenCode Desktop 2.2.0 on macOS. Other versions and platforms are untested.

## The problem

The side panel already selects and scrolls its tree to the active file, but only when that file's row
exists in the tree. A file inside a collapsed folder has no row, so nothing is revealed and the tree
stays where it was. Opening a file with Cmd+P into a collapsed project hits this every time.

This plugin performs the one missing step: it expands the ancestors of the open file.

## What it does

- Watches the selected side-panel tab and expands every collapsed folder above the open file.
- Leaves already-expanded folders alone, since expanding one refetches its children.
- Adds a **Reveal active file in tree** command, described below.

Both the Files and the Review panel read folder expansion from the same per-screen file model, so
expanding here serves both.

Only file tabs drive the automatic behavior. Selecting the Review tab, the **Open file** launcher, or
any other side tab does nothing on its own, which is why the command exists.

## The command

The automatic behavior covers the common case. The command exists for when it does not.

**Reveal active file in tree** reveals the file you are looking at right now. It is useful when:

- You collapsed a folder on purpose and the tree has since been reset, so nothing is selected.
- The tree scrolled somewhere else and you want to get back to the open file.
- You are on the Review tab and want the file tree to show the file you are reviewing.

Find it in the command palette under **View**, or press `mod+alt+shift+r`. `mod` is Cmd on macOS and
Ctrl elsewhere, so it is Cmd+Option+Shift+R on macOS.

The command falls back to the most recent file tab you had open, so it still works after you switch
to the Review tab. Before any file tab has been selected in this window, it does nothing.

To rebind it, open **Settings > Shortcuts**, find it under the **Navigation** section, and record a new
key. The binding is stored by the app, not by this plugin, so it survives plugin updates.

## Install

Clone the repository:

```bash
git clone https://github.com/reliq/opencode-reveal-active-file
```

Then point your global config at the directory:

```jsonc
// ~/.config/opencode/opencode.json
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["/absolute/path/to/opencode-reveal-active-file"]
}
```

The prebuilt bundle is committed, so no build step is needed. OpenCode Desktop reads plugins from
`opencode.json`, not `cli.json`. After adding the plugin, use **Settings > Extensions > Plugins >
Reload**, or restart the app.

To build it yourself instead, run `npm install && npm run build`.

### Why not `opencode plugin add`

`opencode plugin add github:reliq/opencode-reveal-active-file` fails on OpenCode 2.2.0 with
`git dep preparation failed`. That is a bug in the installer, not in this plugin: the same command
installs npm packages fine, and `npm install github:reliq/opencode-reveal-active-file` works. Until it
is fixed upstream, use the clone-and-configure steps above.

This plugin is not published to npm.

## Troubleshooting

If a tab strip exists but the plugin cannot read the selected tab, it shows a one-time toast
reporting what it found:

> Reveal active file cannot read the open file
> Side panel tab strip: 3 tabs, 1 selected, keys: file:///..., review:changes

That means the app changed the attributes this plugin reads, and it needs an update. Please open an
issue with the toast text.

## Known limits

- Depends on two undocumented DOM attributes, as described in the disclaimer.
- The tree's own scroll can miss when the plugin has just expanded folders. The app scrolls in a
  microtask, before the newly expanded rows are measured, so the scroll clamps to the old height.
  Selection and expansion are still correct; press the keybind to scroll again.
- Narrow windows use a different file view, which this plugin does not drive.
- The GUI plugin API is experimental.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

The bundle must stay a single CommonJS file that default-exports `Plugin.define`. Only `effect`,
`solid-js`, `@opencode/*`, Electron, and Node built-ins may remain external; the `gui()` Vite preset
enforces this. `dist/` is committed so that a git-based install ships a working bundle.

## License

MIT
