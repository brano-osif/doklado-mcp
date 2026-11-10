# doklado-mcp

Unofficial MCP server for [Doklado](https://doklado.com/sk), the Slovak invoicing app. Not made or supported by Doklado s.r.o., it only uses their public APIs. It lets Claude (or any MCP client) find invoices, download PDFs, email invoices and send or receive e-invoices (eFaktúra) over Peppol.

It wraps two Doklado APIs:

| API | What for | Auth |
|---|---|---|
| Public API | invoices, PDFs, email | API key |
| SAPI+ (optional) | eFaktúra over Peppol | OAuth client id and secret |

## Requirements

- Node.js 24 or newer (runs the TypeScript directly, no build step)
- A Doklado account with an API key (Prehľad účtu → API prepojenia)
- For eFaktúra: a SAPI+ connection (Prehľad účtu → SAPI+ prepojenia). The company needs eFaktúra activated first, see [Doklado SAPI+ docs](https://docs.doklado.sk/sapi-plus/overview).

## Install

```sh
git clone https://github.com/brano-osif/doklado-mcp.git
cd doklado-mcp
npm install
```

Put your secrets in an env file outside the repo, for example `~/.doklado.env`:

```sh
DOKLADO_API_KEY=...
DOKLADO_SAPI_CLIENT_ID=...
DOKLADO_SAPI_SECRET=...
```

### Claude Code

```sh
claude mcp add doklado-mcp -s user \
  -e DOKLADO_ICO=<your IČO> \
  -- node --env-file=$HOME/.doklado.env $PWD/src/index.ts
```

### Claude Desktop (extension, easiest)

1. Download `doklado-mcp.mcpb` from the [latest release](https://github.com/brano-osif/doklado-mcp/releases/latest), or build it with `npm run bundle`.
2. Double-click `doklado-mcp.mcpb`, or drag it into Claude Desktop → Settings → Extensions.
3. Fill in the form: API key, IČO, Test mode if the keys are from the sandbox, and optionally the SAPI+ Client ID and Secret for eFaktúra. Secrets are stored in the system keychain.

To change a key later, open Settings → Extensions → Doklado.

### Claude Desktop (manual config)

Add this to `~/Library/Application Support/Claude/claude_desktop_config.json` (Windows: `%APPDATA%\Claude\claude_desktop_config.json`) inside `mcpServers`, then quit Claude Desktop completely and reopen it:

```json
"doklado-mcp": {
  "command": "/opt/homebrew/bin/node",
  "args": ["/path/to/doklado-mcp/src/index.ts"],
  "env": {
    "DOKLADO_ICO": "<your IČO>",
    "DOKLADO_API_KEY": "...",
    "DOKLADO_SAPI_CLIENT_ID": "...",
    "DOKLADO_SAPI_SECRET": "..."
  }
}
```

Use absolute paths. Claude Desktop does not use your shell's PATH, so `command` must be the full path from `which node`. To share the keys with Claude Code, put them in the env file instead and add `"--env-file=/Users/<you>/.doklado.env"` as the first arg. Don't paste this file anywhere when it contains keys. Logs are in `~/Library/Logs/Claude/mcp-server-doklado-mcp.log`.

### Other MCP clients

Run `node --env-file=<file> src/index.ts` as a stdio server with the same variables.

## Configuration

| Variable | Required | Meaning |
|---|---|---|
| `DOKLADO_API_KEY` | yes | Public API key |
| `DOKLADO_ICO` | yes | IČO of your company in Doklado |
| `DOKLADO_SANDBOX` | no | `true` (or `1`, `yes`) uses the Doklado sandbox, otherwise your real account |
| `DOKLADO_ISSUE` | no | `true` enables `issue_invoice` (see costs) |
| `DOKLADO_SAPI_CLIENT_ID` | for eFaktúra | SAPI+ client id |
| `DOKLADO_SAPI_SECRET` | for eFaktúra | SAPI+ client secret |

The eFaktúra tools appear when both SAPI variables are set. If only one is set, the server prints a warning to its log and starts without them. Your DIČ (Peppol id `0245:<DIČ>`) is read from your company in Doklado, so it has to be filled in there.

Keys are per environment. A sandbox key does not work in production. Sandbox web app: [efaktura-sandbox.doklado.sk](https://efaktura-sandbox.doklado.sk).

## Tools

| Tool | What it does |
|---|---|
| `list_documents` | List invoices and receipts with filters, paginated |
| `get_document` | Full detail of one document |
| `update_issued_invoice` | Edit an issued invoice |
| `get_invoice_pdf` | Save the invoice PDF to `~/Downloads` |
| `send_invoice_by_email` | Email the invoice PDF |
| `issue_invoice` | Issue a new invoice (only with `DOKLADO_ISSUE=true`) |
| `einvoice_lookup` | Can a company receive eFaktúra? (by DIČ) |
| `send_einvoice` | Send a Peppol BIS 3 UBL invoice or credit note |
| `einvoice_list_received` | List received eFaktúry |
| `einvoice_get_received` | Save a received eFaktúra XML to `~/Downloads` |
| `einvoice_acknowledge` | Mark a received eFaktúra as processed |

Tool descriptions carry the details Claude needs (filters, quirks, a validated UBL pattern).

## Costs

Doklado bills API usage. As of November 2026:

- Public API: 1 € per started 1,000 units, 1,000 a month included in Doklado PLUS. Listing costs 1 unit per document read, so filter by date.
- `issue_invoice` uses the separate "Vystavenie faktúr cez API" module, 14.90 € a month. That is why it is off by default.
- eFaktúra through the Doklado postman has no extra fee, each one counts as a document in your plan.

See [Doklado API pricing](https://docs.doklado.sk/api-public/pricing).

## Safety

- Calls that change data (update, email, send eFaktúra) are never retried after a timeout or network error, the tool says to verify first. The only automatic retry is one fresh SAPI+ login after a 401, which Doklado rejects before doing anything.
- `send_einvoice` uses an idempotency key derived from your Peppol id, the customer's and the invoice number, so resending the same invoice never delivers it twice, even if the XML is rebuilt.
- The server never logs keys or tokens.

## Development

```
src/index.ts      MCP server wiring
src/config.ts     environment variables
src/api/          Doklado Public API and SAPI+ clients
src/tools/        tool definitions and their descriptions
src/types/        shared types
src/utils/        request, Peppol helpers, downloads, OpenAPI schemas
```

Code style follows Prettier (`npm run format`).

```sh
npm run check   # type check
npm run lint    # Prettier check
npm run format  # Prettier fix
npm test        # runs against the sandbox, needs a sandbox env file
npm run bundle  # builds doklado-mcp.mcpb for Claude Desktop
```

`npm test` runs against the Doklado sandbox. Put your sandbox values in `.env.test` (ignored by git):

```sh
DOKLADO_SANDBOX=true
DOKLADO_ICO=...
DOKLADO_DIC=...
DOKLADO_API_KEY=...
DOKLADO_SAPI_CLIENT_ID=...   # optional, enables the eFaktúra checks
DOKLADO_SAPI_SECRET=...
```

It only reads data and checks errors. It does not issue invoices or send email.

## Releasing

1. Bump `version` in `package.json` and `manifest.json`.
2. Commit, then tag and push: `git tag v1.4.0 && git push origin v1.4.0`.
3. GitHub Actions type checks, builds `doklado-mcp.mcpb` and attaches it to a new release. It fails if the tag and the two versions differ.

## Disclaimer

Unofficial project, not affiliated with Doklado s.r.o. `openapi.json` is Doklado's public API specification from [api-doc.doklado.sk](https://api-doc.doklado.sk), included so tool schemas match the API.

## License

MIT
