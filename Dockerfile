# DocQuery MERN Backend - Docker Deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY node-backend/package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the backend source code
COPY node-backend/src ./src

# Ensure directories exist
RUN mkdir -p /app/uploaded

# Environment variables
ENV PORT=8000
ENV NODE_ENV=production
ENV UPLOAD_FOLDER=/app/uploaded
# Set CORS_ORIGIN at runtime: docker run -e CORS_ORIGIN=https://your-frontend.vercel.app
ENV CORS_ORIGIN=""

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8000/health || exit 1

# Start command
CMD ["node", "src/index.js"]
