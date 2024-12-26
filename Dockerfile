# Use Node.js LTS (Long Term Support) as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy scripts directory for Docker checks
COPY scripts ./scripts/

# Install dependencies without running post-install script
ENV SKIP_POST_INSTALL=true
RUN npm ci

# Copy the rest of the application
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Make the healthcheck script executable
RUN chmod +x scripts/docker-healthcheck.js

# Add Docker healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node scripts/docker-healthcheck.js

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
