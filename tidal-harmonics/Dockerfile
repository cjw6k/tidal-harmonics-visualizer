# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Default command: dev server with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
