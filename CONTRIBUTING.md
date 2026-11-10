# Contributing

Thanks for helping. Bug reports, fixes and small improvements are welcome.

## Before you start

For anything bigger than a small fix, open an issue first so we can agree on the approach.

This is an unofficial project. Questions about Doklado itself (accounts, pricing, eFaktúra activation) belong to [Doklado support](mailto:podpora@doklado.sk).

## Setup

```sh
git clone https://github.com/brano-osif/doklado-mcp.git
cd doklado-mcp
npm install
```

Create a free account in the [Doklado sandbox](https://efaktura-sandbox.doklado.sk) and put its values in `.env.test` as described in the README. Never use production keys for development.

## Making a change

1. Fork the repo and create a branch from `main`.
2. Keep the change focused. One fix or feature per pull request.
3. Run the checks:

   ```sh
   npm run check    # type check
   npm run format   # Prettier
   npm test         # against your sandbox
   ```

4. Open a pull request and describe what changed and how you tested it.

CI must pass before a pull request can be merged. `main` only accepts changes through pull requests.

## Guidelines

- Match the existing structure: API clients in `src/api`, tools in `src/tools`, types in `src/types`, helpers in `src/utils`.
- Tool descriptions in `src/tools/descriptions.ts` are what Claude reads. Keep them accurate and specific.
- Calls that change data must never be retried automatically after a timeout.
- Do not commit keys, `.env` files or real customer data.

## Releases

Releases are made by the maintainer by pushing a `v*` tag. See the README.
