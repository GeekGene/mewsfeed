#!/usr/bin/env bash
#
# Mewsfeed Deployment Script
#
# Orchestrates a full e2e deployment:
#   - Cloudflare Worker (joining service with invite_code auth)
#   - Cloudflare Pages (mewsfeed UI + .happ bundle)
#   - Local linker (h2hc-linker with allow_list auth, tunneled via cloudflared/ngrok)
#   - Local conductors (2x always-on nodes)
#
# Usage:
#   ./deploy/deploy.sh <command>
#
# Commands:
#   setup        One-time setup: create KV namespace, Pages project
#   build        Build mewsfeed UI with joining service URL
#   deploy-cloud Deploy worker + pages to Cloudflare
#   start-local  Start conductors, linker, tunnel, and seed KV
#   stop-local      Stop all local services (tunnel, linker, conductors)
#   restart-tunnel  Restart tunnel and re-seed KV (keeps conductors/linker)
#   seed-kv         Seed KV with linker registration data
#   status       Show status of all components
#   all          Full deploy: build → deploy-cloud → start-local
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${CYAN}[STEP]${NC} $1"; }

# ──────────────────────────────────────────────
# Load config
# ──────────────────────────────────────────────

load_config() {
    local config_file="$SCRIPT_DIR/config.sh"
    if [ ! -f "$config_file" ]; then
        log_error "Config file not found: $config_file"
        log_info "Run: cp deploy/config.example.sh deploy/config.sh"
        exit 1
    fi
    # shellcheck source=config.example.sh
    source "$config_file"

    # Resolve relative paths from project root
    HAPP_BUNDLE_PATH="$(cd "$PROJECT_DIR" && realpath "$HAPP_BUNDLE_PATH")"
    H2HC_LINKER_DIR="$(cd "$PROJECT_DIR" && realpath "$H2HC_LINKER_DIR")"

    # Defaults
    SANDBOX_DIR="${SANDBOX_DIR:-/tmp/mewsfeed-deploy}"
    LINKER_PORT="${LINKER_PORT:-8000}"
    NUM_CONDUCTORS="${NUM_CONDUCTORS:-2}"
    BOOTSTRAP_URL="${BOOTSTRAP_URL:-https://dev-test-bootstrap2.holochain.org/}"
    RELAY_URL="${RELAY_URL:-https://use1-1.relay.n0.iroh-canary.iroh.link./}"
    PAGES_PROJECT_NAME="${PAGES_PROJECT_NAME:-mewsfeed}"
    WORKER_NAME="${WORKER_NAME:-mewsfeed-joining}"
    TUNNEL_PROVIDER="${TUNNEL_PROVIDER:-cloudflared}"
    CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-cloudflared}"
    NGROK_BIN="${NGROK_BIN:-ngrok}"
    INVITE_CODES="${INVITE_CODES:-test-invite-123}"

    LINKER_BINARY="$H2HC_LINKER_DIR/target/release/h2hc-linker"
    WRANGLER_TOML="$SCRIPT_DIR/cloudflare/wrangler.toml"
    JOINING_SERVICE_DIR="$(cd "$PROJECT_DIR" && realpath "../joining-service")"
}

# ──────────────────────────────────────────────
# State file helpers
# ──────────────────────────────────────────────

save_state() { echo "$2" > "$SANDBOX_DIR/$1"; }
read_state() { cat "$SANDBOX_DIR/$1" 2>/dev/null || echo ""; }

# ──────────────────────────────────────────────
# setup: One-time Cloudflare setup
# ──────────────────────────────────────────────

cmd_setup() {
    log_step "Setting up Cloudflare resources..."

    if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        log_error "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set in config.sh"
        exit 1
    fi

    export CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN

    # Generate admin secret if not set
    if [ -z "$LINKER_ADMIN_SECRET" ]; then
        LINKER_ADMIN_SECRET=$(openssl rand -hex 32)
        log_info "Generated LINKER_ADMIN_SECRET (save this in config.sh):"
        echo "  LINKER_ADMIN_SECRET=\"$LINKER_ADMIN_SECRET\""
        # Append to config
        echo "" >> "$SCRIPT_DIR/config.sh"
        echo "# Auto-generated linker admin secret" >> "$SCRIPT_DIR/config.sh"
        echo "LINKER_ADMIN_SECRET=\"$LINKER_ADMIN_SECRET\"" >> "$SCRIPT_DIR/config.sh"
    fi

    # Create wrangler.toml from example if it doesn't exist
    if [ ! -f "$WRANGLER_TOML" ]; then
        log_info "Creating wrangler.toml from example template..."
        cp "$SCRIPT_DIR/cloudflare/wrangler.example.toml" "$WRANGLER_TOML"
    fi

    # Create KV namespace
    log_info "Creating KV namespace..."
    local kv_output
    kv_output=$(npx wrangler kv namespace create SESSIONS \
        --config "$WRANGLER_TOML" 2>&1) || true
    echo "$kv_output"

    local kv_id
    kv_id=$(echo "$kv_output" | grep -oP 'id = "\K[^"]+' | head -1 || true)
    if [ -n "$kv_id" ]; then
        log_info "KV namespace ID: $kv_id"
        # Update wrangler.toml with the real ID
        sed -i "s/REPLACE_WITH_KV_NAMESPACE_ID/$kv_id/" "$WRANGLER_TOML"
        mkdir -p "$SANDBOX_DIR"
        save_state "kv_namespace_id.txt" "$kv_id"
    else
        log_warn "Could not extract KV namespace ID. Check output above."
        log_warn "If namespace already exists, get the ID from Cloudflare dashboard."
    fi

    # Create preview KV namespace
    local preview_output
    preview_output=$(npx wrangler kv namespace create SESSIONS --preview \
        --config "$WRANGLER_TOML" 2>&1) || true
    local preview_id
    preview_id=$(echo "$preview_output" | grep -oP 'id = "\K[^"]+' | head -1 || true)
    if [ -n "$preview_id" ]; then
        sed -i "s/REPLACE_WITH_PREVIEW_KV_NAMESPACE_ID/$preview_id/" "$WRANGLER_TOML"
    fi

    # Create Pages project
    log_info "Creating Cloudflare Pages project: $PAGES_PROJECT_NAME"
    npx wrangler pages project create "$PAGES_PROJECT_NAME" \
        --production-branch main 2>&1 || log_warn "Pages project may already exist"

    # Determine worker URL
    local worker_url="https://${WORKER_NAME}.${CLOUDFLARE_WORKERS_SUBDOMAIN}.workers.dev"
    log_info "Worker will be at: $worker_url"
    mkdir -p "$SANDBOX_DIR"
    save_state "worker_url.txt" "$worker_url"

    echo ""
    log_info "Setup complete. Next steps:"
    echo "  1. Verify KV namespace IDs in deploy/cloudflare/wrangler.toml"
    echo "  2. Run: ./deploy/deploy.sh all"
}

# ──────────────────────────────────────────────
# build: Build mewsfeed UI
# ──────────────────────────────────────────────

cmd_build() {
    log_step "Building mewsfeed UI..."

    local worker_url="https://${WORKER_NAME}.${CLOUDFLARE_WORKERS_SUBDOMAIN}.workers.dev/v1"

    log_info "JOINING_SERVICE_URL=$worker_url"

    cd "$PROJECT_DIR/ui"

    # Install deps if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing UI dependencies..."
        npm install
    fi

    # Build with joining service URL baked in
    JOINING_SERVICE_URL="$worker_url" npm run build

    # Set HWC runtime context for the deployed build
    cat > "$PROJECT_DIR/ui/dist/runtime-config.js" <<'RTEOF'
window.__HOLOCHAIN_RUNTIME__ = "hwc";
RTEOF
    log_info "Set runtime-config.js to HWC mode"

    # Copy hApp bundle into dist for Pages hosting
    if [ -f "$HAPP_BUNDLE_PATH" ]; then
        cp "$HAPP_BUNDLE_PATH" "$PROJECT_DIR/ui/dist/mewsfeed.happ"
        log_info "Copied .happ bundle to dist/mewsfeed.happ"
    else
        log_error "hApp bundle not found at $HAPP_BUNDLE_PATH"
        exit 1
    fi

    log_info "UI built successfully"
}

# ──────────────────────────────────────────────
# deploy-cloud: Deploy worker and pages
# ──────────────────────────────────────────────

cmd_deploy_cloud() {
    log_step "Deploying to Cloudflare..."

    export CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN

    # Determine Pages URL for happ_bundle_url
    # PAGES_SUBDOMAIN may differ from PAGES_PROJECT_NAME if Cloudflare assigned a different subdomain
    local pages_subdomain="${PAGES_SUBDOMAIN:-$PAGES_PROJECT_NAME}"
    local pages_url="https://${pages_subdomain}.pages.dev"

    # Build CONFIG_JSON
    local invite_codes_json
    invite_codes_json=$(echo "$INVITE_CODES" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | paste -sd',' | sed 's/^/[/;s/$/]/')

    local config_json
    config_json=$(cat <<ENDJSON
{
  "happ": {
    "id": "mewsfeed",
    "name": "MewsFeed",
    "happ_bundle_url": "${pages_url}/mewsfeed.happ"
  },
  "auth_methods": ["invite_code"],
  "invite_codes": ${invite_codes_json},
  "linker_auth": {
    "capabilities": ["dht_read", "dht_write", "k2"]
  },
  "session": { "store": "cloudflare-kv" }
}
ENDJSON
)

    log_info "CONFIG_JSON:"
    echo "$config_json" | head -20

    # Deploy worker
    log_info "Deploying joining service worker..."

    # Set CONFIG_JSON secret via pipe
    echo "$config_json" | npx wrangler secret put CONFIG_JSON \
        --config "$WRANGLER_TOML" \
        --name "$WORKER_NAME" 2>&1 || log_warn "Secret put may have failed"

    npx wrangler deploy \
        --config "$WRANGLER_TOML" \
        --name "$WORKER_NAME"

    local worker_url="https://${WORKER_NAME}.${CLOUDFLARE_WORKERS_SUBDOMAIN}.workers.dev"
    save_state "worker_url.txt" "$worker_url"
    log_info "Worker deployed: $worker_url"

    # Build UI if not already built
    if [ ! -d "$PROJECT_DIR/ui/dist" ]; then
        cmd_build
    fi

    # Deploy pages
    log_info "Deploying UI to Cloudflare Pages..."
    npx wrangler pages deploy "$PROJECT_DIR/ui/dist" \
        --project-name "$PAGES_PROJECT_NAME" \
        --branch main

    save_state "pages_url.txt" "$pages_url"
    log_info "Pages deployed: $pages_url"
}

# ──────────────────────────────────────────────
# start-local: Start conductors, linker, tunnel
# ──────────────────────────────────────────────

cmd_start_local() {
    log_step "Starting local infrastructure..."

    mkdir -p "$SANDBOX_DIR"

    check_local_prereqs
    start_conductors
    start_linker
    start_tunnel
    cmd_seed_kv

    echo ""
    log_info "Local infrastructure running."
    cmd_status
}

check_local_prereqs() {
    log_info "Checking prerequisites..."

    if ! command -v hc &> /dev/null; then
        log_error "hc command not found. Run inside 'nix develop' shell."
        exit 1
    fi

    if ! command -v holochain &> /dev/null; then
        log_error "holochain command not found. Run inside 'nix develop' shell."
        exit 1
    fi

    if [ ! -f "$HAPP_BUNDLE_PATH" ]; then
        log_error "hApp bundle not found at $HAPP_BUNDLE_PATH"
        exit 1
    fi

    if [ ! -f "$LINKER_BINARY" ]; then
        log_info "Building h2hc-linker..."
        (cd "$H2HC_LINKER_DIR" && cargo build --release)
    fi

    log_info "Prerequisites OK"
}

start_conductors() {
    log_info "Starting $NUM_CONDUCTORS conductor(s)..."

    # Check if all conductors are already running
    local all_running=true
    for i in $(seq 1 "$NUM_CONDUCTORS"); do
        local SUFFIX=""
        [ "$i" -gt 1 ] && SUFFIX="_$i"
        local PID_FILE="$SANDBOX_DIR/conductor$SUFFIX.pid"
        if ! ([ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null); then
            all_running=false
            break
        fi
    done

    if [ "$all_running" = true ]; then
        log_warn "All $NUM_CONDUCTORS conductor(s) already running, skipping"
        return 0
    fi

    # Kill stale processes before starting fresh
    pkill -f "holochain.*mewsfeed-deploy" 2>/dev/null || true
    sleep 1

    for i in $(seq 1 "$NUM_CONDUCTORS"); do
        start_conductor_instance "$i"
        sleep 1
    done

    # Wait for arc establishment if multi-conductor
    if [ "$NUM_CONDUCTORS" -ge 2 ]; then
        wait_for_arc_establishment
    fi
}

start_conductor_instance() {
    local INDEX=$1
    local SUFFIX=""
    [ "$INDEX" -gt 1 ] && SUFFIX="_$INDEX"

    log_info "Starting conductor $INDEX..."

    local DATA_DIR="$SANDBOX_DIR/data$SUFFIX"
    local PID_FILE="$SANDBOX_DIR/conductor$SUFFIX.pid"
    local LOG_FILE="$SANDBOX_DIR/conductor$SUFFIX.log"
    local ADMIN_FILE="$SANDBOX_DIR/admin_port$SUFFIX.txt"

    # Check if already running
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warn "Conductor $INDEX already running"
        return 0
    fi

    rm -rf "$DATA_DIR" "$LOG_FILE" 2>/dev/null || true
    mkdir -p "$DATA_DIR"

    local INSTANCE_APP_ID="mewsfeed"
    [ "$INDEX" -gt 1 ] && INSTANCE_APP_ID="mewsfeed_${INDEX}"

    (echo "test-passphrase" | \
        RUST_LOG="info,holochain=debug,kitsune2=debug" \
        hc sandbox --piped generate \
            --in-process-lair \
            --run 0 \
            --app-id "$INSTANCE_APP_ID" \
            --root "$DATA_DIR" \
            "$HAPP_BUNDLE_PATH" \
            network -b "$BOOTSTRAP_URL" quic "$RELAY_URL") \
        > "$LOG_FILE" 2>&1 &

    local PID=$!
    echo "$PID" > "$PID_FILE"

    log_info "Waiting for conductor $INDEX (PID: $PID)..."
    for _ in $(seq 1 60); do
        if grep -q '"admin_port":' "$LOG_FILE" 2>/dev/null; then
            local ADMIN_PORT
            ADMIN_PORT=$(grep -oP '"admin_port":\K\d+' "$LOG_FILE" | head -1)
            echo "$ADMIN_PORT" > "$ADMIN_FILE"
            log_info "Conductor $INDEX ready (admin port $ADMIN_PORT)"
            return 0
        fi
        if ! kill -0 "$PID" 2>/dev/null; then
            log_error "Conductor $INDEX died. Log:"
            tail -20 "$LOG_FILE"
            exit 1
        fi
        sleep 1
    done

    log_error "Conductor $INDEX timed out. Check $LOG_FILE"
    exit 1
}

wait_for_arc_establishment() {
    log_info "Waiting for DHT arc establishment between conductors..."

    local MAX_WAIT=90
    local WAITED=0

    sleep 10
    WAITED=10

    while [ $WAITED -lt $MAX_WAIT ]; do
        local ALL_RUNNING=true
        for i in $(seq 1 "$NUM_CONDUCTORS"); do
            local SUFFIX=""
            [ "$i" -gt 1 ] && SUFFIX="_$i"
            local PID_FILE="$SANDBOX_DIR/conductor$SUFFIX.pid"
            if [ ! -f "$PID_FILE" ] || ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
                ALL_RUNNING=false
            fi
        done

        if [ "$ALL_RUNNING" = false ]; then
            log_error "Not all conductors running"
            return 1
        fi

        if [ $WAITED -ge 30 ]; then
            log_info "Arc establishment assumed after ${WAITED}s"
            return 0
        fi

        [ $((WAITED % 10)) -eq 0 ] && log_info "Arc establishment: ${WAITED}s / ${MAX_WAIT}s..."
        sleep 5
        WAITED=$((WAITED + 5))
    done

    log_warn "Arc establishment timeout after ${WAITED}s, continuing anyway"
}

start_linker() {
    log_info "Starting h2hc-linker on port $LINKER_PORT..."

    local PID_FILE="$SANDBOX_DIR/linker.pid"
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warn "Linker already running (PID $(cat "$PID_FILE"))"
        return 0
    fi
    # Clean up any stale linker processes
    pkill -f "h2hc-linker" 2>/dev/null || true

    local ADMIN_PORT
    ADMIN_PORT=$(read_state "admin_port.txt")
    if [ -z "$ADMIN_PORT" ]; then
        log_error "No admin port found. Start conductors first."
        exit 1
    fi

    env \
    H2HC_LINKER_CONDUCTOR_URL="127.0.0.1:$ADMIN_PORT" \
    H2HC_LINKER_BOOTSTRAP_URL="$BOOTSTRAP_URL" \
    H2HC_LINKER_RELAY_URL="$RELAY_URL" \
    H2HC_LINKER_ADMIN_SECRET="$LINKER_ADMIN_SECRET" \
    RUST_LOG="info,h2hc_linker=debug" \
    "$LINKER_BINARY" --port "$LINKER_PORT" > "$SANDBOX_DIR/linker.log" 2>&1 &

    local PID=$!
    echo "$PID" > "$SANDBOX_DIR/linker.pid"

    for _ in $(seq 1 15); do
        if curl -s "http://localhost:$LINKER_PORT/health" > /dev/null 2>&1; then
            log_info "Linker running on port $LINKER_PORT (auth enabled)"
            return 0
        fi
        if ! kill -0 "$PID" 2>/dev/null; then
            log_error "Linker died. Log:"
            tail -20 "$SANDBOX_DIR/linker.log"
            exit 1
        fi
        sleep 1
    done

    if kill -0 "$PID" 2>/dev/null; then
        log_info "Linker started (health endpoint not responding, but process running)"
    else
        log_error "Linker failed to start. Check $SANDBOX_DIR/linker.log"
        exit 1
    fi
}

start_tunnel() {
    if [ -n "${LINKER_PUBLIC_URL:-}" ]; then
        log_info "Using provided LINKER_PUBLIC_URL: $LINKER_PUBLIC_URL"
        save_state "tunnel_url.txt" "$LINKER_PUBLIC_URL"
        return 0
    fi

    case "$TUNNEL_PROVIDER" in
        cloudflared) start_tunnel_cloudflared ;;
        ngrok)       start_tunnel_ngrok ;;
        *)
            log_error "Unknown TUNNEL_PROVIDER: $TUNNEL_PROVIDER (expected 'cloudflared' or 'ngrok')"
            exit 1
            ;;
    esac
}

start_tunnel_cloudflared() {
    log_info "Starting cloudflared tunnel to localhost:$LINKER_PORT..."

    if ! command -v "$CLOUDFLARED_BIN" &> /dev/null; then
        log_error "cloudflared not found at '$CLOUDFLARED_BIN'. Install cloudflared or set LINKER_PUBLIC_URL."
        exit 1
    fi

    # Kill existing cloudflared quick tunnel if running
    pkill -f "cloudflared.*tunnel.*--url" 2>/dev/null || true
    sleep 1

    "$CLOUDFLARED_BIN" tunnel --url "http://localhost:$LINKER_PORT" \
        > "$SANDBOX_DIR/cloudflared.log" 2>&1 &
    local PID=$!
    echo "$PID" > "$SANDBOX_DIR/cloudflared.pid"

    log_info "Waiting for cloudflared tunnel URL..."
    local TUNNEL_URL=""
    for _ in $(seq 1 30); do
        TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' \
            "$SANDBOX_DIR/cloudflared.log" 2>/dev/null | head -1) || true
        if [ -n "$TUNNEL_URL" ]; then
            break
        fi
        if ! kill -0 "$PID" 2>/dev/null; then
            log_error "cloudflared died. Log:"
            tail -20 "$SANDBOX_DIR/cloudflared.log"
            exit 1
        fi
        sleep 1
    done

    if [ -z "$TUNNEL_URL" ]; then
        log_error "Could not get cloudflared tunnel URL. Check $SANDBOX_DIR/cloudflared.log"
        exit 1
    fi

    save_state "tunnel_url.txt" "$TUNNEL_URL"
    log_info "Tunnel URL: $TUNNEL_URL"
}

start_tunnel_ngrok() {
    log_info "Starting ngrok tunnel to localhost:$LINKER_PORT..."

    if ! command -v "$NGROK_BIN" &> /dev/null; then
        log_error "ngrok not found at '$NGROK_BIN'. Install ngrok or set LINKER_PUBLIC_URL."
        exit 1
    fi

    # Kill existing ngrok if running
    pkill -f "ngrok http" 2>/dev/null || true
    sleep 1

    "$NGROK_BIN" http "$LINKER_PORT" > "$SANDBOX_DIR/ngrok.log" 2>&1 &
    local PID=$!
    echo "$PID" > "$SANDBOX_DIR/ngrok.pid"

    log_info "Waiting for ngrok API..."
    local TUNNEL_URL=""
    for _ in $(seq 1 15); do
        TUNNEL_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
            | jq -r '.tunnels[] | select(.proto == "https") | .public_url' 2>/dev/null \
            | head -1) || true
        if [ -n "$TUNNEL_URL" ]; then
            break
        fi
        sleep 1
    done

    if [ -z "$TUNNEL_URL" ]; then
        log_error "Could not get ngrok tunnel URL. Check $SANDBOX_DIR/ngrok.log"
        exit 1
    fi

    save_state "tunnel_url.txt" "$TUNNEL_URL"
    log_info "Tunnel URL: $TUNNEL_URL"
}

# ──────────────────────────────────────────────
# restart-tunnel: Restart tunnel without touching conductors/linker
# ──────────────────────────────────────────────

stop_tunnel() {
    if [ -f "$SANDBOX_DIR/cloudflared.pid" ]; then
        local PID
        PID=$(cat "$SANDBOX_DIR/cloudflared.pid")
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Stopping cloudflared (PID $PID)..."
            kill "$PID" 2>/dev/null || true
        fi
        rm -f "$SANDBOX_DIR/cloudflared.pid"
    fi
    pkill -f "cloudflared.*tunnel.*--url" 2>/dev/null || true

    if [ -f "$SANDBOX_DIR/ngrok.pid" ]; then
        local PID
        PID=$(cat "$SANDBOX_DIR/ngrok.pid")
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Stopping ngrok (PID $PID)..."
            kill "$PID" 2>/dev/null || true
        fi
        rm -f "$SANDBOX_DIR/ngrok.pid"
    fi
    pkill -f "ngrok http" 2>/dev/null || true
}

cmd_restart_tunnel() {
    log_step "Restarting tunnel..."
    stop_tunnel
    sleep 1
    start_tunnel
    cmd_seed_kv
    log_info "Tunnel restarted and KV updated."
}

# ──────────────────────────────────────────────
# seed-kv: Seed worker KV with linker registration
# ──────────────────────────────────────────────

cmd_seed_kv() {
    log_step "Seeding KV with linker registration..."

    export CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_API_TOKEN

    local tunnel_url
    tunnel_url=$(read_state "tunnel_url.txt")
    if [ -z "$tunnel_url" ]; then
        log_error "No tunnel URL found. Start local infrastructure first."
        exit 1
    fi

    local kv_id
    kv_id=$(read_state "kv_namespace_id.txt")
    if [ -z "$kv_id" ]; then
        # Try to get from wrangler.toml
        kv_id=$(grep -oP '^id = "\K[^"]+' "$WRANGLER_TOML" | head -1)
    fi

    if [ -z "$kv_id" ] || [ "$kv_id" = "REPLACE_WITH_KV_NAMESPACE_ID" ]; then
        log_error "KV namespace ID not found. Run 'setup' first."
        exit 1
    fi

    local registration_json
    registration_json=$(cat <<ENDJSON
[{"linker_url":{"url":"${tunnel_url}"},"admin":{"url":"${tunnel_url}","secret":"${LINKER_ADMIN_SECRET}"}}]
ENDJSON
)

    log_info "Writing linker_registrations to KV namespace $kv_id"
    log_info "  linker_url: $tunnel_url"
    log_info "  admin_url:  $tunnel_url"

    npx wrangler kv key put \
        --namespace-id="$kv_id" \
        --remote \
        "linker_registrations" \
        "$registration_json"

    log_info "KV seeded successfully"
}

# ──────────────────────────────────────────────
# stop-local: Stop all local services
# ──────────────────────────────────────────────

cmd_stop_local() {
    log_step "Stopping local services..."

    stop_tunnel

    # Stop linker
    if [ -f "$SANDBOX_DIR/linker.pid" ]; then
        local PID
        PID=$(cat "$SANDBOX_DIR/linker.pid")
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Stopping linker (PID $PID)..."
            kill "$PID" 2>/dev/null || true
        fi
        rm -f "$SANDBOX_DIR/linker.pid"
    fi
    pkill -f "h2hc-linker" 2>/dev/null || true

    # Stop conductors
    for pid_file in "$SANDBOX_DIR"/conductor*.pid; do
        if [ -f "$pid_file" ]; then
            local PID
            PID=$(cat "$pid_file")
            if kill -0 "$PID" 2>/dev/null; then
                log_info "Stopping conductor (PID $PID)..."
                kill "$PID" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    pkill -f "holochain.*mewsfeed-deploy" 2>/dev/null || true
    pkill -f "hc sandbox" 2>/dev/null || true

    log_info "All local services stopped"
}

# ──────────────────────────────────────────────
# status: Show status of all components
# ──────────────────────────────────────────────

cmd_status() {
    echo ""
    echo "=== Mewsfeed Deployment Status ==="
    echo ""

    # Conductors
    local conductor_count=0
    for i in $(seq 1 "${NUM_CONDUCTORS:-2}"); do
        local suffix=""
        [ "$i" -gt 1 ] && suffix="_$i"
        local pid_file="$SANDBOX_DIR/conductor$suffix.pid"
        local admin_file="$SANDBOX_DIR/admin_port$suffix.txt"
        if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
            local port
            port=$(cat "$admin_file" 2>/dev/null || echo "?")
            echo -e "  Conductor $i: ${GREEN}RUNNING${NC} (admin port $port)"
            conductor_count=$((conductor_count + 1))
        else
            echo -e "  Conductor $i: ${RED}STOPPED${NC}"
        fi
    done

    # Linker
    if [ -f "$SANDBOX_DIR/linker.pid" ] && kill -0 "$(cat "$SANDBOX_DIR/linker.pid")" 2>/dev/null; then
        echo -e "  Linker:      ${GREEN}RUNNING${NC} on port $LINKER_PORT (auth enabled)"
    else
        echo -e "  Linker:      ${RED}STOPPED${NC}"
    fi

    # Tunnel
    local tunnel_url
    tunnel_url=$(read_state "tunnel_url.txt")
    if [ -f "$SANDBOX_DIR/cloudflared.pid" ] && kill -0 "$(cat "$SANDBOX_DIR/cloudflared.pid")" 2>/dev/null; then
        echo -e "  Tunnel:      ${GREEN}RUNNING${NC} (cloudflared) → $tunnel_url"
    elif [ -f "$SANDBOX_DIR/ngrok.pid" ] && kill -0 "$(cat "$SANDBOX_DIR/ngrok.pid")" 2>/dev/null; then
        echo -e "  Tunnel:      ${GREEN}RUNNING${NC} (ngrok) → $tunnel_url"
    elif [ -n "$tunnel_url" ]; then
        echo -e "  Tunnel:      ${YELLOW}EXTERNAL${NC} → $tunnel_url"
    else
        echo -e "  Tunnel:      ${RED}NOT CONFIGURED${NC}"
    fi

    # Cloud
    local worker_url pages_url
    worker_url=$(read_state "worker_url.txt")
    pages_url=$(read_state "pages_url.txt")
    echo ""
    if [ -n "$worker_url" ]; then
        echo -e "  Worker:      $worker_url"
    fi
    if [ -n "$pages_url" ]; then
        echo -e "  Pages:       $pages_url"
    fi

    echo ""
    echo "  Invite code: $INVITE_CODES"
    echo ""
}

# ──────────────────────────────────────────────
# all: Full deployment
# ──────────────────────────────────────────────

cmd_all() {
    log_step "Running full deployment..."
    cmd_build
    cmd_deploy_cloud
    cmd_start_local
    echo ""
    log_info "Full deployment complete."
    cmd_status
}

# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
    echo "Usage: $0 {setup|build|deploy-cloud|start-local|stop-local|restart-tunnel|seed-kv|status|all}"
    echo ""
    echo "Commands:"
    echo "  setup           One-time Cloudflare setup (KV namespace, Pages project)"
    echo "  build           Build mewsfeed UI with joining service URL"
    echo "  deploy-cloud    Deploy worker + pages to Cloudflare"
    echo "  start-local     Start conductors, linker, tunnel, seed KV"
    echo "  stop-local      Stop all local services"
    echo "  restart-tunnel  Restart tunnel and re-seed KV (keeps conductors/linker)"
    echo "  seed-kv         Seed KV with current linker registration"
    echo "  status          Show status of all components"
    echo "  all             Full deploy: build → deploy-cloud → start-local"
    exit 1
fi

load_config

case "$COMMAND" in
    setup)        cmd_setup ;;
    build)        cmd_build ;;
    deploy-cloud) cmd_deploy_cloud ;;
    start-local)  cmd_start_local ;;
    stop-local)      cmd_stop_local ;;
    restart-tunnel)  cmd_restart_tunnel ;;
    seed-kv)         cmd_seed_kv ;;
    status)          cmd_status ;;
    all)             cmd_all ;;
    *)
        log_error "Unknown command: $COMMAND"
        exit 1
        ;;
esac
