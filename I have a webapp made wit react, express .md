I have a webapp made wit react, express and postgress. I have containerized in the following way:

- frontend (client) dockerfile
```
# Stage 1: Build the React app
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

```

- nginx.conf:
```
server {
    listen 80;
    server_name localhost;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name localhost;

	ssl_certificate /etc/nginx/certs/dev.crt;
    ssl_certificate_key /etc/nginx/certs/dev.key;

    root /usr/share/nginx/html;
    index index.html;

    # gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # SPA client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy to backend API
    location /api/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

	location /socket.io/ {
        proxy_pass http://server:3001/socket.io/;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
    }
}
```

- backend (serve) dockerfile:
```
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "index.js"]
```

- compose.yaml:
```
services:
  database:
    image: postgres:17-alpine
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER -d $POSTGRES_DB"]
      interval: 5s
      timeout: 3s
      retries: 5

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    env_file: .env
    environment:
      - NODE_ENV=production
    depends_on:
      database:
        condition: service_healthy

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server

volumes:
  pgdata:
```

I use
```
docker compose up -d --build
```

to build up production

and then for developement I use:
docker compose -f compose.yaml -f compose.dev.yaml up --build

- compose.dev.yaml:
```
services:
  database:
    ports:
      - "80:80"
  server:
    build: !reset null
    image: node:22-alpine
    working_dir: /app
    command: sh -c "npm install && npx prisma generate && node --watch index.js"
    environment:
      - NODE_ENV=development
    volumes:
      - ./server:/app
      - server_node_modules:/app/node_modules
    ports:
      - "3001:3001"

  client:
    build: !reset null
    image: node:22-alpine
    working_dir: /app
    command: sh -c "npm install && npx vite --host 0.0.0.0"
    volumes:
      - ./client:/app
      - client_node_modules:/app/node_modules
    ports:
      - "5173:5173"

  adminer:
    image: adminer
    ports:
      - "8081:8080"
    depends_on:
      - database

volumes:
  server_node_modules:
  client_node_modules:
```