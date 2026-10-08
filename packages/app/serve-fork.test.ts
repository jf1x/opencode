import { expect, test } from "bun:test"
import { fetch } from "bun"
import { createServer } from "node:http"
import { preview } from "vite"
import { forkConfig } from "./serve-fork"

test("forwards API requests with query strings and keeps frontend assets local", async () => {
  const backend = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1")
    response.setHeader("content-type", "application/json")
    response.end(JSON.stringify({ path: url.pathname, query: url.search }))
  })
  await new Promise<void>((resolve) => backend.listen(0, "127.0.0.1", resolve))
  const target = backend.address()
  if (!target || typeof target === "string") throw new Error("Backend has no TCP address")
  const server = await preview({
    ...forkConfig,
    configFile: false,
    logLevel: "silent",
    preview: {
      ...forkConfig.preview,
      port: 0,
      strictPort: false,
      proxy: Object.fromEntries(
        Object.entries(forkConfig.preview.proxy).map(([route, options]) => [
          route,
          { ...options, target: `http://127.0.0.1:${target.port}` },
        ]),
      ),
    },
  })
  try {
    const address = server.httpServer.address()
    if (!address || typeof address === "string") throw new Error("Preview server has no TCP address")
    const origin = `http://127.0.0.1:${address.port}`
    for (const path of [
      "/file?path=.&directory=C%3A%2FProjects%2FExampleApp",
      "/project?directory=C%3A%2FProjects",
      "/session?limit=100",
      "/global/health",
      "/api/fs/list?path=.",
    ]) {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(5000) })
      expect(response.headers.get("content-type")).toContain("application/json")
      const url = new URL(path, origin)
      expect(await response.json()).toEqual({ path: url.pathname, query: url.search })
    }
    const asset = await fetch(origin + "/favicon.ico", { signal: AbortSignal.timeout(5000) })
    expect(asset.headers.get("content-type")).not.toContain("application/json")
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.httpServer.close((error) => (error ? reject(error) : resolve()))
      server.httpServer.closeAllConnections()
    })
    await new Promise<void>((resolve, reject) => {
      backend.close((error) => (error ? reject(error) : resolve()))
      backend.closeAllConnections()
    })
  }
})
