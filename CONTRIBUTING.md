# Contributing

Contributions are welcome — bug fixes, new tools, and documentation improvements alike.

## Getting started

```bash
git clone https://github.com/travelhawk/suno-api-mcp.git
cd suno-api-mcp
npm install
cp .env.example .env   # add your SUNOAPI_KEY
npm run dev            # start the server with live TypeScript
```

## Guidelines

- **Stderr only.** All logging must go through `src/lib/logger.ts` → `process.stderr`. Never write to stdout — that channel is owned by the MCP JSON-RPC transport.
- **Zod schemas first.** Add every new tool's input schema to `src/types/inputs.ts` before wiring up the handler.
- **Semantic, not mechanical.** New tools should represent a meaningful creative action, not a thin wrapper around a single API endpoint.
- **Type-check before PR.** Run `npm run typecheck` and fix all errors.

## Adding a tool

1. Add a Zod schema to `src/types/inputs.ts`.
2. Create `src/tools/<tool-name>.ts` with the handler function.
3. Register the tool in `src/server.ts` with a clear, model-facing description.
4. Update the tool table in `README.md`.

## Pull requests

- Keep PRs focused — one logical change per PR.
- Describe *why* the change is needed, not just what it does.
- Squash fixup commits before merging.

## License

By contributing you agree that your changes will be released under the [MIT License](LICENSE).
