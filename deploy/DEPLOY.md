# Mewsfeed HWC Deployment

Deploy mewsfeed with the Holo Web Conductor (HWC) browser extension: UI on Cloudflare Pages, joining service on Cloudflare Worker, linker and conductors running locally.

## Architecture

```
Browser (HWC extension)
  → Cloudflare Pages (mewsfeed UI + .happ bundle)
  → Cloudflare Worker (joining service, invite_code auth)
  → Linker (local, tunneled via ngrok, white_list auth)
  → 2x Conductor (local, always-on, full-arc DHT nodes)
  → Public Holo bootstrap server
```

## Prerequisites

- Node.js 20+
- [Nix](https://developer.holochain.org/docs/install/) with `nix develop` for `holochain` and `hc` binaries
- [Cloudflare account](https://dash.cloudflare.com/) with API token
- [ngrok](https://ngrok.com/) installed (or set `LINKER_PUBLIC_URL` for an alternative tunnel)
- [h2hc-linker](https://github.com/AInonymous/h2hc-linker) repo cloned as a sibling directory
- [holo-web-conductor](https://github.com/AInonymous/holo-web-conductor) repo on `feat/joining-client` branch, with the extension built and loaded in Chrome

## Quick Start

```bash
# 1. Create config from template
cp deploy/config.example.sh deploy/config.sh

# 2. Edit config.sh with your Cloudflare credentials
#    CLOUDFLARE_ACCOUNT_ID="..."
#    CLOUDFLARE_API_TOKEN="..."

# 3. One-time setup (creates KV namespace, Pages project)
./deploy/deploy.sh setup

# 4. Enter nix shell (needed for holochain/hc binaries)
nix develop

# 5. Full deploy: build UI, deploy to Cloudflare, start local infra
./deploy/deploy.sh all
```

The script will output the Pages URL, Worker URL, tunnel URL, and invite code.

## Commands

| Command | Description |
|---------|-------------|
| `setup` | One-time Cloudflare setup (KV namespace, Pages project) |
| `build` | Build mewsfeed UI with joining service URL baked in |
| `deploy-cloud` | Deploy worker + pages to Cloudflare |
| `start-local` | Start conductors, linker, ngrok tunnel, seed KV |
| `stop-local` | Stop all local services |
| `seed-kv` | Re-seed KV with linker registration (e.g. after tunnel restart) |
| `status` | Show status of all components |
| `all` | Full deploy: build → deploy-cloud → start-local |

## Configuration

See `config.example.sh` for all options. Key settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | (required) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | (required) |
| `INVITE_CODES` | Comma-separated invite codes | `test-invite-123` |
| `HAPP_BUNDLE_PATH` | Path to .happ bundle | `../holo-web-conductor/fixtures/mewsfeed.happ` |
| `BOOTSTRAP_URL` | Kitsune2 bootstrap server | `https://dev-test-bootstrap2.holochain.org/` |
| `NUM_CONDUCTORS` | Number of always-on conductors | `2` |
| `LINKER_PUBLIC_URL` | Skip ngrok, use this URL | (empty = auto-start ngrok) |
| `LINKER_ADMIN_SECRET` | Shared secret for linker auth | (auto-generated on setup) |

## How It Works

1. **UI** is built with `JOINING_SERVICE_URL` pointing to the Cloudflare Worker, then deployed to Cloudflare Pages along with the `.happ` bundle.

2. **Joining service** runs as a Cloudflare Worker with `invite_code` auth. It stores sessions and linker registrations in Workers KV.

3. **Linker** runs locally with `H2HC_LINKER_ADMIN_SECRET` set, which enables white_list auth. ngrok tunnels it to a public URL.

4. **Conductors** (2x) run locally via `hc sandbox`, connected to the public bootstrap server for DHT networking.

5. When an HWC browser node connects:
   - The UI calls the joining service with an invite code
   - The joining service authorizes the agent on the linker via `POST /admin/agents`
   - The agent receives the linker URL and connects through the ngrok tunnel
   - The agent syncs data with the always-on conductors via the DHT

## Troubleshooting

**ngrok tunnel expired**: Free ngrok tunnels rotate URLs. Run `./deploy/deploy.sh seed-kv` after restarting ngrok to update the KV with the new URL.

**Conductors not syncing**: Arc establishment takes 30-90 seconds after conductors start. Check `status` and conductor logs in `$SANDBOX_DIR/conductor*.log`.

**"hc command not found"**: Run commands inside `nix develop` shell.

**Extension not connecting**: Make sure the HWC extension is built from the `feat/joining-client` branch and loaded in Chrome.
