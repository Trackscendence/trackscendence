FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "index.js"]
