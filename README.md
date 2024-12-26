# Express Server Template (MVC)

A production-ready Express.js server template following the MVC architecture pattern, designed for building RESTful APIs.

## Features

- MVC Architecture
- RESTful API Structure
- Error Handling Middleware
- Request Logging (Morgan & Winston)
- Security Headers (Helmet)
- CORS Support
- Rate Limiting
- HTTP Request Retries
- Compression
- Response Time Tracking
- Health Monitoring
- Environment Variables Support
- Development Hot Reload
- Vitest Testing Framework with UI and Coverage
- ESLint v9 with Prettier Integration
- Modern ES6+ Syntax
- Git Hooks with Husky
- Docker Support with Health Checks

## Project Structure

```plaintext
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Data models
├── routes/         # Route definitions
├── services/       # Business logic and external services
├── utils/          # Utility functions and helpers
├── test/          # Test files
│   ├── unit/      # Unit tests
│   └── integration/# Integration tests
└── app.js         # Application entry point

scripts/           # Utility scripts
├── check-docker.js       # Docker availability check
├── docker-healthcheck.js # Docker container health check
├── install-docker.js     # Docker installation helper
├── install-extensions.js # VS Code extensions installer
├── post-install.js      # Post-installation setup
└── setup-env.js         # Environment setup
```

## Getting Started

### Local Development

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   This will automatically:

   - Create a `.env` file from `.env.example`
   - Check for Docker installation (optional)
   - Set up Git hooks for code quality
   - Install recommended VS Code extensions (optional)

3. Start the development server:

   ```bash
   # Without Docker
   npm run dev

   # With Docker (requires Docker to be running)
   npm run docker:dev
   ```

### Docker Development

Docker is optional but recommended for consistent development environments. The application can run with or without Docker.

#### Prerequisites

For Docker-based development:

- Docker Engine 24.0.0 or later
- Docker Compose V2 or later

Docker installation is checked during `npm install`, but won't block the installation if Docker isn't available. You can manage Docker separately:

```bash
# Check if Docker is installed and running
npm run docker:check

# Install Docker (interactive)
npm run docker:install
```

The installation script will:

- Detect your operating system
- Install Docker using the appropriate method:
  - macOS: Uses Homebrew if available
  - Linux: Uses apt-get on Debian-based systems
  - Windows: Opens the Docker Desktop installer
- Guide you through manual installation if automatic installation isn't possible

#### Running with Docker

1. Using Docker Compose (recommended for development):

   ```bash
   npm run docker:dev
   ```

   This will start the server in development mode with hot-reload enabled.

2. Using Docker directly:

   ```bash
   # Build the image
   npm run docker:build

   # Run the container
   npm run docker:run
   ```

To stop the Docker containers:

```bash
npm run docker:down
```

## API Endpoints

### Main Routes

- `GET /api` - Welcome message
- Additional endpoints can be added in the routes directory

### Health Routes

- `GET /health` - Full health check with system metrics
- `GET /health/live` - Liveness probe for basic availability
- `GET /health/ready` - Readiness probe for service availability

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm test` - Run Vitest tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Open Vitest UI for interactive testing
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm run setup` - Run initial environment setup
- `npm run setup:extensions` - Install recommended VS Code extensions
- `npm run docker:install` - Install Docker (interactive)
- `npm run docker:check` - Check Docker installation
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:down` - Stop Docker containers

## Dependencies

### Production

- Express.js - Web framework
- Axios - HTTP client with retry support
- Morgan & Winston - Logging
- Helmet - Security headers
- CORS - Cross-origin resource sharing
- Compression - Response compression
- Rate Limiting - API request throttling
- Dotenv - Environment variables

### Development

- Vitest - Testing framework with UI and coverage support
- ESLint - Code linting with Prettier integration
- Nodemon - Development hot reload
- Supertest - HTTP testing

## Health Monitoring

The application includes comprehensive health monitoring:

### Health Check Types

1. **Liveness Probe** (`/health/live`)

   - Quick check to verify the service is running
   - Used by Docker for container health checks
   - Returns 200 if the service is alive

2. **Readiness Probe** (`/health/ready`)

   - Comprehensive check for service availability
   - Monitors system resources:
     - CPU load average
     - Memory usage (production only)
   - Different thresholds for development and production
   - Returns 503 if the service is not ready

3. **Full Health Check** (`/health`)
   - Detailed system information
   - Memory usage statistics
   - CPU information
   - System uptime
   - Process details
   - Version information

### Environment-Specific Behavior

- **Development**:

  - Skips memory checks (unreliable in development)
  - More lenient CPU thresholds
  - Faster startup time

- **Production**:
  - Strict memory and CPU checks
  - Conservative resource thresholds
  - Comprehensive monitoring

## Code Formatting

The project uses Prettier for consistent code formatting. Configuration is in `.prettierrc.json`. Formatting is automatically handled by ESLint.

## Testing

Tests are written using Vitest and are located in the `src/test` directory:

- `unit/` - Unit tests for individual components
- `integration/` - End-to-end API tests

Run tests with:

```bash
npm test           # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run test:ui        # Open Vitest UI for interactive testing
```

## Code Quality

### ESLint Configuration

The project uses ESLint v9 with the official flat config system. The configuration:

- Uses `@eslint/js` recommended configuration
- Supports modern ES6+ syntax
- Includes Node.js environment globals
- Customizes console logging rules for better debugging
- Ignores common development files and directories

Run `npm run lint` to check for issues and `npm run lint:fix` to automatically fix them.

### Git Hooks

This project uses Husky to manage Git hooks:

- **Pre-commit**: Runs lint-staged and tests
  - Lints and formats staged files
  - Runs the test suite

This ensures that all committed code meets our quality standards and passes tests.

## License

ISC
