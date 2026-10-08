import { fileURLToPath } from "node:url"
import { preview, type InlineConfig } from "vite"

export const forkConfig = {
  root: fileURLToPath(new URL(".", import.meta.url)),
  configFile: fileURLToPath(new URL("./vite.config.ts", import.meta.url)),
  preview: {
    host: "127.0.0.1",
    port: Number(process.env.OPENCODE_WEB_PORT ?? 4444),
    strictPort: true,
    proxy: {
      "^/(api|global|event|auth|log|agent|skill|experimental|config|find|file|instance|path|vcs|command|lsp|formatter|mcp|project|pty|question|permission|provider|session)(/|\\?|$)":
        {
          target: process.env.OPENCODE_SERVER_URL ?? "http://127.0.0.1:4096",
          changeOrigin: true,
          ws: true,
        },
    },
  },
} satisfies InlineConfig

if (import.meta.main) {
  const server = await preview(forkConfig)
  server.printUrls()
}
