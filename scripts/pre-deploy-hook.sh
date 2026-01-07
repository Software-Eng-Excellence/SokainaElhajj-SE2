#!/bin/bash

# =============================================================================
# 🔄 SE2 Pre-Deployment Hook
# =============================================================================
# This script runs before deployment to ensure the system is ready
# Author: Deployment Automation System
# Version: 1.0.0
# =============================================================================

set -euo pipefail

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." &> /dev/null && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  INFO:${NC} $1"; }
log_success() { echo -e "${GREEN}✅ SUCCESS:${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️  WARNING:${NC} $1"; }
log_error() { echo -e "${RED}❌ ERROR:${NC} $1"; }

echo -e "${BLUE}🚀 Pre-Deployment Hook Starting...${NC}"

# 1. Verify Git repository state
cd "$APP_DIR"
if [[ -n "$(git status --porcelain)" ]]; then
    log_warning "Working directory has uncommitted changes"
    git status --short
fi

# 2. Check for package.json changes requiring npm install
if git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -q "package.json"; then
    log_info "package.json has changed, will run npm install"
    export FORCE_NPM_INSTALL=true
fi

# 3. Run quick health check on current deployment
if "${SCRIPT_DIR}/health-check.sh" --quick >/dev/null 2>&1; then
    log_success "Current deployment is healthy"
else
    log_warning "Current deployment has health issues"
fi

# 4. Verify required environment variables
required_vars=("NODE_ENV")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        log_warning "Environment variable $var is not set"
    fi
done

# 5. Check disk space
available_space=$(df -h "$APP_DIR" | awk 'NR==2 {print $4}')
log_info "Available disk space: $available_space"

log_success "Pre-deployment checks completed"
