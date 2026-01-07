#!/bin/bash

# =============================================================================
# 🔄 SE2 Application Rollback Script
# =============================================================================
# This script handles safe rollback to previous deployment backup
# Author: Deployment Automation System
# Version: 1.0.0
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# 📝 CONFIGURATION
# =============================================================================

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." &> /dev/null && pwd)"
BACKUPS_DIR="${APP_DIR}/backups"
BUILD_DIR="${APP_DIR}/build"
HEALTH_CHECK_URL="http://localhost:3000/health/status"
DB_HEALTH_CHECK_URL="http://localhost:3000/health/db"
APP_NAME="se2"

# Colors and Emojis
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# =============================================================================
# 🔧 UTILITY FUNCTIONS
# =============================================================================

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

log_step() {
    echo -e "${PURPLE}🔄 STEP:${NC} $1"
}

log_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${WHITE}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if PM2 process is running
is_pm2_running() {
    pm2 describe "$APP_NAME" >/dev/null 2>&1
}

# Function to safely stop PM2 process
safe_pm2_stop() {
    log_step "Safely stopping PM2 process: $APP_NAME"

    if is_pm2_running; then
        # Get process info before stopping
        local pid=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pid" 2>/dev/null || echo "")

        log_info "Stopping PM2 process (PID: ${pid:-unknown})"

        # Graceful stop with timeout
        pm2 stop "$APP_NAME" --wait-ready || {
            log_warning "Graceful stop failed, forcing stop..."
            pm2 kill || true
        }

        # Clean up the process
        pm2 delete "$APP_NAME" 2>/dev/null || true

        log_success "PM2 process stopped and cleaned up"
    else
        log_info "No PM2 process running for $APP_NAME"
    fi
}

# Function to wait for application to be ready
wait_for_app() {
    local max_attempts=30
    local attempt=1

    log_step "Waiting for application to be ready..."

    while [[ $attempt -le $max_attempts ]]; do
        if curl -s --max-time 5 "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
            log_success "Application is ready after ${attempt} attempts"
            return 0
        fi

        echo -ne "${YELLOW}⏳ Attempt $attempt/$max_attempts...${NC}\r"
        sleep 2
        ((attempt++))
    done

    echo # New line after progress indicator
    log_error "Application failed to become ready after $max_attempts attempts"
    return 1
}

# Function to perform health check
health_check() {
    log_step "Performing health check..."

    # Check application status
    local status_code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")

    if [[ "$status_code" != "200" ]]; then
        log_error "Health check failed. Status endpoint returned: $status_code"
        return 1
    fi

    # Check database connectivity
    local db_status_code
    db_status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$DB_HEALTH_CHECK_URL" 2>/dev/null || echo "000")

    if [[ "$db_status_code" != "200" ]]; then
        log_error "Database health check failed. DB endpoint returned: $db_status_code"
        return 1
    fi

    log_success "Health check passed - Application and database are healthy"
    return 0
}

# Function to show current PM2 status
show_pm2_status() {
    log_step "Current PM2 status:"
    if command -v pm2 >/dev/null 2>&1; then
        pm2 list | grep -E "(App name|$APP_NAME)" || log_info "No PM2 processes running"
    else
        log_error "PM2 is not installed"
    fi
}

# Function to show backup information
show_backup_info() {
    local backup_path="$1"

    if [[ -f "$backup_path/.backup_info" ]]; then
        log_info "Backup Information:"
        echo -e "${CYAN}$(cat "$backup_path/.backup_info")${NC}"
    else
        log_warning "No backup information available"
    fi
}

# Function to verify backup integrity
verify_backup() {
    local backup_path="$1"

    log_step "Verifying backup integrity..."

    if [[ ! -d "$backup_path" ]]; then
        log_error "Backup directory not found: $backup_path"
        return 1
    fi

    # Check if essential files exist
    local essential_files=("index.js" "app.js")
    for file in "${essential_files[@]}"; do
        if [[ ! -f "$backup_path/$file" ]]; then
            log_error "Essential file missing in backup: $file"
            return 1
        fi
    done

    log_success "Backup integrity verified"
    return 0
}

# =============================================================================
# 🔄 ROLLBACK FUNCTIONS
# =============================================================================

list_available_backups() {
    log_header "📦 AVAILABLE BACKUPS"

    if [[ ! -d "$BACKUPS_DIR" ]]; then
        log_error "Backups directory not found: $BACKUPS_DIR"
        return 1
    fi

    local backup_count=0

    # Check for current backup
    if [[ -d "${BACKUPS_DIR}/current_backup" ]]; then
        echo -e "${GREEN}📁 current_backup${NC}"
        show_backup_info "${BACKUPS_DIR}/current_backup"
        ((backup_count++))
        echo
    fi

    # Check for previous backup
    if [[ -d "${BACKUPS_DIR}/previous_backup" ]]; then
        echo -e "${YELLOW}📁 previous_backup${NC}"
        show_backup_info "${BACKUPS_DIR}/previous_backup"
        ((backup_count++))
        echo
    fi

    if [[ $backup_count -eq 0 ]]; then
        log_warning "No backups found in $BACKUPS_DIR"
        return 1
    fi

    log_info "Found $backup_count backup(s)"
    return 0
}

rollback_to_previous() {
    log_header "🔄 ROLLING BACK TO PREVIOUS BACKUP"

    local backup_path="${BACKUPS_DIR}/previous_backup"

    # Verify backup exists and is valid
    if ! verify_backup "$backup_path"; then
        log_error "Previous backup verification failed"
        exit 1
    fi

    # Show what we're rolling back to
    log_info "Rolling back to previous backup:"
    show_backup_info "$backup_path"

    # Stop current deployment safely
    safe_pm2_stop

    # Create a backup of current state before rollback
    if [[ -d "$BUILD_DIR" ]]; then
        log_step "Creating emergency backup of current state..."
        local emergency_backup="${BACKUPS_DIR}/emergency_backup_$(date +%Y%m%d_%H%M%S)"
        cp -r "$BUILD_DIR" "$emergency_backup"
        chmod 700 "$emergency_backup"
        log_success "Emergency backup created: $emergency_backup"
    fi

    # Restore previous backup
    log_step "Restoring previous backup..."
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
    fi

    cp -r "$backup_path" "$BUILD_DIR"
    log_success "Previous backup restored to build directory"

    # Start application with restored backup
    log_step "Starting application with restored backup..."
    cd "$APP_DIR"

    # Use PM2 to start the application
    pm2 start ecosystem.config.js --env production
    pm2 save

    log_success "Application started with PM2"

    # Wait and verify rollback
    log_step "Verifying rollback..."
    sleep 5

    if wait_for_app && health_check; then
        log_success "🎉 Rollback completed successfully!"
        show_pm2_status

        # Update backup rotation
        log_step "Updating backup rotation..."
        if [[ -d "${BACKUPS_DIR}/current_backup" ]]; then
            rm -rf "${BACKUPS_DIR}/current_backup"
        fi
        mv "$BUILD_DIR" "${BACKUPS_DIR}/current_backup"
        cp -r "${BACKUPS_DIR}/current_backup" "$BUILD_DIR"

        log_success "Backup rotation updated"
    else
        log_error "❌ Rollback verification failed!"
        log_error "The application may be in an inconsistent state"

        # Show troubleshooting info
        echo -e "${RED}🆘 TROUBLESHOOTING INFORMATION:${NC}"
        echo -e "${YELLOW}1. Check PM2 logs: pm2 logs $APP_NAME${NC}"
        echo -e "${YELLOW}2. Check application logs: tail -f ${APP_DIR}/logs/all.log${NC}"
        echo -e "${YELLOW}3. Manual restart: pm2 restart $APP_NAME${NC}"
        echo -e "${YELLOW}4. Emergency backup available at: ${emergency_backup:-'Not created'}${NC}"

        exit 1
    fi
}

rollback_to_current() {
    log_header "🔄 ROLLING BACK TO CURRENT BACKUP"

    local backup_path="${BACKUPS_DIR}/current_backup"

    # Verify backup exists and is valid
    if ! verify_backup "$backup_path"; then
        log_error "Current backup verification failed"
        exit 1
    fi

    # Show what we're rolling back to
    log_info "Rolling back to current backup:"
    show_backup_info "$backup_path"

    # Stop current deployment safely
    safe_pm2_stop

    # Restore current backup
    log_step "Restoring current backup..."
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
    fi

    cp -r "$backup_path" "$BUILD_DIR"
    log_success "Current backup restored to build directory"

    # Start application with restored backup
    log_step "Starting application with restored backup..."
    cd "$APP_DIR"

    pm2 start ecosystem.config.js --env production
    pm2 save

    log_success "Application started with PM2"

    # Wait and verify rollback
    log_step "Verifying rollback..."
    sleep 5

    if wait_for_app && health_check; then
        log_success "🎉 Rollback to current backup completed successfully!"
        show_pm2_status
    else
        log_error "❌ Rollback verification failed!"
        exit 1
    fi
}

# =============================================================================
# 📋 USAGE AND MAIN EXECUTION
# =============================================================================

show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  previous  - Rollback to previous backup (default)"
    echo "  current   - Rollback to current backup"
    echo "  list      - List available backups"
    echo "  status    - Show current application status"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Rollback to previous backup"
    echo "  $0 previous     # Rollback to previous backup"
    echo "  $0 current      # Rollback to current backup"
    echo "  $0 list         # List available backups"
}

# Main execution
case "${1:-previous}" in
    "previous")
        rollback_to_previous
        ;;
    "current")
        rollback_to_current
        ;;
    "list")
        list_available_backups
        ;;
    "status")
        show_pm2_status
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac
