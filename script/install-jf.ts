import os from "node:os"
import path from "node:path"
import { stat } from "node:fs/promises"

if (process.platform !== "win32") throw new Error("This installer targets Windows.")

const root = path.resolve(import.meta.dirname, "..")
const bin = path.join(os.homedir(), ".local", "bin")
if (!(await stat(bin)).isDirectory()) throw new Error(`Expected a directory at ${bin}`)

const pkg = await Bun.file(path.join(root, "packages/opencode/package.json")).json()
const build = Bun.spawn([process.execPath, "run", "packages/opencode/script/build.ts", "--single", "--skip-install"], {
  cwd: root,
  env: {
    ...process.env,
    OPENCODE_CHANNEL: "jf",
    OPENCODE_VERSION: `${pkg.version}-jf`,
    OPENCODE_RELEASE: undefined,
  },
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
})

if ((await build.exited) !== 0) throw new Error("Fork build failed; the installed command was not replaced.")

const target = path.join(bin, "opencode-jf.exe")
await Bun.write(
  target,
  Bun.file(path.join(root, `packages/opencode/dist/opencode-windows-${process.arch}/bin/opencode.exe`)),
)
console.log(`Installed ${target}`)
console.log("Run: opencode-jf web --port 4444")
