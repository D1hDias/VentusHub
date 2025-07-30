# Multi-stage build for VentusHub
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

# Remove platform-specific packages and install dependencies
RUN npm pkg delete optionalDependencies.@rollup/rollup-win32-x64-msvc && \
    npm install

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY migrations/ ./migrations/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ventushub -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm pkg delete optionalDependencies.@rollup/rollup-win32-x64-msvc && \
    npm install --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=ventushub:nodejs /app/dist ./dist

# Copy necessary runtime files
COPY --chown=ventushub:nodejs migrations/ ./migrations/
COPY --chown=ventushub:nodejs shared/ ./shared/
COPY --chown=ventushub:nodejs drizzle.config.ts ./

# Create uploads directory
RUN mkdir -p uploads/avatars && chown -R ventushub:nodejs uploads

# Switch to non-root user
USER ventushub

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
               const options = { hostname: 'localhost', port: 5000, path: '/api/health', timeout: 2000 }; \
               const req = http.request(options, (res) => { \
                 process.exit(res.statusCode === 200 ? 0 : 1); \
               }); \
               req.on('error', () => process.exit(1)); \
               req.end();"

# Start the application
CMD ["dumb-init", "node", "dist/index.js"]