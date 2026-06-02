FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

ARG PORT=3001
EXPOSE ${PORT}

CMD ["sh", "-c", "npx prisma migrate deploy && exec node index.js"]
