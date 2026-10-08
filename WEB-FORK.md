# OpenCode web frontend fork

This fork adds expandable input and output panels to generic tool calls, including custom and MCP tools such as `execute`. It keeps the compact summary and renders detail content on expansion. String arguments retain their line breaks; structured values use formatted JSON. Output appears as plain text, with scrolling for long results.

The current base is **v1.18.34**, matching the running backend at setup time. The CLI on PATH reported 1.18.35. Check the running server's version before choosing an upstream release.

- Fork: <https://github.com/jf1x/opencode>
- Branch: `expand-tool-calls`
- `origin`: your fork
- `upstream`: <https://github.com/anomalyco/opencode>

## Build and run

Requires Bun 1.3.14 and a running OpenCode server. Run these commands from this repository's root:

```powershell
bun install --frozen-lockfile
bun run --cwd packages/app build --logLevel warn
bun run packages/app/serve-fork.ts
```

Open <http://127.0.0.1:4444>. Run the last command in a separate terminal and leave it open. Press Ctrl+C in that terminal to stop the frontend.

On your first visit, click **Add project**, enter your project's full path in the search field, and select the matching folder result. The web picker starts in your home directory and supports paths outside it. You can use either `C:/Projects/ExampleApp` or `C:\Projects\ExampleApp` on Windows.

The homepage lists sessions for projects you have opened in this frontend. The fork URL has separate browser storage from port 4096, so it starts with an empty project list even when the backend has existing sessions. Opening the project displays its retained sessions; it does not copy or move them. Open other project folders to include their sessions.

The launcher serves `packages/app/dist` through Vite preview and forwards API requests, event streams, and terminal WebSockets to `http://127.0.0.1:4096`. The browser can use the frontend origin as its server URL. If you choose another server in the UI, the browser connects to that server directly.

To use another backend or frontend port, set these variables before launching:

```powershell
$env:OPENCODE_SERVER_URL = "http://127.0.0.1:4096"
$env:OPENCODE_WEB_PORT = "4444"
bun run packages/app/serve-fork.ts
```

The launcher binds to `127.0.0.1`. You can rebuild while it runs, then refresh the browser to load the new build.

Changes to `serve-fork.ts` require relaunching the frontend command. Its proxy rule includes query-string URLs such as `/file?path=...`, which the project picker uses when browsing absolute paths.

Verify the connection and running backend version:

```powershell
curl.exe http://127.0.0.1:4444/global/health
```

## Custom stylesheet selectors

The summary and collapse controls use the existing `BasicTool` markup, including `.tool-collapsible`, `[data-component="tool-trigger"]`, and `[data-slot="collapsible-content"]`.

The new body uses:

```css
[data-component="generic-tool-details"]
[data-slot="generic-tool-label"]
[data-slot="generic-tool-data"]
[data-slot="generic-tool-data"] pre
```

Shell uses `[data-component="bash-output"]`, `[data-slot="bash-scroll"]`, and `[data-slot="bash-pre"] code`. Extend Shell-specific stylesheet rules with the corresponding generic selectors if you want matching styles. Generic panels use horizontal scrolling for long lines; Shell wraps them.

Enable your stylesheet extension for the custom frontend URL, since it has a different origin from the stock interface.

## Save the local changes

Commit the renderer files as a small patch before updating the base:

```powershell
git add packages/session-ui/src/components/basic-tool.tsx packages/session-ui/src/components/basic-tool.css packages/ui/src/i18n/en.ts
git commit -m "feat(session-ui): expand generic tool calls"
git add packages/app/serve-fork.ts packages/app/serve-fork.test.ts WEB-FORK.md
git commit -m "chore(app): add local frontend launcher and update guide"
git add packages/app/src/components/dialog-select-directory.tsx packages/app/src/components/directory-picker-domain.ts packages/app/src/components/directory-picker-domain.test.ts
git commit -m "fix(app): match Windows project paths with either separator"
git push -u origin expand-tool-calls
```

## Update to another release

Start with a clean working tree and use the release matching your running backend. For example, to move from 1.18.34 to 1.18.35:

```powershell
git status --short
git fetch upstream tag v1.18.35
git switch -c tool-panels-update expand-tool-calls
git rebase --onto v1.18.35 v1.18.34
bun install --frozen-lockfile
```

Resolve any conflicts in the renderer, then run `git rebase --continue`. Run `git rebase --abort` to return the update branch to its prior state.

Run the checks below and rebuild before using the updated frontend. Keep the previous branch until you verify the new build. Push the update branch with `git push -u origin tool-panels-update` after verification.

For later updates, substitute the current and target base tags and choose a new short update-branch name. Update the base version in this guide after a successful upgrade.

## Checks

```powershell
bun run --cwd packages/session-ui typecheck
bun run --cwd packages/session-ui test
bun run --cwd packages/ui typecheck
bun run --cwd packages/app typecheck
bun run --cwd packages/app build --logLevel warn
```

From `packages/app`, run the focused project-picker and proxy regression tests:

```powershell
bun test --conditions=solid ./src/components/directory-picker-domain.test.ts ./serve-fork.test.ts
```

The full app unit suite currently reports a locale-parity failure for the new `ui.basicTool.input` and `ui.basicTool.output` keys. Non-English locales use the English fallback for these headings. Complete those translations before treating the full suite as passing.

In the browser, expand a completed generic tool call, inspect multiline arguments and output, and collapse it again. You can also inspect input while a generic tool runs. The frontend displays retained data; it cannot recover output the backend has truncated or pruned.

### Windows symlink checkout

If the app typecheck fails at the first line of `src/custom-elements.d.ts`, check whether Git wrote the symlink target as text. Restore the tracked symlink with:

```powershell
git -c core.symlinks=true checkout -- packages/app/src/custom-elements.d.ts
```

This command requires Windows support for creating symlinks, such as Developer Mode or an elevated terminal.
