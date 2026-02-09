FROM alpine:3.22

RUN apk add --no-cache nodejs npm tini

RUN addgroup -S nodeapp && adduser -S -G nodeapp nodeapp

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev

COPY server.js ./
COPY public ./public
COPY tailwind ./tailwind
COPY tailwind/tailwind.config.js ./

RUN npm run tw:build

RUN chown -R nodeapp:nodeapp /app
USER nodeapp

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
