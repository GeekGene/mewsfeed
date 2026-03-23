#!/usr/bin/env bash
# Local HWC development script
# Usage:
#   ./deploy/local-dev.sh              Start conductor + linker (foreground)
#   ./deploy/local-dev.sh joining      Also start local joining service
#   ./deploy/local-dev.sh stop         Stop all local services
#   ./deploy/local-dev.sh stop-linker  Stop linker only
#   ./deploy/local-dev.sh start-linker Start linker only (rebuild if binary missing)
#   ./deploy/local-dev.sh status       Show component status
#
# Environment variables:
#   AUTH_METHOD        Auth method (default: invite_code). Options: invite_code, email_code, open
#   INVITE_CODES       Comma-separated invite codes (default: test-invite-123)
#   EMAIL_OUTPUT_DIR   Dir for email-to-file dev emails (default: $SANDBOX_DIR/dev-emails)
#   HC_AUTH_URL        hc_auth server URL (optional, enables hc_auth notification)
#   HC_AUTH_TOKEN      hc_auth API bearer token (required if HC_AUTH_URL set)
#   LOCAL_DEV_CONFIG_FILE  Path to a custom joining-service config JSON (skips config generation)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Configurable via environment ---
HAPP_BUNDLE_PATH="${HAPP_BUNDLE_PATH:-$PROJECT_DIR/workdir/mewsfeed.happ}"
H2HC_LINKER_DIR="${H2HC_LINKER_DIR:-$PROJECT_DIR/../h2hc-linker}"
JOINING_SERVICE_DIR="${JOINING_SERVICE_DIR:-$PROJECT_DIR/../joining-service}"
LINKER_PORT="${LINKER_PORT:-8000}"
JOINING_SERVICE_PORT="${JOINING_SERVICE_PORT:-3000}"
SANDBOX_DIR="${SANDBOX_DIR:-/tmp/mewsfeed-local-dev}"
NUM_CONDUCTORS="${NUM_CONDUCTORS:-2}"
LINKER_ADMIN_SECRET="${LINKER_ADMIN_SECRET:-local-dev-secret}"
AUTH_METHOD="${AUTH_METHOD:-invite_code}"
INVITE_CODES="${INVITE_CODES:-test-invite-123}"
EMAIL_OUTPUT_DIR="${EMAIL_OUTPUT_DIR:-$SANDBOX_DIR/dev-emails}"
HC_AUTH_URL="${HC_AUTH_URL:-}"
HC_AUTH_TOKEN="${HC_AUTH_TOKEN:-}"
HC_AUTH_FORWARD_CLAIMS="${HC_AUTH_FORWARD_CLAIMS:-}"
LOCAL_DEV_CONFIG_FILE="${LOCAL_DEV_CONFIG_FILE:-}"

LINKER_BINARY="$H2HC_LINKER_DIR/target/release/h2hc-linker"

# Bootstrap/relay URLs are set after starting local bootstrap server
BOOTSTRAP_URL=""
RELAY_URL=""

# --- Logging ---
log_info()  { echo -e "\033[0;36m[local-dev]\033[0m $*"; }
log_warn()  { echo -e "\033[0;33m[local-dev]\033[0m $*"; }
log_error() { echo -e "\033[0;31m[local-dev]\033[0m $*"; }

# --- State helpers ---
read_state() { cat "$SANDBOX_DIR/$1" 2>/dev/null || echo ""; }

# --- Prerequisite checks ---
check_prereqs() {
    local ok=true

    for cmd in hc holochain curl kitsune2-bootstrap-srv; do
        if ! command -v "$cmd" &>/dev/null; then
            log_error "Missing: $cmd (run 'nix develop')"
            ok=false
        fi
    done

    if [ ! -f "$HAPP_BUNDLE_PATH" ]; then
        log_error "hApp bundle not found at $HAPP_BUNDLE_PATH"
        log_error "Run 'npm run build:happ' first"
        ok=false
    fi

    if [ ! -f "$LINKER_BINARY" ]; then
        log_info "Building h2hc-linker..."
        (cd "$H2HC_LINKER_DIR" && cargo build --release) || { log_error "Failed to build linker"; ok=false; }
    fi

    [ "$ok" = true ] || exit 1

    # Copy happ bundle to ui/public/ so the HWC extension can fetch it
    cp "$HAPP_BUNDLE_PATH" "$PROJECT_DIR/ui/public/mewsfeed.happ"
    log_info "Copied happ bundle to ui/public/mewsfeed.happ"

    log_info "Prerequisites OK"
}

# --- Local Bootstrap Server ---
start_bootstrap() {
    local PID_FILE="$SANDBOX_DIR/bootstrap.pid"

    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warn "Bootstrap server already running (PID $(cat "$PID_FILE"))"
        BOOTSTRAP_URL=$(read_state "bootstrap_url.txt")
        RELAY_URL=$(read_state "relay_url.txt")
        return 0
    fi

    log_info "Starting local bootstrap server..."

    kitsune2-bootstrap-srv --listen 127.0.0.1:0 \
        > "$SANDBOX_DIR/bootstrap.log" 2>&1 &

    local PID=$!
    echo "$PID" > "$PID_FILE"

    # Wait for the server to log its listening address
    # Format: #kitsune2_bootstrap_srv#listening#127.0.0.1:PORT#
    # Relay is on a separate port logged as: relay: serving on 127.0.0.1:PORT
    for _ in $(seq 1 15); do
        if grep -q "#kitsune2_bootstrap_srv#listening#" "$SANDBOX_DIR/bootstrap.log" 2>/dev/null; then
            local BOOTSTRAP_ADDR RELAY_ADDR
            BOOTSTRAP_ADDR=$(grep -oP '#kitsune2_bootstrap_srv#listening#\K[^#]+' "$SANDBOX_DIR/bootstrap.log" | head -1)
            RELAY_ADDR=$(grep -oP 'relay: serving on \K\S+' "$SANDBOX_DIR/bootstrap.log" | head -1)
            BOOTSTRAP_URL="http://$BOOTSTRAP_ADDR"
            RELAY_URL="http://$RELAY_ADDR"
            echo "$BOOTSTRAP_URL" > "$SANDBOX_DIR/bootstrap_url.txt"
            echo "$RELAY_URL" > "$SANDBOX_DIR/relay_url.txt"
            log_info "Bootstrap server ready at $BOOTSTRAP_URL (relay: $RELAY_URL)"
            return 0
        fi
        if ! kill -0 "$PID" 2>/dev/null; then
            log_error "Bootstrap server died. Last 20 lines:"
            tail -20 "$SANDBOX_DIR/bootstrap.log"
            exit 1
        fi
        sleep 1
    done

    log_error "Bootstrap server timed out. Check $SANDBOX_DIR/bootstrap.log"
    exit 1
}

# --- Conductor ---
start_conductor() {
    local INDEX=${1:-1}
    local SUFFIX=""
    [ "$INDEX" -gt 1 ] && SUFFIX="_$INDEX"

    local DATA_DIR="$SANDBOX_DIR/data$SUFFIX"
    local PID_FILE="$SANDBOX_DIR/conductor$SUFFIX.pid"
    local LOG_FILE="$SANDBOX_DIR/conductor$SUFFIX.log"
    local ADMIN_FILE="$SANDBOX_DIR/admin_port$SUFFIX.txt"

    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warn "Conductor $INDEX already running (PID $(cat "$PID_FILE"))"
        return 0
    fi

    log_info "Starting conductor $INDEX..."
    rm -rf "$DATA_DIR" "$LOG_FILE" 2>/dev/null || true
    mkdir -p "$DATA_DIR"

    local APP_ID="mewsfeed"
    [ "$INDEX" -gt 1 ] && APP_ID="mewsfeed_${INDEX}"

    (echo "test-passphrase" | \
        RUST_LOG="info,holochain=debug,kitsune2=debug" \
        hc sandbox --piped generate \
            --in-process-lair \
            --run 0 \
            --app-id "$APP_ID" \
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
            log_error "Conductor $INDEX died. Last 20 lines:"
            tail -20 "$LOG_FILE"
            exit 1
        fi
        sleep 1
    done

    log_error "Conductor $INDEX timed out (60s). Check $LOG_FILE"
    exit 1
}

start_conductors() {
    for i in $(seq 1 "$NUM_CONDUCTORS"); do
        start_conductor "$i"
        [ "$i" -lt "$NUM_CONDUCTORS" ] && sleep 1
    done

    if [ "$NUM_CONDUCTORS" -ge 2 ]; then
        log_info "Waiting 30s for DHT arc establishment..."
        sleep 30
        log_info "Arc establishment assumed complete"
    fi
}

# --- Linker ---
start_linker() {
    local MODE="${1:-basic}"
    local PID_FILE="$SANDBOX_DIR/linker.pid"

    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warn "Linker already running (PID $(cat "$PID_FILE"))"
        return 0
    fi

    local ADMIN_PORT
    ADMIN_PORT=$(read_state "admin_port.txt")
    if [ -z "$ADMIN_PORT" ]; then
        log_error "No admin port found. Start conductors first."
        exit 1
    fi

    # Only set admin secret in joining mode (so joining service can authorize agents).
    # In basic mode, run without auth so the extension can connect directly.
    # The linker treats any set value (even empty) as "auth enabled", so we must unset it.
    local -a LINKER_ENV=(
        "H2HC_LINKER_CONDUCTOR_URL=127.0.0.1:$ADMIN_PORT"
        "H2HC_LINKER_BOOTSTRAP_URL=$BOOTSTRAP_URL"
        "H2HC_LINKER_RELAY_URL=$RELAY_URL"
        "RUST_LOG=info,h2hc_linker=debug"
    )
    if [ "$MODE" = "joining" ]; then
        LINKER_ENV+=("H2HC_LINKER_ADMIN_SECRET=$LINKER_ADMIN_SECRET")
        log_info "Starting linker on port $LINKER_PORT (admin port $ADMIN_PORT, auth enabled)..."
    else
        log_info "Starting linker on port $LINKER_PORT (admin port $ADMIN_PORT, no auth)..."
    fi

    env -u H2HC_LINKER_ADMIN_SECRET "${LINKER_ENV[@]}" \
    "$LINKER_BINARY" --port "$LINKER_PORT" > "$SANDBOX_DIR/linker.log" 2>&1 &

    local PID=$!
    echo "$PID" > "$PID_FILE"

    for _ in $(seq 1 15); do
        if curl -s "http://localhost:$LINKER_PORT/health" > /dev/null 2>&1; then
            log_info "Linker ready on port $LINKER_PORT"
            return 0
        fi
        if ! kill -0 "$PID" 2>/dev/null; then
            log_error "Linker died. Last 20 lines:"
            tail -20 "$SANDBOX_DIR/linker.log"
            exit 1
        fi
        sleep 1
    done

    if kill -0 "$PID" 2>/dev/null; then
        log_info "Linker started (health endpoint not yet responding, but process running)"
    else
        log_error "Linker failed to start. Check $SANDBOX_DIR/linker.log"
        exit 1
    fi
}

# --- Joining Service ---
start_joining_service() {
    local PID_FILE="$SANDBOX_DIR/joining.pid"

    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warn "Joining service already running (PID $(cat "$PID_FILE"))"
        return 0
    fi

    if [ ! -d "$JOINING_SERVICE_DIR" ]; then
        log_error "Joining service not found at $JOINING_SERVICE_DIR"
        log_error "Set JOINING_SERVICE_DIR to the correct path"
        exit 1
    fi

    local CONFIG_FILE

    if [ -n "$LOCAL_DEV_CONFIG_FILE" ]; then
        # Use the user-provided config file directly
        if [ ! -f "$LOCAL_DEV_CONFIG_FILE" ]; then
            log_error "Config file not found: $LOCAL_DEV_CONFIG_FILE"
            exit 1
        fi
        CONFIG_FILE="$(cd "$PROJECT_DIR" && realpath "$LOCAL_DEV_CONFIG_FILE")"
        log_info "Using custom config: $CONFIG_FILE"
    else
        # Build config JSON from env vars
        CONFIG_FILE="$SANDBOX_DIR/joining-config.json"

        # Parse invite codes into JSON array
        local CODES_JSON="[]"
        if [ -n "$INVITE_CODES" ]; then
            CODES_JSON=$(echo "$INVITE_CODES" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | paste -sd',' | sed 's/^/[/;s/$/]/')
        fi

        # Build optional config sections
        local EMAIL_JSON=""
        if [ "$AUTH_METHOD" = "email_code" ]; then
            mkdir -p "$EMAIL_OUTPUT_DIR"
            EMAIL_JSON=$(cat <<EJSON
  "email": {
    "provider": "file",
    "output_dir": "$EMAIL_OUTPUT_DIR"
  },
EJSON
)
            log_info "Email codes will be written to: $EMAIL_OUTPUT_DIR"
        fi

        local HC_AUTH_JSON=""
        if [ -n "$HC_AUTH_URL" ] && [ -n "$HC_AUTH_TOKEN" ]; then
            local FORWARD_CLAIMS_JSON=""
            if [ -n "$HC_AUTH_FORWARD_CLAIMS" ]; then
                FORWARD_CLAIMS_JSON=$(echo "$HC_AUTH_FORWARD_CLAIMS" | tr ',' '\n' | sed 's/^/"/;s/$/"/' | paste -sd',' | sed 's/^/,\n    "forward_claims": [/;s/$/]/')
            fi
            HC_AUTH_JSON=$(cat <<HJSON
  "hc_auth": {
    "url": "$HC_AUTH_URL",
    "api_token": "$HC_AUTH_TOKEN"$FORWARD_CLAIMS_JSON
  },
HJSON
)
            log_info "hc_auth integration: $HC_AUTH_URL"
            if [ -n "$HC_AUTH_FORWARD_CLAIMS" ]; then
                log_info "hc_auth forward_claims: $HC_AUTH_FORWARD_CLAIMS"
            fi
        fi

        cat > "$CONFIG_FILE" <<JSONEOF
{
  "happ": {
    "id": "mewsfeed",
    "name": "MewsFeed"
  },
  "auth_methods": ["$AUTH_METHOD"],
  "invite_codes": $CODES_JSON,
$EMAIL_JSON
$HC_AUTH_JSON
  "session": {
    "store": "memory"
  },
  "network": {
    "bootstrap_url": "$BOOTSTRAP_URL",
    "relay_url": "$RELAY_URL"
  },
  "linker_auth": {
    "capabilities": ["dht_read", "dht_write", "k2"]
  },
  "port": $JOINING_SERVICE_PORT,
  "linker_registrations": [
    {
      "linker_url": { "url": "http://localhost:$LINKER_PORT" },
      "admin": { "url": "http://localhost:$LINKER_PORT", "secret": "$LINKER_ADMIN_SECRET" }
    }
  ]
}
JSONEOF
    fi

    log_info "Starting joining service (config: $CONFIG_FILE)..."

    (cd "$JOINING_SERVICE_DIR" && npx tsx src/server.ts "$CONFIG_FILE") \
        > "$SANDBOX_DIR/joining.log" 2>&1 &

    local PID=$!
    echo "$PID" > "$PID_FILE"

    for _ in $(seq 1 15); do
        if curl -s "http://localhost:$JOINING_SERVICE_PORT/v1/info" > /dev/null 2>&1; then
            log_info "Joining service ready on port $JOINING_SERVICE_PORT"
            return 0
        fi
        if ! kill -0 "$PID" 2>/dev/null; then
            log_error "Joining service died. Last 20 lines:"
            tail -20 "$SANDBOX_DIR/joining.log"
            exit 1
        fi
        sleep 1
    done

    if kill -0 "$PID" 2>/dev/null; then
        log_info "Joining service started (health not yet responding, but process running)"
    else
        log_error "Joining service failed. Check $SANDBOX_DIR/joining.log"
        exit 1
    fi
}

# --- Stop/Start Linker ---
stop_linker() {
    local PID_FILE="$SANDBOX_DIR/linker.pid"
    if [ -f "$PID_FILE" ]; then
        local PID
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            kill "$PID" 2>/dev/null || true
            log_info "Stopped linker (PID $PID)"
        fi
        rm -f "$PID_FILE"
    fi
    pkill -f "h2hc-linker" 2>/dev/null || true
}

cmd_stop_linker() {
    log_info "Stopping linker..."
    stop_linker
}

cmd_start_linker() {
    if [ ! -f "$LINKER_BINARY" ]; then
        log_info "Building h2hc-linker..."
        (cd "$H2HC_LINKER_DIR" && cargo build --release)
    fi

    # Need bootstrap/relay URLs from running bootstrap server
    BOOTSTRAP_URL=$(read_state "bootstrap_url.txt")
    RELAY_URL=$(read_state "relay_url.txt")
    if [ -z "$BOOTSTRAP_URL" ] || [ -z "$RELAY_URL" ]; then
        log_error "No bootstrap/relay URLs found. Is the bootstrap server running?"
        exit 1
    fi

    start_linker
}

# --- Stop ---
cmd_stop() {
    log_info "Stopping local dev services..."
    local found=false

    for name in joining linker bootstrap; do
        local PID_FILE="$SANDBOX_DIR/${name}.pid"
        if [ -f "$PID_FILE" ]; then
            local PID
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID" 2>/dev/null || true
                log_info "Stopped $name (PID $PID)"
            fi
            rm -f "$PID_FILE"
            found=true
        fi
    done

    for i in $(seq 1 10); do
        local SUFFIX=""
        [ "$i" -gt 1 ] && SUFFIX="_$i"
        local PID_FILE="$SANDBOX_DIR/conductor$SUFFIX.pid"
        if [ -f "$PID_FILE" ]; then
            local PID
            PID=$(cat "$PID_FILE")
            if kill -0 "$PID" 2>/dev/null; then
                kill "$PID" 2>/dev/null || true
                log_info "Stopped conductor $i (PID $PID)"
            fi
            rm -f "$PID_FILE"
            found=true
        fi
    done

    if [ "$found" = false ]; then
        log_info "No services running"
    else
        log_info "All services stopped"
    fi
}

# --- Status ---
cmd_status() {
    echo ""
    log_info "=== Local HWC Dev Status ==="

    local BOOTSTRAP_PID_FILE="$SANDBOX_DIR/bootstrap.pid"
    if [ -f "$BOOTSTRAP_PID_FILE" ] && kill -0 "$(cat "$BOOTSTRAP_PID_FILE")" 2>/dev/null; then
        echo "  Bootstrap:          running (PID $(cat "$BOOTSTRAP_PID_FILE"), $(read_state "bootstrap_url.txt"))"
    else
        echo "  Bootstrap:          stopped"
    fi

    for i in $(seq 1 "$NUM_CONDUCTORS"); do
        local SUFFIX=""
        [ "$i" -gt 1 ] && SUFFIX="_$i"
        local PID_FILE="$SANDBOX_DIR/conductor$SUFFIX.pid"
        local ADMIN_FILE="$SANDBOX_DIR/admin_port$SUFFIX.txt"
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            local port
            port=$(read_state "admin_port$SUFFIX.txt")
            echo "  Conductor $i:       running (PID $(cat "$PID_FILE"), admin port $port)"
        else
            echo "  Conductor $i:       stopped"
        fi
    done

    local LINKER_PID_FILE="$SANDBOX_DIR/linker.pid"
    if [ -f "$LINKER_PID_FILE" ] && kill -0 "$(cat "$LINKER_PID_FILE")" 2>/dev/null; then
        echo "  Linker:             running (PID $(cat "$LINKER_PID_FILE"), port $LINKER_PORT)"
    else
        echo "  Linker:             stopped"
    fi

    local JOINING_PID_FILE="$SANDBOX_DIR/joining.pid"
    if [ -f "$JOINING_PID_FILE" ] && kill -0 "$(cat "$JOINING_PID_FILE")" 2>/dev/null; then
        echo "  Joining service:    running (PID $(cat "$JOINING_PID_FILE"), port $JOINING_SERVICE_PORT)"
    else
        echo "  Joining service:    not started"
    fi

    echo "  Sandbox dir:        $SANDBOX_DIR"
    echo ""
    echo "  Open in browser:    http://localhost:1420/?linkerUrl=http://localhost:$LINKER_PORT&runtime=hwc"
    echo ""
}

# --- Main ---
TAIL_PID=""
cleanup() {
    log_info "Shutting down..."
    [ -n "$TAIL_PID" ] && kill "$TAIL_PID" 2>/dev/null || true
    cmd_stop
    exit 0
}

cmd_start() {
    local MODE="${1:-basic}"

    mkdir -p "$SANDBOX_DIR"
    check_prereqs
    start_bootstrap
    start_conductors
    start_linker "$MODE"

    if [ "$MODE" = "joining" ]; then
        start_joining_service
    fi

    cmd_status

    log_info "Local HWC infrastructure ready. Press Ctrl-C to stop."
    trap cleanup INT TERM
    # Keep script alive — backgrounded processes may have daemonized,
    # leaving no children for `wait`. Use tail so concurrently sees us as running.
    tail -f /dev/null &
    TAIL_PID=$!
    wait
}

case "${1:-start}" in
    start|"")    cmd_start ;;
    joining)     cmd_start joining ;;
    stop)        cmd_stop ;;
    stop-linker) cmd_stop_linker ;;
    start-linker) cmd_start_linker ;;
    status)      cmd_status ;;
    *)           echo "Usage: $0 [start|joining|stop|stop-linker|start-linker|status]"; exit 1 ;;
esac
