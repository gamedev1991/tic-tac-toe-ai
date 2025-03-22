# Use Node.js 18 as the base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --production --no-optional

# Copy app source
COPY . .

# Set environment variables
ENV PORT=3001
ENV NODE_ENV=production

# Expose the port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"] 