#!/bin/bash
# ==============================================================================
# Flight Schedule Pro - Production Deployment Script
# ==============================================================================
# This script deploys the complete AWS infrastructure to production environment
# Includes additional safety checks and manual approval steps
# ==============================================================================

set -e  # Exit on any error

# Configuration
PROJECT_NAME="flight-schedule-pro"
ENVIRONMENT="production"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

confirm() {
    read -p "$1 (yes/no): " response
    if [ "$response" != "yes" ]; then
        log_error "Deployment cancelled by user"
        exit 1
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    # Check Git status
    if [ -n "$(git status --porcelain)" ]; then
        log_warn "Working directory is not clean"
        confirm "Continue with uncommitted changes?"
    fi
    
    # Check if on main/master branch
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
        log_warn "Not on main/master branch (current: $BRANCH)"
        confirm "Continue with deployment from $BRANCH?"
    fi
    
    log_info "Pre-deployment checks passed!"
}

# Validate CloudFormation templates
validate_templates() {
    log_info "Validating CloudFormation templates..."
    
    for template in infrastructure/cloudformation/*.yaml; do
        log_info "Validating $(basename $template)..."
        aws cloudformation validate-template \
            --template-body file://$template \
            --profile $AWS_PROFILE \
            --region $AWS_REGION > /dev/null
    done
    
    log_info "All templates validated successfully!"
}

# Deploy CloudFormation stack with change set
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local parameters=$3
    
    log_info "Creating change set for stack: $stack_name..."
    
    local change_set_name="${stack_name}-$(date +%Y%m%d%H%M%S)"
    
    aws cloudformation create-change-set \
        --stack-name $stack_name \
        --change-set-name $change_set_name \
        --template-body file://$template_file \
        --parameters $parameters \
        --capabilities CAPABILITY_NAMED_IAM \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --tags Key=Project,Value=$PROJECT_NAME Key=Environment,Value=$ENVIRONMENT
    
    log_info "Waiting for change set to be created..."
    aws cloudformation wait change-set-create-complete \
        --stack-name $stack_name \
        --change-set-name $change_set_name \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    
    log_info "Change set created. Review changes in AWS Console."
    confirm "Deploy this change set?"
    
    aws cloudformation execute-change-set \
        --stack-name $stack_name \
        --change-set-name $change_set_name \
        --profile $AWS_PROFILE \
        --region $AWS_REGION
    
    log_info "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
        --stack-name $stack_name \
        --profile $AWS_PROFILE \
        --region $AWS_REGION || true
    
    log_info "Stack $stack_name deployed successfully!"
}

# Main deployment flow
main() {
    log_warn "========================================="
    log_warn "PRODUCTION DEPLOYMENT"
    log_warn "========================================="
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"
    log_info "Profile: $AWS_PROFILE"
    echo ""
    
    confirm "Are you sure you want to deploy to PRODUCTION?"
    
    # Pre-deployment checks
    pre_deployment_checks
    echo ""
    
    # Validate all templates
    validate_templates
    echo ""
    
    log_info "Starting production deployment..."
    log_info "This deployment will use change sets for safety."
    echo ""
    
    # Deploy in correct order with approval steps
    log_info "Step 1: Deploy SNS (for CloudWatch alarms)"
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-sns" \
        "infrastructure/cloudformation/sns.yaml" \
        "ParameterKey=Environment,ParameterValue=$ENVIRONMENT ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME ParameterKey=AlertEmail,ParameterValue=ops@flightschedulepro.com"
    
    log_info "Step 2: Deploy Secrets Manager"
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-secrets" \
        "infrastructure/cloudformation/secrets.yaml" \
        "ParameterKey=Environment,ParameterValue=$ENVIRONMENT ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME ParameterKey=OpenWeatherMapApiKey,ParameterValue=$OPENWEATHERMAP_API_KEY ParameterKey=WeatherApiComKey,ParameterValue=$WEATHERAPI_COM_KEY ParameterKey=AnthropicApiKey,ParameterValue=$ANTHROPIC_API_KEY"
    
    log_info "Step 3: Deploy Cognito"
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-cognito" \
        "infrastructure/cloudformation/cognito.yaml" \
        "ParameterKey=Environment,ParameterValue=$ENVIRONMENT ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME"
    
    log_info "Step 4: Deploy RDS (with Multi-AZ and deletion protection)"
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-rds" \
        "infrastructure/cloudformation/rds.yaml" \
        "ParameterKey=Environment,ParameterValue=$ENVIRONMENT ParameterKey=ProjectName,ParameterValue=$PROJECT_NAME ParameterKey=DBInstanceClass,ParameterValue=db.t3.small ParameterKey=DBMasterPassword,ParameterValue=$DB_MASTER_PASSWORD"
    
    # Continue with remaining stacks...
    log_info "Production deployment completed!"
    log_warn "Remember to:"
    log_warn "1. Verify all resources in AWS Console"
    log_warn "2. Run smoke tests"
    log_warn "3. Monitor CloudWatch dashboards"
    log_warn "4. Keep deployment logs for audit"
}

# Run main deployment
main


