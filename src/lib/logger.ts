export type LogLevel = "info" | "warn" | "error" | "debug";

export function log(level: LogLevel, message: string, data?: unknown): void {
  const entry = data !== undefined
    ? `[suno-mcp] ${level.toUpperCase()} ${message} ${JSON.stringify(data)}`
    : `[suno-mcp] ${level.toUpperCase()} ${message}`;
  process.stderr.write(entry + "\n");
}
