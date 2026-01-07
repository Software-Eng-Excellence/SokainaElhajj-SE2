#!/bin/bash

# =============================================================================
# 🎯 SE2 Deployment Orchestrator
# =============================================================================
# Master script that orchestrates the entire deployment pipeline
# Author: Deployment Automation System
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." &> /dev/null && pwd)"

# Colors and Emojis
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
DEPLOYMENT_ID="deploy_$(date +%Y%m%d_%H%M%S)"
LOG_FILE="${APP_DIR}/logs/deployment_${DEPLOYMENT_ID}.log"
LOCK_FILE="/tmp/se2_deployment.lock"
MAX_DEPLOYMENT_TIME=600  # 10 minutes

# Logging functions
log_info() {
    local msg="$1"
    echo -e "${BLUE}ℹ️  INFO:${NC} $msg" | tee -a "$LOG_FILE"
}

log_success() {
    local msg="$1"
    echo -e "${GREEN}✅ SUCCESS:${NC} $msg" | tee -a "$LOG_FILE"
}

log_warning() {
    local msg="$1"
    echo -e "${YELLOW}⚠️  WARNING:${NC} $msg" | tee -a "$LOG_FILE"
}

log_error() {
    local msg="$1"
    echo -e "${RED}❌ ERROR:${NC} $msg" | tee -a "$LOG_FILE"
}

log_step() {
    local msg="$1"
    echo -e "${PURPLE}🔄 STEP:${NC} $msg" | tee -a "$LOG_FILE"
}

log_header() {
    local msg="$1"
    echo -e "${CYAN}================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${WHITE}$msg${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}================================${NC}" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    local exit_code=$?

    log_info "Cleaning up deployment process..."

    # Remove lock file
    if [[ -f "$LOCK_FILE" ]]; then
        rm -f "$LOCK_FILE"
        log_info "Removed deployment lock"
    fi

    # Kill any background processes
    if [[ -n "${TIMEOUT_PID:-}" ]]; then
        kill "$TIMEOUT_PID" 2>/dev/null || true
    fi

    if [[ $exit_code -ne 0 ]]; then
        log_error "Deployment failed with exit code $exit_code"
        log_info "Check the log file: $LOG_FILE"

        # Send failure notification
        if command -v wall >/dev/null 2>&1; then
            echo "🚨 SE2 deployment failed! Check $LOG_FILE for details." | wall 2>/dev/null || true
        fi
    fi

    exit $exit_code
}

# Set up signal handlers
trap cleanup EXIT
trap 'log_error "Deployment interrupted by user"; exit 130' INT TERM

# Function to check for deployment lock
check_lock() {
    if [[ -f "$LOCK_FILE" ]]; then
        local lock_pid
        lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")

        if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
            log_error "Another deployment is already running (PID: $lock_pid)"
            log_info "If you're sure no deployment is running, remove: $LOCK_FILE"
            exit 1
        else
            log_warning "Stale lock file found, removing..."
            rm -f "$LOCK_FILE"
        fi
    fi
}

# Function to create deployment lock
create_lock() {
    echo $$ > "$LOCK_FILE"
    log_info "Created deployment lock (PID: $$)"
}

# Function to setup deployment timeout
setup_timeout() {
    (
        sleep $MAX_DEPLOYMENT_TIME
        log_error "Deployment timeout reached (${MAX_DEPLOYMENT_TIME}s)"
        kill -TERM $$ 2>/dev/null || true
    ) &
    TIMEOUT_PID=$!
}

# Function to validate environment
validate_environment() {
    log_header "🔍 ENVIRONMENT VALIDATION"

    # Check if we're in the right directory
    if [[ ! -f "$APP_DIR/package.json" ]]; then
        log_error "package.json not found. Are you in the right directory?"
        exit 1
    fi

    # Check required commands
    local required_commands=("git" "npm" "pm2" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "Required command not found: $cmd"
            exit 1
        fi
    done

    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    local required_node="16.0.0"

    if ! printf '%s\n%s\n' "$required_node" "$node_version" | sort -V -C; then
        log_warning "Node.js version $node_version might be too old (recommended: >= $required_node)"
    fi

    log_success "Environment validation completed"
}

# Function to run deployment step with error handling
run_step() {
    local step_name="$1"
    local step_command="$2"
    local is_critical="${3:-true}"

    log_step "Starting: $step_name"
    local start_time
    start_time=$(date +%s)

    if eval "$step_command"; then
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "Completed: $step_name (${duration}s)"
        return 0
    else
        local exit_code=$?
        log_error "Failed: $step_name (exit code: $exit_code)"

        if [[ "$is_critical" == "true" ]]; then
            log_error "Critical step failed, aborting deployment"
            return $exit_code
        else
            log_warning "Non-critical step failed, continuing deployment"
            return 0
        fi
    fi
}

# Main deployment function
main_deployment() {
    log_header "🚀 SE2 DEPLOYMENT ORCHESTRATOR"
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Log file: $LOG_FILE"
    log_info "Started at: $(date)"

    # Create logs directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"

    # Check for existing deployment
    check_lock
    create_lock
    setup_timeout

    # Validate environment
    validate_environment

    # Run deployment steps
    run_step "Pre-deployment hooks" "${SCRIPT_DIR}/pre-deploy-hook.sh" true

    run_step "Main deployment" "${SCRIPT_DIR}/deploy.sh deploy" true

    run_step "Post-deployment hooks" "${SCRIPT_DIR}/post-deploy-hook.sh" false

    # Final success message
    log_header "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY"
    log_success "Deployment ID: $DEPLOYMENT_ID"
    log_success "Completed at: $(date)"

    # Show quick status
    if command -v pm2 >/dev/null 2>&1; then
        echo -e "\n${CYAN}📊 Current Application Status:${NC}"
        pm2 describe se2 2>/dev/null | grep -E "(status|uptime|memory)" || log_info "PM2 status not available"
    fi

    # Show access URLs
    echo -e "\n${GREEN}🔗 Application Access URLs:${NC}"
    echo -e "${BLUE}Health Check:${NC} http://localhost:3000/health/status"
    echo -e "${BLUE}Database Check:${NC} http://localhost:3000/health/db"
    echo -e "${BLUE}API Endpoint:${NC} http://localhost:3000/api"
}

# Quick deployment function (no hooks)
quick_deployment() {
    log_header "⚡ QUICK DEPLOYMENT"
    log_info "Running quick deployment without hooks"

    check_lock
    create_lock
    setup_timeout

    run_step "Quick deployment" "${SCRIPT_DIR}/deploy.sh deploy" true

    log_success "Quick deployment completed"
}

# Status check function
check_status() {
    log_header "📊 DEPLOYMENT STATUS CHECK"

    # Check if deployment is running
    if [[ -f "$LOCK_FILE" ]]; then
        local lock_pid
        lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")

        if [[ -n "$lock_pid" ]] && kill -0 "$lock_pid" 2>/dev/null; then
            log_info "Deployment is currently running (PID: $lock_pid)"
            return 1
        else
            log_info "No active deployment found"
        fi
    else
        log_info "No deployment lock file found"
    fi

    # Run health check
    "${SCRIPT_DIR}/health-check.sh" --quick

    # Show recent deployments
    log_info "Recent deployments:"
    find "${APP_DIR}/logs" -name "deployment_*.log" -mtime -7 2>/dev/null | \
        sort -r | head -5 | while read -r logfile; do
        local deploy_date
        deploy_date=$(stat -c %y "$logfile" 2>/dev/null || stat -f "%Sm" "$logfile" 2>/dev/null || echo "unknown")
        echo "  - $(basename "$logfile") ($deploy_date)"
    done || log_info "No recent deployment logs found"
}

# Usage function
show_usage() {
    cat << EOF
🚀 SE2 Deployment Orchestrator

Usage: $0 [COMMAND] [OPTIONS]

Commands:
  deploy       - Run full deployment with hooks (default)
  quick        - Run quick deployment without hooks
  rollback     - Rollback to previous version
  status       - Check deployment and application status
  health       - Run health check
  logs         - Show recent deployment logs
  help         - Show this help message

Options:
  --force      - Force deployment even if checks fail
  --dry-run    - Simulate deployment without making changes
  --verbose    - Enable verbose logging

Examples:
  $0                    # Run full deployment
  $0 deploy             # Run full deployment
  $0 quick              # Quick deployment
  $0 rollback           # Rollback to previous version
  $0 status             # Check current status
  $0 logs --tail        # Show recent logs

Environment Variables:
  DEPLOYMENT_ENV       - Override environment (production, staging, development)
  SKIP_HEALTH_CHECK    - Skip health checks (not recommended)
  MAX_DEPLOYMENT_TIME  - Override deployment timeout (default: 600s)

EOF
}

# Show recent deployment logs
show_logs() {
    local tail_mode="${1:-false}"

    log_header "📋 DEPLOYMENT LOGS"

    if [[ "$tail_mode" == "--tail" ]]; then
        local latest_log
        latest_log=$(find "${APP_DIR}/logs" -name "deployment_*.log" -type f | sort -r | head -1)

        if [[ -n "$latest_log" ]]; then
            log_info "Tailing latest deployment log: $(basename "$latest_log")"
            tail -f "$latest_log"
        else
            log_error "No deployment logs found"
            exit 1
        fi
    else
        find "${APP_DIR}/logs" -name "deployment_*.log" -mtime -7 2>/dev/null | \
            sort -r | head -10 | while read -r logfile; do
            echo -e "${BLUE}📄 $(basename "$logfile")${NC}"
            echo "   Last modified: $(stat -c %y "$logfile" 2>/dev/null || stat -f "%Sm" "$logfile" 2>/dev/null)"
            echo "   Size: $(ls -lh "$logfile" | awk '{print $5}')"
            echo
        done || log_info "No recent deployment logs found"
    fi
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main_deployment
        ;;
    "quick")
        quick_deployment
        ;;
    "rollback")
        "${SCRIPT_DIR}/rollback.sh" "${2:-previous}"
        ;;
    "status")
        check_status
        ;;
    "health")
        "${SCRIPT_DIR}/health-check.sh" "${2:---full}"
        ;;
    "logs")
        show_logs "${2:-}"
        ;;
    "help"|"-h"|"--help")
        show_usage
        exit 0
        ;;
    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
