#!/bin/bash
# ==============================================================================
# Flight Schedule Pro - Staging Deployment Script
# ==============================================================================
# This script deploys the complete AWS infrastructure to staging environment
# ==============================================================================

set -e  # Exit on any error

# Configuration
PROJECT_NAME="flight-schedule-pro"
ENVIRONMENT="staging"
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_PROFILE="${AWS_PROFILE:-default}"

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

# Deploy CloudFormation stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local parameters=$3
    
    log_info "Deploying stack: $stack_name..."
    
    aws cloudformation deploy \
        --template-file $template_file \
        --stack-name $stack_name \
        --parameter-overrides $parameters \
        --capabilities CAPABILITY_NAMED_IAM \
        --profile $AWS_PROFILE \
        --region $AWS_REGION \
        --tags Project=$PROJECT_NAME Environment=$ENVIRONMENT
    
    log_info "Stack $stack_name deployed successfully!"
}

# Main deployment flow
main() {
    log_info "Starting staging deployment for $PROJECT_NAME..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"
    log_info "Profile: $AWS_PROFILE"
    echo ""
    
    # Validate all templates first
    validate_templates
    echo ""
    
    # Deploy SNS first (needed by CloudWatch)
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-sns" \
        "infrastructure/cloudformation/sns.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME AlertEmail=ops@flightschedulepro.com"
    
    # Deploy Secrets Manager
    log_warn "Please ensure API keys are set in environment variables:"
    log_warn "  - OPENWEATHERMAP_API_KEY"
    log_warn "  - WEATHERAPI_COM_KEY"
    log_warn "  - ANTHROPIC_API_KEY"
    
    if [ -z "$OPENWEATHERMAP_API_KEY" ] || [ -z "$WEATHERAPI_COM_KEY" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
        log_error "API keys not set. Please export them and run again."
        exit 1
    fi
    
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-secrets" \
        "infrastructure/cloudformation/secrets.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME OpenWeatherMapApiKey=$OPENWEATHERMAP_API_KEY WeatherApiComKey=$WEATHERAPI_COM_KEY AnthropicApiKey=$ANTHROPIC_API_KEY"
    
    # Deploy Cognito
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-cognito" \
        "infrastructure/cloudformation/cognito.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME"
    
    # Deploy RDS
    log_warn "Please set DB_MASTER_PASSWORD environment variable"
    if [ -z "$DB_MASTER_PASSWORD" ]; then
        log_error "DB_MASTER_PASSWORD not set. Please export it and run again."
        exit 1
    fi
    
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-rds" \
        "infrastructure/cloudformation/rds.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME DBInstanceClass=db.t3.micro DBMasterPassword=$DB_MASTER_PASSWORD"
    
    # Deploy Lambda
    log_info "Note: Lambda code must be uploaded to S3 first"
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-lambda" \
        "infrastructure/cloudformation/lambda.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME LambdaCodeBucket=${PROJECT_NAME}-lambda-code LambdaCodeKey=staging/lambda-code.zip"
    
    # Deploy API Gateway
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-api-gateway" \
        "infrastructure/cloudformation/api-gateway.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME"
    
    # Deploy EventBridge
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-eventbridge" \
        "infrastructure/cloudformation/eventbridge.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME"
    
    # Deploy SES
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-ses" \
        "infrastructure/cloudformation/ses.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME FromEmailAddress=noreply@staging.flightschedulepro.com"
    
    # Deploy S3
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-s3" \
        "infrastructure/cloudformation/s3.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME"
    
    # Deploy CloudFront
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-cloudfront" \
        "infrastructure/cloudformation/cloudfront.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME"
    
    # Deploy CloudWatch
    deploy_stack \
        "${PROJECT_NAME}-${ENVIRONMENT}-cloudwatch" \
        "infrastructure/cloudformation/cloudwatch.yaml" \
        "Environment=$ENVIRONMENT ProjectName=$PROJECT_NAME AlarmEmail=ops@flightschedulepro.com"
    
    echo ""
    log_info "========================================="
    log_info "Staging deployment completed successfully!"
    log_info "========================================="
    log_info "Next steps:"
    log_info "1. Run database migrations"
    log_info "2. Deploy Lambda code"
    log_info "3. Deploy frontend to S3"
    log_info "4. Test all endpoints"
}

# Run main deployment
main


