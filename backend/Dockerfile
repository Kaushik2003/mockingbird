FROM oven/bun:1.3.5-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Expose port (if needed for future WebSocket)
# EXPOSE 4002

# Run the service
CMD ["bun", "run", "index.ts"]
