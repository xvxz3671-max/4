FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/bot/package*.json ./apps/bot/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/bot ./apps/bot
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build bot
WORKDIR /app/apps/bot
RUN npm run build

# Start bot
CMD ["npm", "start"]