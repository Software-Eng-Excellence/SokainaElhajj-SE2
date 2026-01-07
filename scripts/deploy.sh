#!/bin/bash

# =============================================================================
# 🚀 SE2 Application Deployment Script
# =============================================================================
# This script provides automated deployment with backup, rollback capabilities
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
GIT_BRANCH="master"
MIN_FREE_SPACE_GB=2

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check disk space
check_disk_space() {
    log_step "Checking available disk space..."

    available_space=$(df -BG "${APP_DIR}" | awk 'NR==2 {gsub(/G/, "", $4); print $4}')

    if [[ $available_space -lt $MIN_FREE_SPACE_GB ]]; then
        log_error "Insufficient disk space. Available: ${available_space}GB, Required: ${MIN_FREE_SPACE_GB}GB"
        return 1
    fi

    log_success "Disk space check passed. Available: ${available_space}GB"
    return 0
}

# Function to check if PM2 process is running
is_pm2_running() {
    pm2 describe "$APP_NAME" >/dev/null 2>&1
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
    if command_exists pm2; then
        pm2 describe "$APP_NAME" 2>/dev/null || log_warning "No PM2 process found for $APP_NAME"
    else
        log_error "PM2 is not installed"
    fi
}

# =============================================================================
# 🔄 BACKUP FUNCTIONS
# =============================================================================

create_backup() {
    log_header "📦 CREATING BACKUP"

    # Create backups directory if it doesn't exist
    mkdir -p "$BACKUPS_DIR"

    # Set restrictive permissions on backup directory
    chmod 700 "$BACKUPS_DIR"

    if [[ ! -d "$BUILD_DIR" ]]; then
        log_warning "No build directory found. Skipping backup."
        return 0
    fi

    local timestamp=$(date +"%Y%m%d_%H%M%S")

    # Handle backup rotation
    if [[ -d "${BACKUPS_DIR}/current_backup" ]]; then
        log_step "Moving current backup to previous backup..."

        # Remove old previous backup if it exists
        if [[ -d "${BACKUPS_DIR}/previous_backup" ]]; then
            rm -rf "${BACKUPS_DIR}/previous_backup"
        fi

        # Move current to previous
        mv "${BACKUPS_DIR}/current_backup" "${BACKUPS_DIR}/previous_backup"
        log_success "Previous backup archived"
    fi

    # Create new current backup
    log_step "Creating new backup of current build..."
    cp -r "$BUILD_DIR" "${BACKUPS_DIR}/current_backup"

    # Create a metadata file
    cat > "${BACKUPS_DIR}/current_backup/.backup_info" << EOF
BACKUP_TIMESTAMP=$timestamp
BACKUP_DATE=$(date)
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
NODE_ENV=${NODE_ENV:-unknown}
EOF

    log_success "Backup created successfully at ${BACKUPS_DIR}/current_backup"
}

# =============================================================================
# 🚀 DEPLOYMENT FUNCTIONS
# =============================================================================

pre_deployment_checks() {
    log_header "🔍 PRE-DEPLOYMENT CHECKS"

    # Change to app directory
    cd "$APP_DIR"

    # Check required commands
    log_step "Checking required dependencies..."
    if ! command_exists git; then
        log_error "Git is not installed"
        exit 1
    fi

    if ! command_exists npm; then
        log_error "npm is not installed"
        exit 1
    fi

    if ! command_exists pm2; then
        log_error "PM2 is not installed"
        exit 1
    fi

    log_success "All required dependencies are available"

    # Check disk space
    check_disk_space

    # Create backup
    create_backup

    # Show current deployment health
    log_step "Checking current deployment health..."
    if is_pm2_running; then
        show_pm2_status
        if health_check; then
            log_success "Current deployment is healthy"
        else
            log_warning "Current deployment has health issues"
        fi
    else
        log_info "No current deployment running"
    fi
}

pull_updates() {
    log_header "⬇️  PULLING UPDATES"

    cd "$APP_DIR"

    log_step "Fetching latest changes from origin..."
    git fetch origin

    log_step "Checking out $GIT_BRANCH branch..."
    git checkout "$GIT_BRANCH"

    log_step "Pulling latest changes..."
    local before_commit=$(git rev-parse HEAD)
    git pull origin "$GIT_BRANCH"
    local after_commit=$(git rev-parse HEAD)

    if [[ "$before_commit" == "$after_commit" ]]; then
        log_info "No new changes to deploy"
    else
        log_success " Successfullypulled changes from $before_commit to $after_commit"
    fi

    log_success "Code updated successfully"
}

build_application() {
    log_header "🔨 BUILDING APPLICATION"

    cd "$APP_DIR"

    log_step "Installing/updating dependencies..."
    npm ci

    log_step "Running build process..."
    npm run build

    if [[ ! -d "$BUILD_DIR" ]]; then
        log_error "Build directory not found after build process"
        exit 1
    fi

    local build_size=$(du -sh "$BUILD_DIR" | cut -f1)
    log_success "Build completed successfully. Size: $build_size"
}

deploy_application() {
    log_header "🚀 DEPLOYING APPLICATION"

    cd "$APP_DIR"

    if is_pm2_running; then
        log_step "Reloading existing PM2 process..."
        pm2 reload ecosystem.config.js --env production
    else
        log_step "Starting new PM2 process..."
        pm2 start ecosystem.config.js --env production
    fi

    # Save PM2 process list
    pm2 save

    log_success "Application deployed with PM2"
}

post_deployment_checks() {
    log_header "✅ POST-DEPLOYMENT CHECKS"

    log_step "Waiting 10 seconds for application to stabilize..."
    sleep 10

    # Wait for app to be ready
    if ! wait_for_app; then
        log_error "Application failed to start properly"
        return 1
    fi

    # Perform health check
    if ! health_check; then
        log_error "Post-deployment health check failed"
        return 1
    fi

    # Show final status
    show_pm2_status

    log_success "🎉 Deployment completed successfully!"
    return 0
}

# =============================================================================
# 🔄 ROLLBACK FUNCTION
# =============================================================================

rollback_deployment() {
    log_header "🔄 ROLLING BACK DEPLOYMENT"

    if [[ ! -d "${BACKUPS_DIR}/previous_backup" ]]; then
        log_error "No previous backup found for rollback"
        exit 1
    fi

    log_step "Stopping current PM2 process..."
    if is_pm2_running; then
        pm2 stop "$APP_NAME" || true
        pm2 delete "$APP_NAME" || true
    fi

    log_step "Restoring previous backup..."
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
    fi

    cp -r "${BACKUPS_DIR}/previous_backup" "$BUILD_DIR"

    log_step "Starting application with previous backup..."
    cd "$APP_DIR"
    pm2 start ecosystem.config.js --env production
    pm2 save

    log_step "Waiting for rollback to stabilize..."
    sleep 10

    if wait_for_app && health_check; then
        log_success "🎉 Rollback completed successfully!"
        show_pm2_status

        # Show rollback info
        if [[ -f "${BUILD_DIR}/.backup_info" ]]; then
            log_info "Rolled back to:"
            cat "${BUILD_DIR}/.backup_info"
        fi
    else
        log_error "Rollback verification failed"
        exit 1
    fi
}

# =============================================================================
# 🎯 MAIN DEPLOYMENT FUNCTION
# =============================================================================

main_deploy() {
    log_header "🚀 STARTING SE2 APPLICATION DEPLOYMENT"

    # Pre-deployment
    pre_deployment_checks

    # Deployment
    pull_updates
    build_application
    deploy_application

    # Post-deployment
    if post_deployment_checks; then
        log_success "🎉 Deployment pipeline completed successfully!"
        exit 0
    else
        log_error "Post-deployment checks failed. Initiating rollback..."
        rollback_deployment
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
    echo "  deploy    - Run full deployment pipeline (default)"
    echo "  rollback  - Rollback to previous backup"
    echo "  status    - Show current application status"
    echo "  health    - Run health check on current deployment"
    echo "  backup    - Create backup of current build"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Run full deployment"
    echo "  $0 deploy       # Run full deployment"
    echo "  $0 rollback     # Rollback to previous version"
    echo "  $0 status       # Check application status"
}

# Main execution
case "${1:-deploy}" in
    "deploy")
        main_deploy
        ;;
    "rollback")
        rollback_deployment
        ;;
    "status")
        show_pm2_status
        ;;
    "health")
        health_check
        ;;
    "backup")
        create_backup
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
