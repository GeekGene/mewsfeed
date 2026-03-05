#!/usr/bin/env bash
# Mewsfeed Deployment Configuration
# Copy this file to deploy/config.sh and fill in your values.
#
# Usage: cp deploy/config.example.sh deploy/config.sh

# --- Cloudflare ---
# Required for deploying the joining service worker and UI pages.
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""

# Cloudflare workers subdomain (found in Workers & Pages → Settings)
CLOUDFLARE_WORKERS_SUBDOMAIN=""

# Cloudflare project/worker names
PAGES_PROJECT_NAME="mewsfeed"
# Pages subdomain (may differ from project name if the subdomain was taken).
# Check your project's Custom Domains in Cloudflare Pages dashboard.
# Leave empty to default to PAGES_PROJECT_NAME.
PAGES_SUBDOMAIN=""
WORKER_NAME="mewsfeed-joining"

# --- Linker Auth ---
# Shared secret between the linker and joining service.
# If empty, a random one is generated on first `setup`.
LINKER_ADMIN_SECRET=""

# --- Joining Service ---
# Auth method for HWC browser nodes.
# Comma-separated invite codes (at least one required for invite_code auth).
INVITE_CODES="test-invite-123"

# --- hApp ---
# Path to the .happ bundle file.
HAPP_BUNDLE_PATH="../holo-web-conductor/fixtures/mewsfeed.happ"

# --- Network ---
# Public bootstrap/relay server URL.
BOOTSTRAP_URL="https://dev-test-bootstrap2.holochain.org/"

# Number of always-on conductors to run locally.
NUM_CONDUCTORS=2

# --- Linker ---
# Path to h2hc-linker repo (contains the binary after build).
H2HC_LINKER_DIR="../h2hc-linker"

# Local port for the linker.
LINKER_PORT=8000

# --- Tunnel ---
# If set, skip starting a tunnel and use this URL directly.
# Useful for pre-existing tunnels or remote linkers.
LINKER_PUBLIC_URL=""

# Tunnel provider: "cloudflared" (default) or "ngrok".
TUNNEL_PROVIDER="cloudflared"

# Cloudflare Tunnel settings (when TUNNEL_PROVIDER="cloudflared")
CLOUDFLARED_BIN="cloudflared"

# ngrok settings (when TUNNEL_PROVIDER="ngrok")
NGROK_BIN="ngrok"

# --- Sandbox ---
# Directory for local conductor/linker state.
# Uses /tmp to avoid Unix socket path length limits.
SANDBOX_DIR="/tmp/mewsfeed-deploy"
