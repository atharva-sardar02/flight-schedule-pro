# Flight Schedule Pro
## Weather Cancellation & AI Rescheduling System

**Project Code:** GOLD_FSP  
**Status:** 🚧 In Development  
**Category:** AI Solution  

An intelligent, automated system that monitors weather conditions for flight training lessons, detects safety conflicts based on student training levels, and uses AI to reschedule affected flights while respecting instructor and student availability.

---

## 🎯 Overview

Flight Schedule Pro automatically:
- **Monitors weather** every 10 minutes at 5 locations (departure, 3 corridor waypoints, arrival)
- **Detects conflicts** using training-level-specific weather minimums
- **Generates AI-powered rescheduling options** that consider availability, weather, and training requirements
- **Manages preferences** with clear instructor priority resolution
- **Enforces deadlines** with automatic escalation to manual scheduling

## ✨ Key Features

### Weather Monitoring & Safety
- ⏰ Automated 10-minute monitoring cycles via EventBridge
- 🌍 Multi-location validation (departure + 3 corridor waypoints + arrival)
- 🔄 Dual weather API providers (OpenWeatherMap + WeatherAPI.com) with automatic failover
- 📊 Training-level-aware safety logic:
  - **Student Pilot:** Clear skies, visibility >5 mi, winds <10 kt
  - **Private Pilot:** Visibility >3 mi, ceiling >1000 ft
  - **Instrument Rated:** IMC acceptable, no thunderstorms/icing

### AI-Powered Rescheduling
- 🤖 LangGraph workflow for complex multi-constraint optimization
- 📅 7-day rescheduling window from cancellation date
- ✅ Zero-conflict guarantee (validates against both calendars + existing bookings)
- 🌤️ Weather forecast validation for all 5 locations per suggestion
- 🎯 Generates 3 ranked alternative time slots

### Availability Management
- 📆 Built-in calendar system for instructors and students
- 🔁 Recurring weekly availability patterns
- 🚫 One-time availability overrides
- ⚡ Real-time sync with booking system

### Preference & Deadline System
- ⏱️ Deadline: `min(30 min before departure, 12 hours after notification)`
- 📊 Both parties rank 3 options (1st, 2nd, 3rd choice)
- 👨‍✈️ Instructor priority for final selection
- 🔔 Reminder notifications 2 hours before deadline
- 📞 Automatic escalation to manual scheduling if deadline passes

### Notifications
- 📧 Email notifications via AWS SES
- 🔔 In-app alerts via WebSocket
- 📱 Four notification types: conflict detected, options available, deadline reminder, confirmation

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- AWS Amplify for Cognito authentication
- WebSocket for real-time updates

**Backend:**
- TypeScript on AWS Lambda (serverless)
- LangGraph with LangChain TypeScript SDK for AI workflows
- PostgreSQL on AWS RDS for data persistence
- EventBridge for scheduled weather monitoring

**Cloud Infrastructure:**
- AWS Lambda for compute
- AWS RDS (PostgreSQL) for database
- AWS Cognito for authentication
- AWS SES for email notifications
- AWS API Gateway for REST and WebSocket APIs
- AWS EventBridge for scheduling
- AWS CloudWatch for monitoring
- AWS Secrets Manager for API keys

**External APIs:**
- OpenWeatherMap (weather data)
- WeatherAPI.com (weather data - backup)
- Anthropic Claude (AI/LLM)

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 14+ (local or Docker)
- **AWS CLI** configured with credentials
- **Git**
- **Weather API Keys:**
  - [OpenWeatherMap](https://openweathermap.org/api) API key
  - [WeatherAPI.com](https://www.weatherapi.com/) API key
- **Anthropic API Key** for LangGraph/Claude integration
- **AWS Account** with appropriate permissions

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd flight-schedule-pro
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Set Up Database

```bash
# Create database
createdb flight_schedule_pro

# Run migrations
psql -d flight_schedule_pro -f database/schema.sql
psql -d flight_schedule_pro -f database/migrations/*.sql

# Load seed data (optional, for development)
psql -d flight_schedule_pro -f database/seeds/dev_users.sql
psql -d flight_schedule_pro -f database/seeds/dev_bookings.sql
```

### 4. Configure Environment Variables

Copy `.env.template` to `.env` and fill in your values:

```bash
cp .env.template .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENWEATHERMAP_API_KEY` - OpenWeatherMap API key
- `WEATHERAPI_COM_KEY` - WeatherAPI.com API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `COGNITO_USER_POOL_ID` - AWS Cognito user pool ID
- `COGNITO_CLIENT_ID` - AWS Cognito app client ID
- `AWS_REGION` - AWS region (e.g., us-east-1)

See `.env.template` for complete list of variables.

### 5. Run Development Servers

**Backend (Lambda functions):**
```bash
cd backend
npm run dev  # Uses SAM CLI or Serverless Framework for local testing
```

**Frontend:**
```bash
cd frontend
npm run start  # Starts React dev server on http://localhost:3000
```

## 📁 Project Structure

```
flight-schedule-pro/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Utility functions
├── backend/         # Lambda functions & core logic
│   ├── src/
│   │   ├── functions/   # Lambda handlers
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Utilities
│   │   └── types/       # TypeScript types
├── infrastructure/  # AWS CloudFormation templates
│   ├── cloudformation/  # IaC templates
│   └── scripts/         # Deployment scripts
├── database/        # Database schema & migrations
│   ├── migrations/     # Versioned migrations
│   └── seeds/          # Seed data
├── tests/           # Test suites
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── memory-bank/     # Project documentation
└── docs/            # Additional documentation
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Test Coverage Target
- **Unit Tests:** >70% coverage
- **Integration Tests:** All critical paths covered
- **E2E Tests:** Complete user journeys

## 🚢 Deployment

### Staging Deployment

```bash
./infrastructure/scripts/deploy-staging.sh
```

This will:
1. Validate CloudFormation templates
2. Deploy infrastructure stack
3. Run database migrations
4. Deploy Lambda functions
5. Deploy frontend to S3/CloudFront

### Production Deployment

```bash
./infrastructure/scripts/deploy-production.sh
```

**Note:** Production deployment requires manual approval and follows blue/green deployment strategy.

See `docs/DEPLOYMENT.md` for detailed deployment guide.

## 📊 Monitoring

### CloudWatch Dashboards
- Real-time conflict detection rate
- Notification success rate
- AI suggestion generation performance
- Weather API uptime and latency
- Database query performance
- Lambda function error rates

### CloudWatch Alarms
- Lambda errors >3%: Page on-call engineer
- API Gateway 5xx >5%: Page on-call engineer
- RDS CPU >80%: Alert ops team
- Weather API failures >5%: Alert dev team
- Notification delivery <90%: Alert ops team

## 🔒 Security

- **Authentication:** AWS Cognito with JWT tokens
- **Authorization:** Role-based access control (Students, Instructors, Admins)
- **Secrets Management:** AWS Secrets Manager (no hardcoded credentials)
- **Data Encryption:** Encryption at rest (RDS, S3) and in transit (TLS 1.2+)
- **Input Validation:** Joi schema validation on all inputs
- **SQL Injection Prevention:** Parameterized queries only
- **Rate Limiting:** API Gateway throttling (1000 req/sec)

## 📝 Development Workflow

### Git Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Example:**
```
feat(weather): add dual-provider failover logic

Implements automatic failover from OpenWeatherMap to WeatherAPI.com
when primary provider fails. Includes cross-validation between providers.

Closes #123
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and write tests
3. Ensure all tests pass and linting is clean
4. Create PR with clear description
5. Request review
6. Address feedback
7. Merge after approval

## 📚 Documentation

- **PRD:** `prd_final_v2.md` - Complete Product Requirements Document
- **Task List:** `project_tasklist.md` - 25-PR implementation roadmap
- **Memory Bank:** `memory-bank/` - Project intelligence and context
- **API:** `docs/API.md` - API documentation (when created)
- **Architecture:** `docs/ARCHITECTURE.md` - System architecture (when created)
- **Deployment:** `docs/DEPLOYMENT.md` - Deployment guide (when created)

## 🎯 Success Metrics

### Technical Metrics
- 99.5% weather conflict detection accuracy
- <3 minute notification delivery time
- <10 second dashboard load time
- Zero schedule conflicts in AI suggestions

### Business Metrics
- >70% AI suggestion acceptance rate
- >90% preference submission before deadline
- <2% manual escalation rate
- Zero safety incidents due to missed weather conflicts

## 🐛 Known Issues

None yet. See GitHub Issues for current bug tracking.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat(scope): add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Specify your license here]

## 👥 Team

[Add team members or contact information]

## 🙏 Acknowledgments

- OpenWeatherMap and WeatherAPI.com for weather data
- Anthropic for Claude AI capabilities
- AWS for cloud infrastructure

---

**Status:** 🚧 Active Development  
**Last Updated:** November 2025  
**Version:** 0.1.0

