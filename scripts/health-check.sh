#!/bin/bash

# =============================================================================
# 🏥 SE2 Application Health Check Script
# =============================================================================
# This script performs comprehensive health checks on the SE2 application
# Author: Deployment Automation System
# Version: 1.0.0
# =============================================================================

# set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# 📝 CONFIGURATION
# =============================================================================

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." &> /dev/null && pwd)"
HEALTH_CHECK_URL="http://localhost:3000/health/status"
DB_HEALTH_CHECK_URL="http://localhost:3000/health/db"
APP_NAME="se2"
LOG_FILE="${APP_DIR}/logs/health_check.log"

# Colors and Emojis
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Health check results
HEALTH_RESULTS=()
HEALTH_SCORE=0
TOTAL_CHECKS=0

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

# Function to record health check result
record_check() {
    local check_name="$1"
    local status="$2"  # PASS, WARN, FAIL
    local message="$3"

    HEALTH_RESULTS+=("$check_name|$status|$message")
    ((TOTAL_CHECKS++))

    case "$status" in
        "PASS")
            ((HEALTH_SCORE++))
            echo -e "${GREEN}✅ $check_name: $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  $check_name: $message${NC}"
            ;;
        "FAIL")
            echo -e "${RED}❌ $check_name: $message${NC}"
            ;;
    esac

    # Log to file
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $check_name: $status - $message" >> "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# =============================================================================
# 🔍 HEALTH CHECK FUNCTIONS
# =============================================================================

check_system_dependencies() {
    log_header "🔧 SYSTEM DEPENDENCIES CHECK"

    # Check Node.js
    if command_exists node; then
        local node_version=$(node --version)
        record_check "Node.js" "PASS" "Version $node_version installed"
    else
        record_check "Node.js" "FAIL" "Node.js not found"
    fi

    # Check npm
    if command_exists npm; then
        local npm_version=$(npm --version)
        record_check "npm" "PASS" "Version $npm_version installed"
    else
        record_check "npm" "FAIL" "npm not found"
    fi

    # Check PM2
    if command_exists pm2; then
        local pm2_version=$(pm2 --version)
        record_check "PM2" "PASS" "Version $pm2_version installed"
    else
        record_check "PM2" "FAIL" "PM2 not found"
    fi

    # Check Git
    if command_exists git; then
        local git_version=$(git --version | cut -d' ' -f3)
        record_check "Git" "PASS" "Version $git_version installed"
    else
        record_check "Git" "WARN" "Git not found"
    fi

    # Check curl
    if command_exists curl; then
        record_check "curl" "PASS" "Available for health checks"
    else
        record_check "curl" "FAIL" "curl not found (required for health checks)"
    fi
}

check_application_files() {
    log_header "📁 APPLICATION FILES CHECK"

    cd "$APP_DIR"

    # Check essential files
    local essential_files=(
        "package.json"
        "ecosystem.config.js"
        "build/index.js"
        "build/app.js"
    )

    for file in "${essential_files[@]}"; do
        if [[ -f "$file" ]]; then
            record_check "File: $file" "PASS" "File exists"
        else
            record_check "File: $file" "FAIL" "File missing"
        fi
    done

    # Check build directory
    if [[ -d "build" ]]; then
        local build_size=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")
        record_check "Build Directory" "PASS" "Size: $build_size"
    else
        record_check "Build Directory" "FAIL" "Build directory not found"
    fi

    # Check logs directory
    if [[ -d "logs" ]]; then
        record_check "Logs Directory" "PASS" "Directory exists"
    else
        record_check "Logs Directory" "WARN" "Logs directory not found"
    fi

    # Check data directory
    if [[ -d "src/data" ]]; then
        record_check "Data Directory" "PASS" "Directory exists"

        # Check database file
        if [[ -f "src/data/orders.db" ]]; then
            local db_size=$(ls -lh "src/data/orders.db" | awk '{print $5}')
            record_check "Database File" "PASS" "Size: $db_size"
        else
            record_check "Database File" "WARN" "Database file not found"
        fi
    else
        record_check "Data Directory" "WARN" "Data directory not found"
    fi
}

check_pm2_status() {
    log_header "⚙️  PM2 PROCESS CHECK"

    if ! command_exists pm2; then
        record_check "PM2 Availability" "FAIL" "PM2 not installed"
        return
    fi

    # Check if PM2 daemon is running
    if pm2 ping >/dev/null 2>&1; then
        record_check "PM2 Daemon" "PASS" "PM2 daemon is running"
    else
        record_check "PM2 Daemon" "FAIL" "PM2 daemon is not responding"
        return
    fi

    # Check if our app is running
    if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
        # Get detailed process information
        local pm2_info=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\")")

        if [[ -n "$pm2_info" ]]; then
            local status=$(echo "$pm2_info" | jq -r '.pm2_env.status')
            local pid=$(echo "$pm2_info" | jq -r '.pid // "unknown"')
            local uptime=$(echo "$pm2_info" | jq -r '.pm2_env.pm_uptime')
            local memory=$(echo "$pm2_info" | jq -r '.memory // 0')
            local cpu=$(echo "$pm2_info" | jq -r '.cpu // 0')

            case "$status" in
                "online")
                    local uptime_readable=$(date -d "@$((uptime/1000))" "+%H:%M:%S" 2>/dev/null || echo "unknown")
                    local memory_mb=$((memory / 1024 / 1024))
                    record_check "PM2 Process Status" "PASS" "Online (PID: $pid, Uptime: $uptime_readable, Memory: ${memory_mb}MB, CPU: $cpu%)"
                    ;;
                "stopped")
                    record_check "PM2 Process Status" "FAIL" "Process is stopped"
                    ;;
                "errored")
                    record_check "PM2 Process Status" "FAIL" "Process is in error state"
                    ;;
                *)
                    record_check "PM2 Process Status" "WARN" "Unknown status: $status"
                    ;;
            esac
        else
            record_check "PM2 Process Info" "FAIL" "Could not retrieve process information"
        fi
    else
        record_check "PM2 Process" "FAIL" "Process '$APP_NAME' not found"
    fi
}

check_network_connectivity() {
    log_header "🌐 NETWORK CONNECTIVITY CHECK"

    # Check if port 3000 is open
    if command_exists nc; then
        if nc -z localhost 3000 2>/dev/null; then
            record_check "Port 3000" "PASS" "Port is open and accepting connections"
        else
            record_check "Port 3000" "FAIL" "Port is not accessible"
        fi
    elif command_exists netstat; then
        if netstat -an | grep -q ":3000.*LISTEN"; then
            record_check "Port 3000" "PASS" "Port is listening"
        else
            record_check "Port 3000" "FAIL" "Port is not listening"
        fi
    else
        record_check "Port Check" "WARN" "Neither nc nor netstat available for port checking"
    fi

    # Check process listening on port 3000
    if command_exists lsof; then
        local port_process=$(lsof -ti:3000 2>/dev/null || echo "")
        if [[ -n "$port_process" ]]; then
            local process_name=$(ps -p "$port_process" -o comm= 2>/dev/null || echo "unknown")
            record_check "Port 3000 Process" "PASS" "Process $process_name (PID: $port_process) is using port 3000"
        else
            record_check "Port 3000 Process" "FAIL" "No process found using port 3000"
        fi
    fi
}

check_application_endpoints() {
    log_header "🔗 APPLICATION ENDPOINTS CHECK"

    # Check main health endpoint
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$HEALTH_CHECK_URL" 2>/dev/null || echo "timeout")

    if [[ "$status_code" == "200" ]]; then
        record_check "Health Endpoint" "PASS" "Response 200 OK (${response_time}s)"
    elif [[ "$status_code" == "000" ]]; then
        record_check "Health Endpoint" "FAIL" "No response (connection failed)"
    else
        record_check "Health Endpoint" "FAIL" "HTTP $status_code"
    fi

    # Check database health endpoint
    local db_status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$DB_HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    local db_response=$(curl -s --max-time 10 "$DB_HEALTH_CHECK_URL" 2>/dev/null || echo "{}")

    if [[ "$db_status_code" == "200" ]]; then
        local db_message=""
        if command_exists jq && echo "$db_response" | jq . >/dev/null 2>&1; then
            db_message=$(echo "$db_response" | jq -r '.message // "Database OK"')
        fi
        record_check "Database Health" "PASS" "Response 200 OK - $db_message"
    elif [[ "$db_status_code" == "000" ]]; then
        record_check "Database Health" "FAIL" "No response (connection failed)"
    else
        record_check "Database Health" "FAIL" "HTTP $db_status_code"
    fi

    # Test a few more endpoints if they exist
    local endpoints=(
        "http://localhost:3000/api"
        "http://localhost:3000/api/auth"
    )

    for endpoint in "${endpoints[@]}"; do
        local ep_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$endpoint" 2>/dev/null || echo "000")
        local ep_name=$(echo "$endpoint" | sed 's|http://localhost:3000||')

        case "$ep_status" in
            "200"|"401"|"403")  # These might be normal for auth endpoints
                record_check "Endpoint $ep_name" "PASS" "Responding (HTTP $ep_status)"
                ;;
            "404")
                record_check "Endpoint $ep_name" "WARN" "Not found (HTTP 404)"
                ;;
            "000")
                record_check "Endpoint $ep_name" "WARN" "No response"
                ;;
            *)
                record_check "Endpoint $ep_name" "WARN" "HTTP $ep_status"
                ;;
        esac
    done
}

check_system_resources() {
    log_header "💻 SYSTEM RESOURCES CHECK"

    # Check disk space
    local disk_usage
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        disk_usage=$(df -h "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    else
        # Linux
        disk_usage=$(df -h "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    fi

    if [[ $disk_usage -lt 80 ]]; then
        record_check "Disk Usage" "PASS" "${disk_usage}% used"
    elif [[ $disk_usage -lt 90 ]]; then
        record_check "Disk Usage" "WARN" "${disk_usage}% used (getting high)"
    else
        record_check "Disk Usage" "FAIL" "${disk_usage}% used (critically high)"
    fi

    # Check memory usage (if possible)
    if command_exists free; then
        local mem_usage=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
        if (( $(echo "$mem_usage < 80" | bc -l) )); then
            record_check "Memory Usage" "PASS" "${mem_usage}% used"
        elif (( $(echo "$mem_usage < 90" | bc -l) )); then
            record_check "Memory Usage" "WARN" "${mem_usage}% used (getting high)"
        else
            record_check "Memory Usage" "FAIL" "${mem_usage}% used (critically high)"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS memory check
        local mem_pressure=$(memory_pressure 2>/dev/null | grep "System-wide memory free percentage" | awk '{print $NF}' | sed 's/%//' || echo "unknown")
        if [[ "$mem_pressure" != "unknown" && $mem_pressure -gt 20 ]]; then
            record_check "Memory Pressure" "PASS" "${mem_pressure}% free"
        elif [[ "$mem_pressure" != "unknown" ]]; then
            record_check "Memory Pressure" "WARN" "${mem_pressure}% free (low)"
        else
            record_check "Memory Check" "WARN" "Could not determine memory usage"
        fi
    fi

    # Check load average (if available)
    if [[ -f /proc/loadavg ]]; then
        local load_avg=$(cut -d' ' -f1 /proc/loadavg)
        local cpu_count=$(nproc)
        local load_ratio=$(echo "scale=2; $load_avg / $cpu_count" | bc)

        if (( $(echo "$load_ratio < 0.7" | bc -l) )); then
            record_check "System Load" "PASS" "$load_avg (${load_ratio} per core)"
        elif (( $(echo "$load_ratio < 1.0" | bc -l) )); then
            record_check "System Load" "WARN" "$load_avg (${load_ratio} per core)"
        else
            record_check "System Load" "FAIL" "$load_avg (${load_ratio} per core - high load)"
        fi
    fi
}

check_log_files() {
    log_header "📋 LOG FILES CHECK"

    cd "$APP_DIR"

    # Check if logs directory exists
    if [[ ! -d "logs" ]]; then
        record_check "Logs Directory" "WARN" "Logs directory not found"
        return
    fi

    # Check various log files
    local log_files=(
        "logs/all.log"
        "logs/error.log"
        "logs/exceptions.log"
    )

    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            local file_size=$(ls -lh "$log_file" | awk '{print $5}')
            local last_modified=$(stat -c %y "$log_file" 2>/dev/null || stat -f "%Sm" "$log_file" 2>/dev/null || echo "unknown")

            # Check for recent errors
            local recent_errors=0
            if [[ "$log_file" == *"error"* ]] || [[ "$log_file" == *"exception"* ]]; then
                recent_errors=$(tail -n 100 "$log_file" 2>/dev/null | grep -c "$(date +%Y-%m-%d)" || echo 0)
            fi

            if [[ $recent_errors -gt 10 ]]; then
                record_check "Log: $(basename "$log_file")" "FAIL" "Size: $file_size, $recent_errors recent errors"
            elif [[ $recent_errors -gt 0 ]]; then
                record_check "Log: $(basename "$log_file")" "WARN" "Size: $file_size, $recent_errors recent errors"
            else
                record_check "Log: $(basename "$log_file")" "PASS" "Size: $file_size, no recent errors"
            fi
        else
            record_check "Log: $(basename "$log_file")" "WARN" "Log file not found"
        fi
    done
}

# =============================================================================
# 📊 REPORTING FUNCTIONS
# =============================================================================

generate_health_report() {
    log_header "📊 HEALTH CHECK SUMMARY"

    local health_percentage=$((HEALTH_SCORE * 100 / TOTAL_CHECKS))

    echo -e "\n${WHITE}📋 HEALTH REPORT${NC}"
    echo -e "${CYAN}===================${NC}"
    echo -e "Total Checks: $TOTAL_CHECKS"
    echo -e "Passed: $HEALTH_SCORE"
    echo -e "Health Score: ${health_percentage}%"
    echo -e "Timestamp: $(date)"
    echo

    # Color-code the health status
    if [[ $health_percentage -ge 90 ]]; then
        echo -e "${GREEN}🎉 EXCELLENT HEALTH${NC} - System is running optimally"
    elif [[ $health_percentage -ge 80 ]]; then
        echo -e "${YELLOW}✅ GOOD HEALTH${NC} - System is running well with minor issues"
    elif [[ $health_percentage -ge 60 ]]; then
        echo -e "${YELLOW}⚠️  FAIR HEALTH${NC} - System has some issues that need attention"
    else
        echo -e "${RED}❌ POOR HEALTH${NC} - System has significant issues requiring immediate attention"
    fi

    echo
    echo -e "${WHITE}📋 DETAILED RESULTS:${NC}"
    echo -e "${CYAN}===================${NC}"

    for result in "${HEALTH_RESULTS[@]}"; do
        IFS='|' read -r check_name status message <<< "$result"
        case "$status" in
            "PASS")
                echo -e "${GREEN}✅${NC} $check_name: $message"
                ;;
            "WARN")
                echo -e "${YELLOW}⚠️${NC}  $check_name: $message"
                ;;
            "FAIL")
                echo -e "${RED}❌${NC} $check_name: $message"
                ;;
        esac
    done

    # Save report to file
    {
        echo "=== SE2 Health Check Report ==="
        echo "Date: $(date)"
        echo "Health Score: $health_percentage% ($HEALTH_SCORE/$TOTAL_CHECKS)"
        echo
        for result in "${HEALTH_RESULTS[@]}"; do
            IFS='|' read -r check_name status message <<< "$result"
            echo "$status: $check_name - $message"
        done
    } > "${APP_DIR}/logs/health_report_$(date +%Y%m%d_%H%M%S).log"

    return $((100 - health_percentage))  # Return non-zero if health is not perfect
}

# =============================================================================
# 📋 USAGE AND MAIN EXECUTION
# =============================================================================

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --quick     - Run quick health checks only"
    echo "  --full      - Run comprehensive health checks (default)"
    echo "  --silent    - Minimal output (exit code indicates health)"
    echo "  --help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Run full health check"
    echo "  $0 --quick     # Run quick health check"
    echo "  $0 --silent    # Silent check (for scripts)"
}

run_quick_checks() {
    check_pm2_status
    check_application_endpoints
}

run_full_checks() {
    check_system_dependencies
    check_application_files
    check_pm2_status
    check_network_connectivity
    check_application_endpoints
    check_system_resources
    check_log_files
}

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Parse command line arguments
case "${1:---full}" in
    "--quick")
        log_header "🏥 SE2 QUICK HEALTH CHECK"
        run_quick_checks
        ;;
    "--full")
        log_header "🏥 SE2 COMPREHENSIVE HEALTH CHECK"
        run_full_checks
        ;;
    "--silent")
        exec > /dev/null 2>&1
        run_full_checks
        ;;
    "--help"|"-h")
        show_usage
        exit 0
        ;;
    *)
        log_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac

# Generate and display the final report
generate_health_report
exit_code=$?

if [[ "${1:-}" != "--silent" ]]; then
    echo
    log_info "Health check completed. Report saved to logs/"

    if [[ $exit_code -eq 0 ]]; then
        log_success "System is healthy! 🎉"
    else
        log_warning "System has health issues that may need attention ⚠️"
    fi
fi

exit $exit_code
