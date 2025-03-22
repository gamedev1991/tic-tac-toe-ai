# Use Node.js 18 as the base image
FROM node:18-slim

# Create app directory and set permissions
RUN mkdir -p /app && chown -R node:node /app

# Set working directory
WORKDIR /app

# Switch to non-root user
USER node

# Copy package files with correct ownership
COPY --chown=node:node package*.json ./
COPY --chown=node:node .npmrc ./

# Install dependencies
RUN npm ci --only=production

# Copy app source with correct ownership
COPY --chown=node:node . .

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"] 