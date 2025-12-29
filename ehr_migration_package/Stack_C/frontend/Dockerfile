FROM node:18-alpine as build

WORKDIR /app

# Accept PUBLIC_URL as build argument
ARG PUBLIC_URL=/siem

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY public/ ./public/
COPY src/ ./src/

# Build the app with PUBLIC_URL
RUN PUBLIC_URL=${PUBLIC_URL} npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve
RUN npm install -g serve

# Copy build from previous stage
COPY --from=build /app/build ./build

# Copy docker entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3002

ENTRYPOINT ["/docker-entrypoint.sh"]

