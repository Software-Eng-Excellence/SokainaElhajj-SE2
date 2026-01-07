#!/bin/bash

# =============================================================================
# ✅ SE2 Post-Deployment Hook
# =============================================================================
# This script runs after deployment to verify success and send notifications
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
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  INFO:${NC} $1"; }
log_success() { echo -e "${GREEN}✅ SUCCESS:${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️  WARNING:${NC} $1"; }
log_error() { echo -e "${RED}❌ ERROR:${NC} $1"; }

echo -e "${GREEN}🎉 Post-Deployment Hook Starting...${NC}"

# 1. Get deployment information
cd "$APP_DIR"
DEPLOY_TIMESTAMP=$(date)
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")

# 2. Run comprehensive health check
log_info "Running post-deployment health check..."
if "${SCRIPT_DIR}/health-check.sh" --quick; then
    HEALTH_STATUS="✅ HEALTHY"
    HEALTH_EXIT_CODE=0
else
    HEALTH_STATUS="⚠️ ISSUES DETECTED"
    HEALTH_EXIT_CODE=1
fi

# 3. Create deployment report
DEPLOYMENT_REPORT=$(cat << EOF
🚀 SE2 Deployment Report
========================
Timestamp: $DEPLOY_TIMESTAMP
Git Commit: $GIT_COMMIT
Git Branch: $GIT_BRANCH
Build Size: $BUILD_SIZE
Health Status: $HEALTH_STATUS

🔗 Application URLs:
- Health Check: http://localhost:3000/health/status
- Database Check: http://localhost:3000/health/db
- API Base: http://localhost:3000/api

📊 PM2 Status:
$(pm2 describe se2 2>/dev/null | grep -E "(status|uptime|memory|cpu)" || echo "PM2 info not available")
EOF
)

# 4. Display deployment report
echo -e "${CYAN}$DEPLOYMENT_REPORT${NC}"

# 5. Save deployment log
echo "$DEPLOYMENT_REPORT" > "${APP_DIR}/logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# 6. Optional: Send notification (uncomment and configure as needed)
# if command -v mail >/dev/null 2>&1; then
#     echo "$DEPLOYMENT_REPORT" | mail -s "SE2 Deployment Complete" admin@example.com
# fi

# 7. Optional: Update monitoring systems
# curl -X POST "http://monitoring-system/api/deployments" \
#      -H "Content-Type: application/json" \
#      -d '{"service": "se2", "status": "deployed", "commit": "'$GIT_COMMIT'"}'

log_success "Post-deployment hook completed"
exit $HEALTH_EXIT_CODE
