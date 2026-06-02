import * as esbuild from "esbuild";
import { chmod } from "node:fs/promises";

await esbuild.build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: "dist/server.cjs",
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

// Make the output executable on Unix-like systems
try {
  await chmod("dist/server.cjs", 0o755);
} catch {
  // Windows does not support chmod — ignore
}

console.error("Build complete: dist/server.cjs");
