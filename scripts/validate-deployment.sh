#!/bin/bash

# =============================================================================
# 🧪 SE2 Deployment System Validator
# =============================================================================
# This script validates the deployment system without making actual changes
# Author: Deployment Automation System
# Version: 1.0.0
# =============================================================================

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." &> /dev/null && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

log_info() { echo -e "${BLUE}ℹ️  INFO:${NC} $1"; }
log_success() { echo -e "${GREEN}✅ SUCCESS:${NC} $1"; }
log_warning() { echo -e "${YELLOW}⚠️  WARNING:${NC} $1"; }
log_error() { echo -e "${RED}❌ ERROR:${NC} $1"; }
log_test() { echo -e "${CYAN}🧪 TEST:${NC} $1"; }

# Test result tracking
test_result() {
    local test_name="$1"
    local status="$2"  # PASS or FAIL
    local message="$3"

    ((TESTS_TOTAL++))

    if [[ "$status" == "PASS" ]]; then
        ((TESTS_PASSED++))
        echo -e "${GREEN}✅ PASS:${NC} $test_name - $message"
    else
        ((TESTS_FAILED++))
        echo -e "${RED}❌ FAIL:${NC} $test_name - $message"
    fi
}

# Test script existence and permissions
test_scripts_exist() {
    log_test "Checking deployment scripts existence and permissions"

    local required_scripts=(
        "deploy.sh"
        "rollback.sh"
        "health-check.sh"
        "deploy-orchestrator.sh"
        "pre-deploy-hook.sh"
        "post-deploy-hook.sh"
        "validate-deployment.sh"
    )

    for script in "${required_scripts[@]}"; do
        local script_path="${SCRIPT_DIR}/$script"

        if [[ -f "$script_path" ]]; then
            if [[ -x "$script_path" ]]; then
                test_result "Script $script" "PASS" "exists and is executable"
            else
                test_result "Script $script" "FAIL" "exists but is not executable"
            fi
        else
            test_result "Script $script" "FAIL" "does not exist"
        fi
    done
}

# Test required dependencies
test_dependencies() {
    log_test "Checking system dependencies"

    local required_commands=(
        "node:Node.js runtime"
        "npm:Package manager"
        "pm2:Process manager"
        "git:Version control"
        "curl:HTTP client"
    )

    for dep in "${required_commands[@]}"; do
        IFS=':' read -r cmd desc <<< "$dep"

        if command -v "$cmd" >/dev/null 2>&1; then
            local version
            case "$cmd" in
                "node") version=$(node --version) ;;
                "npm") version=$(npm --version) ;;
                "pm2") version=$(pm2 --version) ;;
                "git") version=$(git --version | cut -d' ' -f3) ;;
                "curl") version=$(curl --version | head -1 | cut -d' ' -f2) ;;
                *) version="unknown" ;;
            esac
            test_result "Dependency $cmd" "PASS" "$desc available (v$version)"
        else
            test_result "Dependency $cmd" "FAIL" "$desc not found"
        fi
    done
}

# Test application structure
test_app_structure() {
    log_test "Checking application structure"

    cd "$APP_DIR"

    local required_files=(
        "package.json:Package configuration"
        "ecosystem.config.js:PM2 configuration"
        "src/app.ts:Application source"
        "src/index.ts:Entry point"
        "tsconfig.json:TypeScript configuration"
    )

    for file_info in "${required_files[@]}"; do
        IFS=':' read -r file desc <<< "$file_info"

        if [[ -f "$file" ]]; then
            test_result "File $file" "PASS" "$desc exists"
        else
            test_result "File $file" "FAIL" "$desc missing"
        fi
    done

    # Check directories
    local required_dirs=(
        "src:Source code directory"
        "scripts:Deployment scripts directory"
    )

    for dir_info in "${required_dirs[@]}"; do
        IFS=':' read -r dir desc <<< "$dir_info"

        if [[ -d "$dir" ]]; then
            test_result "Directory $dir" "PASS" "$desc exists"
        else
            test_result "Directory $dir" "FAIL" "$desc missing"
        fi
    done
}

# Test build process (dry run)
test_build_process() {
    log_test "Testing build process (dry run)"

    cd "$APP_DIR"

    # Check if package.json has required scripts
    if command -v jq >/dev/null 2>&1 && [[ -f "package.json" ]]; then
        local build_script
        build_script=$(jq -r '.scripts.build // empty' package.json)

        if [[ -n "$build_script" ]]; then
            test_result "Build script" "PASS" "Found: $build_script"
        else
            test_result "Build script" "FAIL" "No build script in package.json"
        fi

        local start_script
        start_script=$(jq -r '.scripts.start // empty' package.json)

        if [[ -n "$start_script" ]]; then
            test_result "Start script" "PASS" "Found: $start_script"
        else
            test_result "Start script" "FAIL" "No start script in package.json"
        fi
    else
        test_result "Package.json parsing" "FAIL" "jq not available or package.json missing"
    fi

    # Check TypeScript configuration
    if [[ -f "tsconfig.json" ]]; then
        if command -v jq >/dev/null 2>&1; then
            local out_dir
            out_dir=$(jq -r '.compilerOptions.outDir // "build"' tsconfig.json)
            test_result "TypeScript outDir" "PASS" "Output directory: $out_dir"
        else
            test_result "TypeScript config" "PASS" "tsconfig.json exists"
        fi
    else
        test_result "TypeScript config" "FAIL" "tsconfig.json missing"
    fi
}

# Test PM2 configuration
test_pm2_config() {
    log_test "Testing PM2 configuration"

    cd "$APP_DIR"

    if [[ -f "ecosystem.config.js" ]]; then
        # Basic syntax check
        if node -c ecosystem.config.js 2>/dev/null; then
            test_result "PM2 config syntax" "PASS" "ecosystem.config.js is valid JavaScript"
        else
            test_result "PM2 config syntax" "FAIL" "ecosystem.config.js has syntax errors"
        fi

        # Check for required fields (basic grep check)
        if grep -q "script.*:" ecosystem.config.js; then
            test_result "PM2 script field" "PASS" "Script field found in config"
        else
            test_result "PM2 script field" "FAIL" "Script field missing in config"
        fi

        if grep -q "env_production" ecosystem.config.js; then
            test_result "PM2 production env" "PASS" "Production environment config found"
        else
            test_result "PM2 production env" "FAIL" "Production environment config missing"
        fi
    else
        test_result "PM2 config file" "FAIL" "ecosystem.config.js missing"
    fi
}

# Test health check endpoints (mock)
test_health_endpoints() {
    log_test "Testing health check endpoint definitions"

    # Check if health routes are defined in the source code
    if grep -r "health/status" src/ >/dev/null 2>&1; then
        test_result "Health status endpoint" "PASS" "Health status endpoint found in source"
    else
        test_result "Health status endpoint" "FAIL" "Health status endpoint not found in source"
    fi

    if grep -r "health/db" src/ >/dev/null 2>&1; then
        test_result "Database health endpoint" "PASS" "Database health endpoint found in source"
    else
        test_result "Database health endpoint" "FAIL" "Database health endpoint not found in source"
    fi
}

# Test script syntax
test_script_syntax() {
    log_test "Testing deployment script syntax"

    local scripts=(
        "deploy.sh"
        "rollback.sh"
        "health-check.sh"
        "deploy-orchestrator.sh"
        "pre-deploy-hook.sh"
        "post-deploy-hook.sh"
    )

    for script in "${scripts[@]}"; do
        local script_path="${SCRIPT_DIR}/$script"

        if [[ -f "$script_path" ]]; then
            if bash -n "$script_path" 2>/dev/null; then
                test_result "Syntax $script" "PASS" "Script syntax is valid"
            else
                test_result "Syntax $script" "FAIL" "Script has syntax errors"
            fi
        fi
    done
}

# Test directory permissions
test_permissions() {
    log_test "Testing directory permissions and security"

    # Check if scripts directory has proper permissions
    local scripts_perms
    scripts_perms=$(stat -c %a "$SCRIPT_DIR" 2>/dev/null || stat -f %A "$SCRIPT_DIR" 2>/dev/null || echo "unknown")

    if [[ "$scripts_perms" != "unknown" ]]; then
        test_result "Scripts directory permissions" "PASS" "Permissions: $scripts_perms"
    else
        test_result "Scripts directory permissions" "FAIL" "Could not determine permissions"
    fi

    # Check if backup directory will have proper permissions (if it exists)
    if [[ -d "${APP_DIR}/backups" ]]; then
        local backup_perms
        backup_perms=$(stat -c %a "${APP_DIR}/backups" 2>/dev/null || stat -f %A "${APP_DIR}/backups" 2>/dev/null || echo "unknown")

        if [[ "$backup_perms" == "700" ]]; then
            test_result "Backup directory permissions" "PASS" "Secure permissions (700)"
        else
            test_result "Backup directory permissions" "FAIL" "Insecure permissions: $backup_perms"
        fi
    else
        test_result "Backup directory" "PASS" "Will be created during deployment"
    fi
}

# Test logging setup
test_logging() {
    log_test "Testing logging configuration"

    # Create logs directory if it doesn't exist (for testing)
    mkdir -p "${APP_DIR}/logs"

    # Test if we can write to logs directory
    local test_log="${APP_DIR}/logs/test_$(date +%s).log"
    if echo "test" > "$test_log" 2>/dev/null; then
        test_result "Log directory writable" "PASS" "Can write to logs directory"
        rm -f "$test_log"
    else
        test_result "Log directory writable" "FAIL" "Cannot write to logs directory"
    fi

    # Check if application has logging configured
    if grep -r "winston\|console.log" src/ >/dev/null 2>&1; then
        test_result "Application logging" "PASS" "Logging code found in application"
    else
        test_result "Application logging" "FAIL" "No logging code found in application"
    fi
}

# Generate validation report
generate_report() {
    echo
    echo -e "${CYAN}================================${NC}"
    echo -e "${WHITE}🧪 DEPLOYMENT SYSTEM VALIDATION REPORT${NC}"
    echo -e "${CYAN}================================${NC}"
    echo
    echo -e "Total Tests: $TESTS_TOTAL"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

    local success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "Success Rate: $success_rate%"
    echo

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
        echo -e "${GREEN}✅ Deployment system is ready for use${NC}"
        return 0
    elif [[ $success_rate -ge 80 ]]; then
        echo -e "${YELLOW}⚠️  MOSTLY WORKING${NC}"
        echo -e "${YELLOW}Some issues found but system should be functional${NC}"
        return 1
    else
        echo -e "${RED}❌ VALIDATION FAILED${NC}"
        echo -e "${RED}Critical issues found - deployment system needs fixes${NC}"
        return 2
    fi
}

# Main validation function
main() {
    echo -e "${BLUE}🧪 Starting SE2 Deployment System Validation...${NC}"
    echo

    test_scripts_exist
    test_dependencies
    test_app_structure
    test_build_process
    test_pm2_config
    test_health_endpoints
    test_script_syntax
    test_permissions
    test_logging

    generate_report
}

# Run validation
main
