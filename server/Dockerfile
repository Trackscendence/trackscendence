# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package configuration files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate the Prisma Client
RUN npm ci && npx prisma generate

# Copy the rest of the application files
COPY . .

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules (including generated Prisma Client) and code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/app.js ./app.js
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/prisma ./prisma

ARG PORT=3001
EXPOSE ${PORT}

CMD ["sh", "-c", "npx prisma migrate deploy && exec node index.js"]
